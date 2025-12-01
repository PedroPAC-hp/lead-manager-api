"""
Módulo de rotas de autenticação.
Contém endpoints para registro e login de usuários.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timezone
from bson import ObjectId
from typing import Annotated

from lead_manager_api.schemas import (
    UserCreate, UserResponse, UserInDB, UserRole,
    Token, MessageResponse
)
from lead_manager_api.security import (
    get_password_hash, verify_password, 
    create_access_token, decode_access_token
)
from lead_manager_api.database import get_users_collection

router = APIRouter(prefix="/auth", tags=["Autenticação"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserInDB:
    """Extrai e valida o usuário atual do token JWT."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = decode_access_token(token)
    
    if token_data is None or token_data.email is None:
        raise credentials_exception
    
    users_collection = get_users_collection()
    user_doc = users_collection.find_one({"email": token_data.email})
    
    if user_doc is None:
        raise credentials_exception
    
    return UserInDB(
        id=str(user_doc["_id"]),
        email=user_doc["email"],
        full_name=user_doc["full_name"],
        hashed_password=user_doc["hashed_password"],
        role=user_doc["role"],
        is_active=user_doc["is_active"],
        created_at=user_doc["created_at"],
        updated_at=user_doc["updated_at"]
    )


async def get_current_active_user(
    current_user: Annotated[UserInDB, Depends(get_current_user)]
) -> UserInDB:
    """Verifica se o usuário atual está ativo."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    return current_user


async def get_current_admin_user(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
) -> UserInDB:
    """Verifica se o usuário atual é um administrador."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão de administrador necessária"
        )
    return current_user


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo usuário"
)
async def register(user_data: UserCreate) -> UserResponse:
    """Registra um novo usuário no sistema."""
    users_collection = get_users_collection()
    
    existing_user = users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado"
        )
    
    now = datetime.now(timezone.utc)
    user_doc = {
        "email": user_data.email,
        "full_name": user_data.full_name,
        "hashed_password": get_password_hash(user_data.password),
        "role": user_data.role.value,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    result = users_collection.insert_one(user_doc)
    
    return UserResponse(
        id=str(result.inserted_id),
        email=user_data.email,
        full_name=user_data.full_name,
        role=user_data.role,
        is_active=True,
        created_at=now
    )


@router.post(
    "/login",
    response_model=Token,
    summary="Login do usuário"
)
async def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    """Autentica o usuário e retorna um token de acesso."""
    users_collection = get_users_collection()
    
    user_doc = users_collection.find_one({"email": form_data.username})
    
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user_doc["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )
    
    access_token = create_access_token(
        data={"sub": user_doc["email"], "role": user_doc["role"]}
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Obter usuário atual"
)
async def get_me(
    current_user: Annotated[UserInDB, Depends(get_current_active_user)]
) -> UserResponse:
    """Retorna as informações do usuário autenticado."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )