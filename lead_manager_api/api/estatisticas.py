"""
Rotas para estatísticas e relatórios com dados reais.
"""

from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from typing import Annotated, Optional

from lead_manager_api.schemas import UserInDB
from lead_manager_api.database import (
    get_leads_collection, get_lotes_collection, get_produtos_collection,
    get_consultores_collection, get_disparos_collection, get_estatisticas_consultores_collection
)
from lead_manager_api.api.auth import get_current_active_user

router = APIRouter(prefix="/estatisticas", tags=["Estatísticas"])


@router.get("/dashboard")
async def dashboard_stats(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """
    Retorna estatísticas gerais para o dashboard.
    Dados REAIS do banco de dados.
    """
    leads_col = get_leads_collection()
    lotes_col = get_lotes_collection()
    consultores_col = get_consultores_collection()
    produtos_col = get_produtos_collection()
    disparos_col = get_disparos_collection()
    
    now = datetime.now(timezone.utc)
    hoje = now.replace(hour=0, minute=0, second=0, microsecond=0)
    semana_atras = hoje - timedelta(days=7)
    mes_atras = hoje - timedelta(days=30)
    
    # Contagens gerais
    total_consultores = consultores_col.count_documents({"ativo": True})
    total_produtos = produtos_col.count_documents({"ativo": True})
    
    # Leads por período
    total_leads_enviados = leads_col.count_documents({"status": "enviado"})
    leads_hoje = leads_col.count_documents({
        "status": "enviado",
        "enviado_em": {"$gte": hoje}
    })
    leads_semana = leads_col.count_documents({
        "status": "enviado",
        "enviado_em": {"$gte": semana_atras}
    })
    leads_mes = leads_col.count_documents({
        "status": "enviado",
        "enviado_em": {"$gte": mes_atras}
    })
    
    # Lotes
    total_lotes = lotes_col.count_documents({})
    lotes_processados = lotes_col.count_documents({"status": "processado"})
    lotes_enviados = disparos_col.count_documents({"status": "concluido"})
    
    # Leads pendentes (processados mas não enviados)
    leads_pendentes = leads_col.count_documents({"status": "processado"})
    
    return {
        "consultores_ativos": total_consultores,
        "produtos_ativos": total_produtos,
        "total_leads_enviados": total_leads_enviados,
        "leads_hoje": leads_hoje,
        "leads_semana": leads_semana,
        "leads_mes": leads_mes,
        "total_lotes": total_lotes,
        "lotes_pendentes": lotes_processados,
        "lotes_enviados": lotes_enviados,
        "leads_aguardando_envio": leads_pendentes
    }


@router.get("/por-consultor")
async def stats_por_consultor(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    periodo: Optional[str] = Query("todos", description="hoje, semana, mes, todos")
):
    """
    Retorna estatísticas de leads por consultor.
    Dados REAIS baseados nos envios realizados.
    """
    leads_col = get_leads_collection()
    consultores_col = get_consultores_collection()
    
    now = datetime.now(timezone.utc)
    hoje = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Define filtro de data
    filtro_data = {}
    if periodo == "hoje":
        filtro_data = {"enviado_em": {"$gte": hoje}}
    elif periodo == "semana":
        filtro_data = {"enviado_em": {"$gte": hoje - timedelta(days=7)}}
    elif periodo == "mes":
        filtro_data = {"enviado_em": {"$gte": hoje - timedelta(days=30)}}
    
    # Busca todos os consultores ativos
    consultores = list(consultores_col.find({"ativo": True}))
    
    resultado = []
    for consultor in consultores:
        consultor_id = str(consultor["_id"])
        
        # Conta leads enviados para este consultor
        filtro_leads = {"status": "enviado", "consultor_id": consultor_id}
        filtro_leads.update(filtro_data)
        
        total_leads = leads_col.count_documents(filtro_leads)
        
        # Leads hoje
        leads_hoje = leads_col.count_documents({
            "status": "enviado",
            "consultor_id": consultor_id,
            "enviado_em": {"$gte": hoje}
        })
        
        # Leads semana
        leads_semana = leads_col.count_documents({
            "status": "enviado",
            "consultor_id": consultor_id,
            "enviado_em": {"$gte": hoje - timedelta(days=7)}
        })
        
        # Leads mês
        leads_mes = leads_col.count_documents({
            "status": "enviado",
            "consultor_id": consultor_id,
            "enviado_em": {"$gte": hoje - timedelta(days=30)}
        })
        
        resultado.append({
            "id": consultor_id,
            "nome": consultor["nome"],
            "bitrix_id": consultor["bitrix_id"],
            "hora_inicio": consultor["hora_inicio"],
            "hora_fim": consultor["hora_fim"],
            "leads_total": total_leads if periodo == "todos" else leads_col.count_documents({"status": "enviado", "consultor_id": consultor_id}),
            "leads_hoje": leads_hoje,
            "leads_semana": leads_semana,
            "leads_mes": leads_mes
        })
    
    # Ordena por total de leads (maior primeiro)
    resultado.sort(key=lambda x: x["leads_total"], reverse=True)
    
    return {"consultores": resultado}


@router.get("/por-produto")
async def stats_por_produto(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """
    Retorna estatísticas de leads por produto.
    Dados REAIS baseados nos lotes e envios.
    """
    leads_col = get_leads_collection()
    lotes_col = get_lotes_collection()
    produtos_col = get_produtos_collection()
    
    now = datetime.now(timezone.utc)
    hoje = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    produtos = list(produtos_col.find({}))
    
    resultado = []
    for produto in produtos:
        produto_id = str(produto["_id"])
        
        # Conta lotes deste produto
        total_lotes = lotes_col.count_documents({"produto_id": produto_id})
        
        # Conta leads por status
        total_enviados = leads_col.count_documents({
            "produto_id": produto_id,
            "status": "enviado"
        })
        
        leads_hoje = leads_col.count_documents({
            "produto_id": produto_id,
            "status": "enviado",
            "enviado_em": {"$gte": hoje}
        })
        
        leads_semana = leads_col.count_documents({
            "produto_id": produto_id,
            "status": "enviado",
            "enviado_em": {"$gte": hoje - timedelta(days=7)}
        })
        
        # Último lote
        ultimo_lote = lotes_col.find_one(
            {"produto_id": produto_id},
            sort=[("created_at", -1)]
        )
        
        resultado.append({
            "id": produto_id,
            "nome": produto["nome"],
            "tipo": produto.get("tipo", ""),
            "ativo": produto.get("ativo", True),
            "total_lotes": total_lotes,
            "total_enviados": total_enviados,
            "leads_hoje": leads_hoje,
            "leads_semana": leads_semana,
            "ultimo_lote": ultimo_lote["nome_arquivo"] if ultimo_lote else None,
            "ultimo_lote_data": ultimo_lote["created_at"].isoformat() if ultimo_lote else None
        })
    
    resultado.sort(key=lambda x: x["total_enviados"], reverse=True)
    
    return {"produtos": resultado}


@router.get("/grafico-semanal")
async def grafico_semanal(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """
    Retorna dados para gráfico de leads enviados nos últimos 7 dias.
    """
    leads_col = get_leads_collection()
    
    now = datetime.now(timezone.utc)
    hoje = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    dias = []
    for i in range(6, -1, -1):
        dia = hoje - timedelta(days=i)
        dia_seguinte = dia + timedelta(days=1)
        
        count = leads_col.count_documents({
            "status": "enviado",
            "enviado_em": {"$gte": dia, "$lt": dia_seguinte}
        })
        
        dias.append({
            "data": dia.strftime("%Y-%m-%d"),
            "dia_semana": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][dia.weekday()],
            "leads": count,
            "is_hoje": i == 0
        })
    
    total_semana = sum(d["leads"] for d in dias)
    media_diaria = round(total_semana / 7, 1)
    
    return {
        "dias": dias,
        "total_semana": total_semana,
        "media_diaria": media_diaria
    }


@router.get("/lotes")
async def listar_lotes(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None
):
    """
    Lista todos os lotes salvos no banco com informações detalhadas.
    """
    lotes_col = get_lotes_collection()
    produtos_col = get_produtos_collection()
    disparos_col = get_disparos_collection()
    
    filtro = {}
    if status:
        filtro["status"] = status
    
    cursor = lotes_col.find(filtro).sort("created_at", -1).skip(skip).limit(limit)
    
    resultado = []
    for lote in cursor:
        # Busca nome do produto
        produto = produtos_col.find_one({"_id": ObjectId(lote["produto_id"])})
        
        # Verifica se foi enviado
        disparo = disparos_col.find_one({"lote_id": lote["_id"], "status": "concluido"})
        
        resultado.append({
            "id": lote["_id"],
            "nome": lote.get("nome", lote.get("nome_arquivo", "Sem nome")),
            "arquivo": lote.get("nome_arquivo", ""),
            "produto_id": lote["produto_id"],
            "produto_nome": produto["nome"] if produto else "Desconhecido",
            "total_registros": lote.get("total_registros", 0),
            "validos": lote.get("registros_validos", 0),
            "duplicados": lote.get("registros_duplicados", 0),
            "filtrados": lote.get("registros_filtrados", 0),
            "status": "enviado" if disparo else lote.get("status", "aguardando"),
            "created_at": lote["created_at"].isoformat() if lote.get("created_at") else None,
            "enviado_em": disparo["finalizado_em"].isoformat() if disparo and disparo.get("finalizado_em") else None
        })
    
    total = lotes_col.count_documents(filtro)
    
    return {"lotes": resultado, "total": total}


@router.put("/lotes/{lote_id}/nome")
async def renomear_lote(
    lote_id: str,
    nome: str,
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """
    Renomeia um lote.
    """
    lotes_col = get_lotes_collection()
    
    result = lotes_col.update_one(
        {"_id": lote_id},
        {"$set": {"nome": nome}}
    )
    
    if result.matched_count == 0:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    
    return {"message": "Lote renomeado com sucesso", "nome": nome}


@router.get("/disparos")
async def listar_disparos(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    skip: int = 0,
    limit: int = 50
):
    """
    Lista histórico de disparos (envios para Bitrix).
    """
    disparos_col = get_disparos_collection()
    produtos_col = get_produtos_collection()
    lotes_col = get_lotes_collection()
    
    cursor = disparos_col.find().sort("iniciado_em", -1).skip(skip).limit(limit)
    
    resultado = []
    for disparo in cursor:
        produto = produtos_col.find_one({"_id": ObjectId(disparo["produto_id"])})
        lote = lotes_col.find_one({"_id": disparo["lote_id"]})
        
        resultado.append({
            "id": disparo["_id"],
            "lote_id": disparo["lote_id"],
            "lote_nome": lote.get("nome", lote.get("nome_arquivo", "")) if lote else "",
            "produto_nome": produto["nome"] if produto else "Desconhecido",
            "total_leads": disparo.get("total_leads", 0),
            "enviados_sucesso": disparo.get("enviados_sucesso", 0),
            "enviados_erro": disparo.get("enviados_erro", 0),
            "status": disparo.get("status", ""),
            "iniciado_em": disparo["iniciado_em"].isoformat() if disparo.get("iniciado_em") else None,
            "finalizado_em": disparo["finalizado_em"].isoformat() if disparo.get("finalizado_em") else None
        })
    
    return {"disparos": resultado, "total": disparos_col.count_documents({})}
