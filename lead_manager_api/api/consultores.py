"""
Rotas para gerenciamento de consultores.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import Annotated, List

from lead_manager_api.schemas import (
    ConsultorCreate, ConsultorUpdate, ConsultorResponse,
    MessageResponse, UserInDB
)
from lead_manager_api.database import get_consultores_collection
from lead_manager_api.api.auth import get_current_admin_user, get_current_active_user

router = APIRouter(prefix="/consultores", tags=["Consultores"])


def doc_to_response(doc: dict) -> ConsultorResponse:
    return ConsultorResponse(
        id=str(doc["_id"]),
        nome=doc["nome"],
        bitrix_id=doc["bitrix_id"],
        hora_inicio=doc["hora_inicio"],
        hora_fim=doc["hora_fim"],
        ativo=doc["ativo"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"]
    )


@router.post("/", response_model=ConsultorResponse, status_code=status.HTTP_201_CREATED)
async def criar_consultor(
    data: ConsultorCreate,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Cria um novo consultor."""
    collection = get_consultores_collection()
    
    # Verifica se já existe com mesmo bitrix_id
    if collection.find_one({"bitrix_id": data.bitrix_id}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe um consultor com Bitrix ID {data.bitrix_id}"
        )
    
    now = datetime.now(timezone.utc)
    doc = {
        "nome": data.nome,
        "bitrix_id": data.bitrix_id,
        "hora_inicio": data.hora_inicio,
        "hora_fim": data.hora_fim,
        "ativo": data.ativo,
        "created_at": now,
        "updated_at": now
    }
    
    result = collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return doc_to_response(doc)


@router.get("/", response_model=List[ConsultorResponse])
async def listar_consultores(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    apenas_ativos: bool = False
):
    """Lista todos os consultores."""
    collection = get_consultores_collection()
    
    filtro = {}
    if apenas_ativos:
        filtro["ativo"] = True
    
    cursor = collection.find(filtro)
    return [doc_to_response(doc) for doc in cursor]


@router.get("/{consultor_id}", response_model=ConsultorResponse)
async def obter_consultor(
    consultor_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
):
    """Obtém um consultor por ID."""
    collection = get_consultores_collection()
    
    try:
        doc = collection.find_one({"_id": ObjectId(consultor_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Consultor não encontrado")
    
    return doc_to_response(doc)


@router.put("/{consultor_id}", response_model=ConsultorResponse)
async def atualizar_consultor(
    consultor_id: str,
    data: ConsultorUpdate,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Atualiza um consultor."""
    collection = get_consultores_collection()
    
    try:
        object_id = ObjectId(consultor_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    existing = collection.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Consultor não encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    # Verifica duplicidade de bitrix_id
    if "bitrix_id" in update_data:
        existe = collection.find_one({
            "bitrix_id": update_data["bitrix_id"],
            "_id": {"$ne": object_id}
        })
        if existe:
            raise HTTPException(status_code=400, detail="Bitrix ID já existe")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    collection.update_one({"_id": object_id}, {"$set": update_data})
    
    doc = collection.find_one({"_id": object_id})
    return doc_to_response(doc)


@router.delete("/{consultor_id}", response_model=MessageResponse)
async def deletar_consultor(
    consultor_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
):
    """Remove um consultor."""
    collection = get_consultores_collection()
    
    try:
        result = collection.delete_one({"_id": ObjectId(consultor_id)})
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID inválido")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Consultor não encontrado")
    
    return MessageResponse(message="Consultor removido com sucesso")