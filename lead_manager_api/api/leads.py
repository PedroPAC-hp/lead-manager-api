"""
Rotas para upload, processamento e envio de leads.
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Query
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import Annotated, List, Optional
import uuid

from lead_manager_api.schemas import (
    MessageResponse, UserInDB, StatusLead,
    UploadResponse, ProcessamentoResponse, LoteResumo
)
from lead_manager_api.database import (
    get_leads_collection, get_lotes_collection, get_produtos_collection,
    get_historico_collection, get_consultores_collection, get_disparos_collection
)
from lead_manager_api.api.auth import get_current_admin_user, get_current_active_user
from lead_manager_api.services.parser_service import (
    parse_html_xls, extrair_lead_do_registro, aplicar_filtros
)
from lead_manager_api.services.bitrix_service import obter_bitrix_service

router = APIRouter(prefix="/leads", tags=["Leads"])


@router.post("/upload/{produto_id}", response_model=UploadResponse)
async def upload_arquivo(
    produto_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)],
    arquivo: UploadFile = File(...)
):
    """
    Faz upload de um arquivo XLS/HTML do Portal NEAD.
    Retorna um preview dos dados e cria um lote para processamento.
    """
    produtos = get_produtos_collection()
    lotes = get_lotes_collection()
    leads_col = get_leads_collection()
    
    # Valida produto
    try:
        produto = produtos.find_one({"_id": ObjectId(produto_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de produto inválido")
    
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Lê o arquivo
    conteudo = await arquivo.read()
    
    try:
        registros = parse_html_xls(conteudo)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")
    
    if not registros:
        raise HTTPException(status_code=400, detail="Arquivo não contém registros válidos")
    
    # Extrai mapeamento de colunas do produto
    mapeamento = produto.get("mapeamento_colunas", {})
    
    # Cria o lote
    lote_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    lote_doc = {
        "_id": lote_id,
        "produto_id": produto_id,
        "nome_arquivo": arquivo.filename,
        "total_registros": len(registros),
        "registros_validos": 0,
        "registros_duplicados": 0,
        "registros_filtrados": 0,
        "status": "aguardando_processamento",
        "created_at": now,
        "created_by": current_user.id
    }
    lotes.insert_one(lote_doc)
    
    # Extrai e salva os leads
    leads_inseridos = []
    for registro in registros:
        lead_data = extrair_lead_do_registro(registro, mapeamento)
        
        # Valida dados mínimos
        if not lead_data.get("candidato_id") or not lead_data.get("nome"):
            continue
        
        lead_doc = {
            "lote_id": lote_id,
            "produto_id": produto_id,
            "candidato_id": lead_data["candidato_id"],
            "nome": lead_data["nome"],
            "celular": lead_data.get("celular", ""),
            "cpf": lead_data.get("cpf", ""),
            "curso_codigo": lead_data.get("curso_codigo", ""),
            "curso_nome": lead_data.get("curso_nome", ""),
            "polo": lead_data.get("polo", ""),
            "inscrito_por": lead_data.get("inscrito_por", ""),
            "status_mensalidade": lead_data.get("status_mensalidade", ""),
            "dados_extras": lead_data.get("dados_extras", {}),
            "status": StatusLead.PENDENTE.value,
            "motivo_filtro": None,
            "created_at": now
        }
        
        leads_col.insert_one(lead_doc)
        leads_inseridos.append(lead_data)
    
    # Preview dos primeiros 10 registros
    preview = leads_inseridos[:10]
    
    return UploadResponse(
        message=f"Upload realizado com sucesso! {len(leads_inseridos)} registros carregados.",
        lote_id=lote_id,
        arquivo=arquivo.filename,
        total_registros=len(leads_inseridos),
        preview=preview
    )


@router.post("/processar/{lote_id}", response_model=ProcessamentoResponse)
async def processar_lote(
    lote_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """
    Processa um lote aplicando filtros e removendo duplicados.
    """
    lotes = get_lotes_collection()
    leads_col = get_leads_collection()
    produtos = get_produtos_collection()
    historico = get_historico_collection()
    
    # Busca o lote
    lote = lotes.find_one({"_id": lote_id})
    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    
    # Busca o produto para pegar os filtros
    produto = produtos.find_one({"_id": ObjectId(lote["produto_id"])})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    filtro_inscrito_por = produto.get("filtro_inscrito_por", {"valores_permitidos": ["6111 DIGITAL"], "modo": "whitelist"})
    filtro_status = produto.get("filtro_status", {"remover": ["PAGO"]})
    
    # Busca leads pendentes do lote
    leads_pendentes = list(leads_col.find({
        "lote_id": lote_id,
        "status": StatusLead.PENDENTE.value
    }))
    
    total = len(leads_pendentes)
    duplicados = 0
    filtrados = 0
    validos = 0
    
    for lead in leads_pendentes:
        candidato_id = lead["candidato_id"]
        
        # 1. Verifica duplicado no histórico
        if historico.find_one({"candidato_id": candidato_id}):
            leads_col.update_one(
                {"_id": lead["_id"]},
                {"$set": {
                    "status": StatusLead.DUPLICADO.value,
                    "motivo_filtro": "Já enviado anteriormente"
                }}
            )
            duplicados += 1
            continue
        
        # 2. Aplica filtro de status (mensalidade)
        status_mens = lead.get("status_mensalidade", "").upper()
        status_remover = [s.upper() for s in filtro_status.get("remover", ["PAGO"])]
        
        if any(s in status_mens for s in status_remover):
            leads_col.update_one(
                {"_id": lead["_id"]},
                {"$set": {
                    "status": StatusLead.FILTRADO.value,
                    "motivo_filtro": f"Status removido: {status_mens}"
                }}
            )
            filtrados += 1
            continue
        
        # 3. Aplica filtro de "Inscrito Por"
        inscrito_por = lead.get("inscrito_por", "")
        valores_permitidos = filtro_inscrito_por.get("valores_permitidos", ["6111 DIGITAL"])
        modo = filtro_inscrito_por.get("modo", "whitelist")
        
        passou_filtro = False
        if modo == "whitelist":
            passou_filtro = any(v.upper() in inscrito_por.upper() for v in valores_permitidos)
        else:
            passou_filtro = not any(v.upper() in inscrito_por.upper() for v in valores_permitidos)
        
        if not passou_filtro:
            leads_col.update_one(
                {"_id": lead["_id"]},
                {"$set": {
                    "status": StatusLead.FILTRADO.value,
                    "motivo_filtro": f"Inscrito por não permitido: {inscrito_por}"
                }}
            )
            filtrados += 1
            continue
        
        # Lead válido!
        leads_col.update_one(
            {"_id": lead["_id"]},
            {"$set": {"status": StatusLead.PROCESSADO.value}}
        )
        validos += 1
    
    # Atualiza o lote
    lotes.update_one(
        {"_id": lote_id},
        {"$set": {
            "status": "processado",
            "registros_validos": validos,
            "registros_duplicados": duplicados,
            "registros_filtrados": filtrados
        }}
    )
    
    return ProcessamentoResponse(
        message="Processamento concluído!",
        lote_id=lote_id,
        total_processados=total,
        validos=validos,
        duplicados=duplicados,
        filtrados=filtrados,
        detalhes={
            "filtro_inscrito_por": filtro_inscrito_por,
            "filtro_status": filtro_status
        }
    )


@router.get("/lote/{lote_id}/resumo", response_model=LoteResumo)
async def resumo_lote(
    lote_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """Retorna resumo de um lote."""
    lotes = get_lotes_collection()
    leads_col = get_leads_collection()
    produtos = get_produtos_collection()
    
    lote = lotes.find_one({"_id": lote_id})
    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    
    produto = produtos.find_one({"_id": ObjectId(lote["produto_id"])})
    produto_nome = produto["nome"] if produto else "Desconhecido"
    
    # Conta por status
    pipeline = [
        {"$match": {"lote_id": lote_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    
    contagem = {item["_id"]: item["count"] for item in leads_col.aggregate(pipeline)}
    
    return LoteResumo(
        lote_id=lote_id,
        produto_nome=produto_nome,
        total=sum(contagem.values()),
        pendentes=contagem.get(StatusLead.PENDENTE.value, 0),
        processados=contagem.get(StatusLead.PROCESSADO.value, 0),
        enviados=contagem.get(StatusLead.ENVIADO.value, 0),
        duplicados=contagem.get(StatusLead.DUPLICADO.value, 0),
        filtrados=contagem.get(StatusLead.FILTRADO.value, 0),
        erros=contagem.get(StatusLead.ERRO.value, 0)
    )


@router.get("/lote/{lote_id}/leads")
async def listar_leads_lote(
    lote_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    status_filtro: Optional[str] = Query(None, description="Filtrar por status"),
    skip: int = 0,
    limit: int = 100
):
    """Lista leads de um lote."""
    leads_col = get_leads_collection()
    
    filtro = {"lote_id": lote_id}
    if status_filtro:
        filtro["status"] = status_filtro
    
    cursor = leads_col.find(filtro).skip(skip).limit(limit)
    
    leads = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        leads.append(doc)
    
    return {"leads": leads, "total": leads_col.count_documents(filtro)}


@router.post("/enviar/{lote_id}")
async def enviar_para_bitrix(
    lote_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """
    Envia os leads processados de um lote para o Bitrix24.
    Distribui entre os consultores do produto usando round-robin.
    """
    lotes = get_lotes_collection()
    leads_col = get_leads_collection()
    produtos = get_produtos_collection()
    consultores_col = get_consultores_collection()
    historico = get_historico_collection()
    disparos = get_disparos_collection()
    
    # Busca lote e produto
    lote = lotes.find_one({"_id": lote_id})
    if not lote:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    
    produto = produtos.find_one({"_id": ObjectId(lote["produto_id"])})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Busca consultores do produto que estão ativos
    hora_atual = datetime.now().hour
    consultores_ids = produto.get("consultores_ids", [])
    
    consultores_disponiveis = []
    for cid in consultores_ids:
        try:
            consultor = consultores_col.find_one({"_id": ObjectId(cid), "ativo": True})
            if consultor:
                if consultor["hora_inicio"] <= hora_atual < consultor["hora_fim"]:
                    consultores_disponiveis.append(consultor)
        except:
            continue
    
    if not consultores_disponiveis:
        raise HTTPException(
            status_code=400,
            detail="Nenhum consultor disponível no horário atual"
        )
    
    # Busca leads processados
    leads_para_enviar = list(leads_col.find({
        "lote_id": lote_id,
        "status": StatusLead.PROCESSADO.value
    }))
    
    if not leads_para_enviar:
        raise HTTPException(status_code=400, detail="Nenhum lead para enviar")
    
    # Cria registro de disparo
    disparo_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    disparo_doc = {
        "_id": disparo_id,
        "lote_id": lote_id,
        "produto_id": lote["produto_id"],
        "total_leads": len(leads_para_enviar),
        "enviados_sucesso": 0,
        "enviados_erro": 0,
        "iniciado_em": now,
        "finalizado_em": None,
        "status": "em_andamento"
    }
    disparos.insert_one(disparo_doc)
    
    # Envia para Bitrix
    bitrix = obter_bitrix_service()
    company_title = produto.get("bitrix_company_title", "Unicesumar")
    
    enviados_sucesso = 0
    enviados_erro = 0
    consultor_index = 0
    
    for lead in leads_para_enviar:
        # Round-robin entre consultores
        consultor = consultores_disponiveis[consultor_index % len(consultores_disponiveis)]
        consultor_index += 1
        
        resultado = await bitrix.criar_lead(
            nome=lead["nome"],
            telefone=lead["celular"],
            consultor_bitrix_id=consultor["bitrix_id"],
            company_title=company_title,
            cpf=lead.get("cpf"),
            curso=lead.get("curso_nome") or lead.get("curso_codigo"),
            polo=lead.get("polo"),
            candidato_id=lead.get("candidato_id"),
            base=produto["nome"]
        )
        
        if resultado["sucesso"]:
            # Atualiza lead como enviado
            leads_col.update_one(
                {"_id": lead["_id"]},
                {"$set": {
                    "status": StatusLead.ENVIADO.value,
                    "bitrix_lead_id": str(resultado.get("lead_id")),
                    "consultor_id": str(consultor["_id"]),
                    "enviado_em": datetime.now(timezone.utc)
                }}
            )
            
            # Adiciona ao histórico para evitar duplicados futuros
            try:
                historico.insert_one({
                    "candidato_id": lead["candidato_id"],
                    "produto_id": lote["produto_id"],
                    "enviado_em": datetime.now(timezone.utc),
                    "lote_id": lote_id
                })
            except:
                pass  # Ignora se já existe
            
            enviados_sucesso += 1
        else:
            leads_col.update_one(
                {"_id": lead["_id"]},
                {"$set": {
                    "status": StatusLead.ERRO.value,
                    "erro_envio": resultado.get("erro", "Erro desconhecido")
                }}
            )
            enviados_erro += 1
    
    # Finaliza disparo
    disparos.update_one(
        {"_id": disparo_id},
        {"$set": {
            "enviados_sucesso": enviados_sucesso,
            "enviados_erro": enviados_erro,
            "finalizado_em": datetime.now(timezone.utc),
            "status": "concluido"
        }}
    )
    
    return {
        "message": "Envio concluído!",
        "disparo_id": disparo_id,
        "total": len(leads_para_enviar),
        "enviados_sucesso": enviados_sucesso,
        "enviados_erro": enviados_erro,
        "consultores_utilizados": [c["nome"] for c in consultores_disponiveis]
    }


@router.get("/historico")
async def listar_historico(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista histórico de candidatos já enviados."""
    historico = get_historico_collection()
    
    cursor = historico.find().sort("enviado_em", -1).skip(skip).limit(limit)
    
    items = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        items.append(doc)
    
    return {"historico": items, "total": historico.count_documents({})}