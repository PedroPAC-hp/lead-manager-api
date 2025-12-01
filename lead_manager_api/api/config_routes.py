"""
Módulo de rotas para configurações de produto.
CRUD completo protegido por autenticação de administrador.
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import Annotated, List

from lead_manager_api.schemas import (
    ProductConfigCreate, ProductConfigUpdate, 
    ProductConfigResponse, MessageResponse, UserInDB
)
from lead_manager_api.database import get_product_configs_collection
from lead_manager_api.api.auth import get_current_admin_user, get_current_active_user

# Router para endpoints de configuração de produto
router = APIRouter(
    prefix="/configs",
    tags=["Configurações de Produto"]
)


def product_doc_to_response(doc: dict) -> ProductConfigResponse:
    """
    Converte um documento do MongoDB para ProductConfigResponse.
    """
    return ProductConfigResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        description=doc.get("description"),
        price=doc["price"],
        is_active=doc["is_active"],
        metadata=doc.get("metadata"),
        created_by=doc["created_by"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"]
    )


@router.post(
    "/",
    response_model=ProductConfigResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar configuração de produto",
    description="Cria uma nova configuração de produto. Requer permissão de administrador."
)
async def create_product_config(
    config_data: ProductConfigCreate,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
) -> ProductConfigResponse:
    """
    Cria uma nova configuração de produto.
    """
    configs_collection = get_product_configs_collection()
    
    # Verificar se já existe produto com mesmo nome
    existing = configs_collection.find_one({"name": config_data.name})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Já existe uma configuração com o nome '{config_data.name}'"
        )
    
    # Criar documento
    now = datetime.now(timezone.utc)
    config_doc = {
        "name": config_data.name,
        "description": config_data.description,
        "price": config_data.price,
        "is_active": config_data.is_active,
        "metadata": config_data.metadata,
        "created_by": current_user.id,
        "created_at": now,
        "updated_at": now
    }
    
    # Inserir no banco
    result = configs_collection.insert_one(config_doc)
    config_doc["_id"] = result.inserted_id
    
    return product_doc_to_response(config_doc)


@router.get(
    "/",
    response_model=List[ProductConfigResponse],
    summary="Listar configurações de produto",
    description="Lista todas as configurações de produto. Requer autenticação."
)
async def list_product_configs(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)],
    skip: int = Query(0, ge=0, description="Número de registros para pular"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    active_only: bool = Query(False, description="Filtrar apenas produtos ativos")
) -> List[ProductConfigResponse]:
    """
    Lista todas as configurações de produto.
    """
    configs_collection = get_product_configs_collection()
    
    # Construir filtro
    query_filter = {}
    if active_only:
        query_filter["is_active"] = True
    
    # Buscar documentos
    cursor = configs_collection.find(query_filter).skip(skip).limit(limit)
    
    return [product_doc_to_response(doc) for doc in cursor]


@router.get(
    "/{config_id}",
    response_model=ProductConfigResponse,
    summary="Obter configuração por ID",
    description="Obtém uma configuração de produto específica. Requer autenticação."
)
async def get_product_config(
    config_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
) -> ProductConfigResponse:
    """
    Obtém uma configuração de produto pelo ID.
    """
    configs_collection = get_product_configs_collection()
    
    try:
        object_id = ObjectId(config_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    config_doc = configs_collection.find_one({"_id": object_id})
    
    if not config_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração não encontrada"
        )
    
    return product_doc_to_response(config_doc)


@router.put(
    "/{config_id}",
    response_model=ProductConfigResponse,
    summary="Atualizar configuração de produto",
    description="Atualiza uma configuração de produto existente. Requer permissão de administrador."
)
async def update_product_config(
    config_id: str,
    config_data: ProductConfigUpdate,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
) -> ProductConfigResponse:
    """
    Atualiza uma configuração de produto.
    """
    configs_collection = get_product_configs_collection()
    
    try:
        object_id = ObjectId(config_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    # Verificar se existe
    existing = configs_collection.find_one({"_id": object_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração não encontrada"
        )
    
    # Construir update com apenas campos fornecidos
    update_data = config_data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nenhum campo para atualizar"
        )
    
    # Se está tentando mudar o nome, verificar duplicidade
    if "name" in update_data and update_data["name"] != existing["name"]:
        name_exists = configs_collection.find_one({
            "name": update_data["name"],
            "_id": {"$ne": object_id}
        })
        if name_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Já existe uma configuração com o nome '{update_data['name']}'"
            )
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    # Atualizar
    configs_collection.update_one(
        {"_id": object_id},
        {"$set": update_data}
    )
    
    # Buscar documento atualizado
    updated_doc = configs_collection.find_one({"_id": object_id})
    
    return product_doc_to_response(updated_doc)


@router.delete(
    "/{config_id}",
    response_model=MessageResponse,
    summary="Deletar configuração de produto",
    description="Remove uma configuração de produto. Requer permissão de administrador."
)
async def delete_product_config(
    config_id: str,
    current_user: Annotated[UserInDB, Depends(get_current_admin_user)]
) -> MessageResponse:
    """
    Remove uma configuração de produto pelo ID.
    """
    configs_collection = get_product_configs_collection()
    
    try:
        object_id = ObjectId(config_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID inválido"
        )
    
    # Tentar deletar
    result = configs_collection.delete_one({"_id": object_id})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuração não encontrada"
        )
    
    return MessageResponse(
        message="Configuração deletada com sucesso",
        detail=f"ID: {config_id}"
    )