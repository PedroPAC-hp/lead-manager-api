"""
Script de teste para verificar os schemas e funções de segurança.
"""

import sys
from datetime import timedelta


def main():
    print("=" * 60)
    print("TESTE DE SCHEMAS E SEGURANÇA")
    print("=" * 60)
    
    # ==================== TESTE 1: Schemas Pydantic ====================
    print("\n[1/5] Testando schemas Pydantic...")
    
    try:
        from lead_manager_api.schemas import (
            UserCreate, UserRole, ProductConfigCreate, 
            Token, LoginRequest
        )
        
        # Teste UserCreate válido
        user = UserCreate(
            email="teste@exemplo.com",
            full_name="Usuário Teste",
            password="Senha123!",
            role=UserRole.ADMIN
        )
        print(f"  ✓ UserCreate criado: {user.email}, role={user.role}")
        
        # Teste ProductConfigCreate válido
        product = ProductConfigCreate(
            name="Produto Teste",
            description="Descrição do produto",
            price=99.99,
            is_active=True
        )
        print(f"  ✓ ProductConfigCreate criado: {product.name}, preço={product.price}")
        
        # Teste Token
        token = Token(access_token="abc123", token_type="bearer")
        print(f"  ✓ Token criado: tipo={token.token_type}")
        
    except Exception as e:
        print(f"  ✗ ERRO nos schemas: {e}")
        sys.exit(1)
    
    # ==================== TESTE 2: Validação de Senha ====================
    print("\n[2/5] Testando validação de senha...")
    
    try:
        from pydantic import ValidationError
        
        # Senha fraca (sem maiúscula)
        try:
            UserCreate(
                email="teste@exemplo.com",
                full_name="Teste",
                password="senha123"
            )
            print("  ✗ ERRO: Deveria ter rejeitado senha sem maiúscula")
            sys.exit(1)
        except ValidationError:
            print("  ✓ Senha sem maiúscula rejeitada corretamente")
        
        # Senha fraca (sem número)
        try:
            UserCreate(
                email="teste@exemplo.com",
                full_name="Teste",
                password="SenhaForte"
            )
            print("  ✗ ERRO: Deveria ter rejeitado senha sem número")
            sys.exit(1)
        except ValidationError:
            print("  ✓ Senha sem número rejeitada corretamente")
            
    except Exception as e:
        print(f"  ✗ ERRO na validação: {e}")
        sys.exit(1)
    
    # ==================== TESTE 3: Hash de Senha ====================
    print("\n[3/5] Testando hash de senha...")
    
    try:
        from lead_manager_api.security import get_password_hash, verify_password
        
        senha_original = "MinhaSenha123!"
        hash_senha = get_password_hash(senha_original)
        
        print(f"  ✓ Hash gerado: {hash_senha[:20]}...")
        
        # Verificar que o hash é diferente da senha original
        if hash_senha != senha_original:
            print("  ✓ Hash é diferente da senha original")
        else:
            print("  ✗ ERRO: Hash não deveria ser igual à senha")
            sys.exit(1)
        
        # Verificar senha correta
        if verify_password(senha_original, hash_senha):
            print("  ✓ verify_password retorna True para senha correta")
        else:
            print("  ✗ ERRO: verify_password deveria retornar True")
            sys.exit(1)
        
        # Verificar senha incorreta
        if not verify_password("SenhaErrada123!", hash_senha):
            print("  ✓ verify_password retorna False para senha incorreta")
        else:
            print("  ✗ ERRO: verify_password deveria retornar False")
            sys.exit(1)
            
    except Exception as e:
        print(f"  ✗ ERRO no hash: {e}")
        sys.exit(1)
    
    # ==================== TESTE 4: Criação de Token JWT ====================
    print("\n[4/5] Testando criação de token JWT...")
    
    try:
        from lead_manager_api.security import create_access_token, decode_access_token
        
        # Criar token
        token_data = {"sub": "teste@exemplo.com", "role": "admin"}
        token = create_access_token(token_data)
        
        print(f"  ✓ Token criado: {token[:50]}...")
        
        # Verificar que é uma string não vazia
        if isinstance(token, str) and len(token) > 0:
            print("  ✓ Token é uma string válida")
        else:
            print("  ✗ ERRO: Token deveria ser uma string não vazia")
            sys.exit(1)
            
    except Exception as e:
        print(f"  ✗ ERRO na criação do token: {e}")
        sys.exit(1)
    
    # ==================== TESTE 5: Decodificação de Token JWT ====================
    print("\n[5/5] Testando decodificação de token JWT...")
    
    try:
        # Decodificar token válido
        decoded = decode_access_token(token)
        
        if decoded and decoded.email == "teste@exemplo.com":
            print(f"  ✓ Token decodificado: email={decoded.email}, role={decoded.role}")
        else:
            print("  ✗ ERRO: Falha ao decodificar token")
            sys.exit(1)
        
        # Testar token inválido
        invalid_decoded = decode_access_token("token.invalido.aqui")
        
        if invalid_decoded is None:
            print("  ✓ Token inválido retorna None corretamente")
        else:
            print("  ✗ ERRO: Token inválido deveria retornar None")
            sys.exit(1)
        
        # Testar token com expiração customizada
        short_token = create_access_token(
            {"sub": "teste@exemplo.com", "role": "user"},
            expires_delta=timedelta(hours=1)
        )
        short_decoded = decode_access_token(short_token)
        
        if short_decoded and short_decoded.email == "teste@exemplo.com":
            print("  ✓ Token com expiração customizada funciona corretamente")
        else:
            print("  ✗ ERRO: Token com expiração customizada falhou")
            sys.exit(1)
            
    except Exception as e:
        print(f"  ✗ ERRO na decodificação: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("TODOS OS TESTES PASSARAM COM SUCESSO! ✓")
    print("=" * 60)


if __name__ == "__main__":
    main()