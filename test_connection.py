"""
Script de teste para verificar a conexão com o MongoDB.
"""

import sys


def main():
    print("=" * 60)
    print("TESTE DE CONEXÃO COM MONGODB")
    print("=" * 60)
    
    # Teste 1: Carregar configurações
    print("\n[1/3] Carregando configurações do .env...")
    try:
        from lead_manager_api.config import get_settings
        settings = get_settings()
        print(f"  ✓ DATABASE_NAME: {settings.database_name}")
        print(f"  ✓ ALGORITHM: {settings.algorithm}")
        print(f"  ✓ ACCESS_TOKEN_EXPIRE_MINUTES: {settings.access_token_expire_minutes}")
        print(f"  ✓ MONGODB_URI: {'***configurado***' if settings.mongodb_uri else 'NÃO CONFIGURADO'}")
        print(f"  ✓ SECRET_KEY: {'***configurado***' if settings.secret_key else 'NÃO CONFIGURADO'}")
    except Exception as e:
        print(f"  ✗ ERRO ao carregar configurações: {e}")
        sys.exit(1)
    
    # Teste 2: Testar conexão com MongoDB
    print("\n[2/3] Testando conexão com MongoDB Atlas...")
    try:
        from lead_manager_api.database import test_connection, get_database
        
        if test_connection():
            print("  ✓ Conexão com MongoDB estabelecida com sucesso!")
        else:
            print("  ✗ Falha ao conectar com MongoDB")
            sys.exit(1)
    except Exception as e:
        print(f"  ✗ ERRO ao conectar: {e}")
        sys.exit(1)
    
    # Teste 3: Verificar acesso ao banco de dados
    print("\n[3/3] Verificando acesso ao banco de dados...")
    try:
        db = get_database()
        collections = db.list_collection_names()
        print(f"  ✓ Banco de dados '{settings.database_name}' acessível")
        print(f"  ✓ Coleções existentes: {collections if collections else '(nenhuma ainda)'}")
    except Exception as e:
        print(f"  ✗ ERRO ao acessar banco de dados: {e}")
        sys.exit(1)
    
    # Fechar conexão
    from lead_manager_api.database import close_connection
    close_connection()
    
    print("\n" + "=" * 60)
    print("TODOS OS TESTES PASSARAM COM SUCESSO! ✓")
    print("=" * 60)


if __name__ == "__main__":
    main()