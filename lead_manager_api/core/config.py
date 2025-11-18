"""
Configurações centralizadas da aplicação.
Este arquivo lê as variáveis de ambiente e as valida.
Se algo estiver errado, a aplicação nem inicia (fail fast).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    """
    Classe de configurações usando Pydantic.
    
    Por que Pydantic? Ele valida automaticamente os tipos
    e garante que todas as configs necessárias existem.
    """
    
    # Configurações do MongoDB
    MONGO_URI: str  # Obrigatório (sem valor padrão)
    DATABASE_NAME: str = "lead_manager"  # Tem valor padrão
    
    # Segurança
    SECRET_KEY: str  # Para assinar os tokens JWT
    ALGORITHM: str = "HS256"  # Algoritmo de criptografia
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Tempo de vida do token
    
    # Ambiente
    ENVIRONMENT: str = "development"
    
    # Configuração do Pydantic Settings
    model_config = SettingsConfigDict(
        env_file=".env",  # Lê do arquivo .env
        env_file_encoding='utf-8',  # Suporta acentos
        case_sensitive=True,  # MONGO_URI é diferente de mongo_uri
        # extra="forbid"  # Descomentar para não permitir variáveis extras
    )
    
    def is_development(self) -> bool:
        """Verifica se estamos em desenvolvimento"""
        return self.ENVIRONMENT == "development"
    
    def is_production(self) -> bool:
        """Verifica se estamos em produção"""
        return self.ENVIRONMENT == "production"

# Cria uma instância única (Singleton Pattern)
# Isso garante que usamos as mesmas configs em toda aplicação
settings = Settings()

# Em desenvolvimento, mostra que carregou (ajuda no debug)
if settings.is_development():
    print(f"✅ Configurações carregadas para ambiente: {settings.ENVIRONMENT}")
    print(f"📦 Database: {settings.DATABASE_NAME}")
    # NUNCA imprima a SECRET_KEY ou MONGO_URI!