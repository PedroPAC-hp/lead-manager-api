"""
Módulo de conexão com o banco de dados MongoDB.
"""
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from lead_manager_api.config import get_settings

_client: MongoClient | None = None
_database: Database | None = None


def get_mongo_client() -> MongoClient:
    global _client
    if _client is None:
        settings = get_settings()
        _client = MongoClient(
            settings.mongodb_uri,
            serverSelectionTimeoutMS=5000
        )
    return _client


def get_database() -> Database:
    global _database
    if _database is None:
        settings = get_settings()
        client = get_mongo_client()
        _database = client[settings.database_name]
    return _database


# ==================== COLEÇÕES ====================

def get_users_collection() -> Collection:
    """Coleção de usuários"""
    return get_database()["users"]


def get_consultores_collection() -> Collection:
    """Coleção de consultores"""
    return get_database()["consultores"]


def get_produtos_collection() -> Collection:
    """Coleção de produtos (Pós, Tec, Profissionalizante)"""
    return get_database()["produtos"]


def get_leads_collection() -> Collection:
    """Coleção de leads"""
    return get_database()["leads"]


def get_lotes_collection() -> Collection:
    """Coleção de lotes de upload"""
    return get_database()["lotes"]


def get_disparos_collection() -> Collection:
    """Coleção de histórico de disparos"""
    return get_database()["disparos"]


def get_historico_collection() -> Collection:
    """Coleção de histórico de candidatos já enviados"""
    return get_database()["historico_candidatos"]


def get_estatisticas_consultores_collection() -> Collection:
    """Coleção de estatísticas por consultor"""
    return get_database()["estatisticas_consultores"]


# ==================== UTILIDADES ====================

def test_connection() -> bool:
    try:
        client = get_mongo_client()
        client.admin.command('ping')
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"Erro de conexão com MongoDB: {e}")
        return False


def close_connection() -> None:
    global _client, _database
    if _client is not None:
        _client.close()
        _client = None
        _database = None


def criar_indices():
    """Cria índices para melhor performance"""
    # Índice único para candidato_id no histórico
    get_historico_collection().create_index("candidato_id", unique=True)
    
    # Índice para busca de leads por lote
    get_leads_collection().create_index("lote_id")
    get_leads_collection().create_index("candidato_id")
    get_leads_collection().create_index([("candidato_id", 1), ("produto_id", 1)])
    
    # Índice para leads por consultor (NOVO)
    get_leads_collection().create_index("consultor_id")
    get_leads_collection().create_index([("consultor_id", 1), ("status", 1)])
    get_leads_collection().create_index([("status", 1), ("enviado_em", -1)])
    
    # Índice para consultores
    get_consultores_collection().create_index("bitrix_id", unique=True)
    
    # Índice para lotes
    get_lotes_collection().create_index("produto_id")
    get_lotes_collection().create_index([("created_at", -1)])
    
    # Índice para disparos
    get_disparos_collection().create_index("lote_id")
    get_disparos_collection().create_index([("iniciado_em", -1)])