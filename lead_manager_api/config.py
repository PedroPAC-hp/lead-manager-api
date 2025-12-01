"""
Módulo de configuração da aplicação.
Carrega e valida todas as variáveis de ambiente necessárias.
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    """
    Classe de configurações que carrega variáveis do arquivo .env
    """
    
    # Configurações do MongoDB
    mongodb_uri: str = Field(
        ...,
        description="String de conexão do MongoDB Atlas"
    )
    database_name: str = Field(
        default="lead_manager_db",
        description="Nome do banco de dados"
    )
    
    # Configurações de Segurança JWT
    secret_key: str = Field(
        ...,
        description="Chave secreta para assinatura de tokens JWT"
    )
    algorithm: str = Field(
        default="HS256",
        description="Algoritmo de criptografia para JWT"
    )
    access_token_expire_minutes: int = Field(
        default=30,
        description="Tempo de expiração do token em minutos"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """
    Retorna uma instância cacheada das configurações.
    O cache evita recarregar o .env a cada chamada.
    """
    return Settings()