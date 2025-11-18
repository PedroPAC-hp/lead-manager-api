"""
Gerenciamento de conexão com MongoDB.
Usa o padrão Singleton para manter uma única conexão.
"""

import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from typing import Optional
import time
from ..core.config import settings

class DatabaseManager:
    """
    Gerenciador de banco de dados usando o padrão Singleton.
    
    Por que Singleton? Queremos apenas UMA conexão com o banco,
    não várias. Isso economiza recursos e evita problemas.
    """
    
    _instance = None
    _client: Optional[pymongo.MongoClient] = None
    _database = None
    
    def __new__(cls):
        """
        Garante que só existe uma instância desta classe.
        É como ter apenas uma porta de entrada para o banco.
        """
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance
    
    def connect(self, max_retries: int = 3) -> None:
        """
        Conecta ao MongoDB com retry automático.
        
        Por que retry? Às vezes a rede falha momentaneamente.
        Tentar algumas vezes evita falhas desnecessárias.
        """
        if self._client is not None:
            return  # Já está conectado
        
        for attempt in range(max_retries):
            try:
                print(f"🔄 Tentando conectar ao MongoDB (tentativa {attempt + 1}/{max_retries})...")
                
                # Cria a conexão
                self._client = pymongo.MongoClient(
                    settings.MONGO_URI,
                    serverSelectionTimeoutMS=5000,  # Timeout de 5 segundos
                    connectTimeoutMS=10000,  # Timeout de conexão de 10 segundos
                    retryWrites=True,  # Retry automático em falhas de escrita
                    w='majority'  # Garante que a escrita foi confirmada
                )
                
                # Testa a conexão (importante!)
                self._client.admin.command('ping')
                
                # Seleciona o database
                self._database = self._client[settings.DATABASE_NAME]
                
                print(f"✅ Conectado ao MongoDB Atlas!")
                print(f"📦 Database: {settings.DATABASE_NAME}")
                
                # Cria índices necessários
                self._create_indexes()
                
                return  # Sucesso, sai da função
                
            except ServerSelectionTimeoutError:
                print(f"⏱️ Timeout na tentativa {attempt + 1}")
                if attempt < max_retries - 1:
                    time.sleep(2)  # Espera 2 segundos antes de tentar novamente
                else:
                    raise  # Na última tentativa, lança o erro
                    
            except ConnectionFailure as e:
                print(f"❌ Falha na conexão: {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    raise
                    
            except Exception as e:
                print(f"❌ Erro inesperado: {e}")
                raise  # Erros inesperados não tentamos novamente
    
    def _create_indexes(self) -> None:
        """
        Cria índices no banco para melhorar performance.
        
        Índices são como um índice de livro - ajudam a encontrar
        informações mais rápido. Email único garante que não
        teremos dois usuários com o mesmo email.
        """
        try:
            # Índice único no email (evita duplicados)
            self._database["users"].create_index(
                "email", 
                unique=True,
                background=True  # Cria em background, não bloqueia
            )
            
            # Índice no product_name para buscas rápidas
            self._database["product_configs"].create_index(
                "product_name",
                background=True
            )
            
            # Índice composto para queries comuns
            self._database["product_configs"].create_index(
                [("user_id", 1), ("created_at", -1)],  # 1=ascendente, -1=descendente
                background=True
            )
            
            print("✅ Índices criados/verificados com sucesso")
            
        except Exception as e:
            print(f"⚠️ Aviso ao criar índices: {e}")
            # Não lançamos erro aqui pois índices podem já existir
    
    def get_database(self):
        """
        Retorna a instância do database.
        Se não estiver conectado, conecta automaticamente.
        """
        if self._database is None:
            self.connect()
        return self._database
    
    def get_collection(self, collection_name: str):
        """
        Retorna uma coleção específica.
        Coleções no MongoDB são como tabelas no SQL.
        """
        db = self.get_database()
        return db[collection_name]
    
    def disconnect(self) -> None:
        """
        Fecha a conexão com o MongoDB.
        Importante fazer isso ao desligar a aplicação.
        """
        if self._client:
            self._client.close()
            self._client = None
            self._database = None
            print("🔒 Conexão com MongoDB fechada")
    
    def health_check(self) -> dict:
        """
        Verifica a saúde da conexão.
        Útil para monitoramento em produção.
        """
        try:
            # Tenta fazer ping
            self._client.admin.command('ping')
            return {
                "status": "healthy",
                "database": settings.DATABASE_NAME,
                "connected": True
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "connected": False
            }

# Instância global do gerenciador
db_manager = DatabaseManager()

# Funções de conveniência (mais fáceis de usar)
def get_database():
    """Função helper para pegar o database"""
    return db_manager.get_database()

def get_collection(name: str):
    """Função helper para pegar uma coleção"""
    return db_manager.get_collection(name)