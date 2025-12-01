"""
Rotas para gerenciamento de produtos (Pós, Tec, Profissionalizante).
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import Annotated, List

from lead_manager_api.schemas import (
    ProdutoCreate, ProdutoUpdate, ProdutoResponse,
    MessageResponse, UserInDB
)
from lead_manager_api.database import get_produtos_collection, get_consultores_collection
from lead_manager_api.api.auth import get_current_admin_user, get_current_active_user

router = APIRouter(prefix="/produtos", tags=["Produtos"])


def doc_to_response(doc: dict) -> ProdutoResponse:
    return ProdutoResponse(
        id=str(doc["_id"]),
        nome=doc["nome"],
        tipo=doc["tipo"],
        descricao=doc.get("descricao"),
        ativo=doc["ativo"],
        filtro_inscrito_por=doc.get("filtro_inscrito_por", {}),
        filtro_status=doc.get("filtro_status", {}),
        mapeamento_colunas=doc.get("mapeamento_colunas", {}),
        consultores_ids=doc.get("consultores_ids", []),
        bitrix_company_title=doc.get("bitrix_company_title", "Unicesumar"),
        created_at=doc["created_at"],
        updated_at=doc["updated_at"]
    )


@router.post("/", response_model=ProdutoResponse, status_code=status.HTTP_201_CREATED)
async def criar_produto(
    data: ProdutoCreate,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Cria um novo produto."""
    collection = get_produtos_collection()
    
    # Verifica se já existe com mesmo nome
    if collection.find_one({"nome": data.nome}):
        raise HTTPException(status_code=400, detail=f"Produto '{data.nome}' já existe")
    
    now = datetime.now(timezone.utc)
    doc = {
        "nome": data.nome,
        "tipo": data.tipo.value,
        "descricao": data.descricao,
        "ativo": data.ativo,
        "filtro_inscrito_por": data.filtro_inscrito_por.model_dump(),
        "filtro_status": data.filtro_status.model_dump(),
        "mapeamento_colunas": data.mapeamento_colunas.model_dump(),
        "consultores_ids": data.consultores_ids,
        "bitrix_company_title": data.bitrix_company_title,
        "created_at": now,
        "updated_at": now
    }
    
    result = collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return doc_to_response(doc)


@router.get("/", response_model=List[ProdutoResponse])
async def listar_produtos(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    apenas_ativos: bool = False
):
    """Lista todos os produtos."""
    collection = get_produtos_collection()
    
    filtro = {}
    if apenas_ativos:
        filtro["ativo"] = True
    
    cursor = collection.find(filtro)
    return [doc_to_response(doc) for doc in cursor]


@router.get("/{produto_id}", response_model=ProdutoResponse)
async def obter_produto(
    produto_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """Obtém um produto por ID."""
    collection = get_produtos_collection()
    
    try:
        doc = collection.find_one({"_id": ObjectId(produto_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    return doc_to_response(doc)


@router.put("/{produto_id}", response_model=ProdutoResponse)
async def atualizar_produto(
    produto_id: str,
    data: ProdutoUpdate,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Atualiza um produto."""
    collection = get_produtos_collection()
    
    try:
        object_id = ObjectId(produto_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    existing = collection.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_data = {}
    
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            if hasattr(value, 'model_dump'):
                update_data[field] = value.model_dump()
            elif hasattr(value, 'value'):
                update_data[field] = value.value
            else:
                update_data[field] = value
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    collection.update_one({"_id": object_id}, {"$set": update_data})
    
    doc = collection.find_one({"_id": object_id})
    return doc_to_response(doc)


@router.delete("/{produto_id}", response_model=MessageResponse)
async def deletar_produto(
    produto_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Remove um produto."""
    collection = get_produtos_collection()
    
    try:
        result = collection.delete_one({"_id": ObjectId(produto_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    return MessageResponse(message="Produto removido com sucesso")


@router.post("/{produto_id}/consultores/{consultor_id}", response_model=ProdutoResponse)
async def adicionar_consultor_ao_produto(
    produto_id: str,
    consultor_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Adiciona um consultor a um produto."""
    produtos = get_produtos_collection()
    consultores = get_consultores_collection()
    
    try:
        prod_oid = ObjectId(produto_id)
        cons_oid = ObjectId(consultor_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    produto = produtos.find_one({"_id": prod_oid})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    consultor = consultores.find_one({"_id": cons_oid})
    if not consultor:
        raise HTTPException(status_code=404, detail="Consultor não encontrado")
    
    consultores_ids = produto.get("consultores_ids", [])
    if consultor_id not in consultores_ids:
        consultores_ids.append(consultor_id)
        produtos.update_one(
            {"_id": prod_oid},
            {"$set": {"consultores_ids": consultores_ids, "updated_at": datetime.now(timezone.utc)}}
        )
    
    doc = produtos.find_one({"_id": prod_oid})
    return doc_to_response(doc)


@router.delete("/{produto_id}/consultores/{consultor_id}", response_model=ProdutoResponse)
async def remover_consultor_do_produto(
    produto_id: str,
    consultor_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Remove um consultor de um produto."""
    produtos = get_produtos_collection()
    
    try:
        prod_oid = ObjectId(produto_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    produto = produtos.find_one({"_id": prod_oid})
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    consultores_ids = produto.get("consultores_ids", [])
    if consultor_id in consultores_ids:
        consultores_ids.remove(consultor_id)
        produtos.update_one(
            {"_id": prod_oid},
            {"$set": {"consultores_ids": consultores_ids, "updated_at": datetime.now(timezone.utc)}}
        )
    
    doc = produtos.find_one({"_id": prod_oid})
    return doc_to_response(doc)