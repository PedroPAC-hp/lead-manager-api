"""
Serviço de integração com Bitrix24.
"""

import httpx
from typing import Dict, Any, Optional, List
from datetime import datetime


class BitrixService:
    """Serviço para comunicação com a API do Bitrix24."""
    
    def __init__(self, webhook_url: str):
        """
        Inicializa o serviço.
        
        Args:
            webhook_url: URL base do webhook do Bitrix24
        """
        self.webhook_url = webhook_url.rstrip('/')
        self.timeout = 30.0
    
    async def criar_lead(
        self,
        nome: str,
        telefone: str,
        consultor_bitrix_id: int,
        company_title: str = "Unicesumar",
        cpf: Optional[str] = None,
        curso: Optional[str] = None,
        polo: Optional[str] = None,
        candidato_id: Optional[str] = None,
        base: Optional[str] = None,
        campos_extras: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Cria um lead no Bitrix24.
        
        Returns:
            Dicionário com resultado da operação
        """
        # Monta o payload
        fields = {
            "TITLE": nome,
            "NAME": nome,
            "PHONE": [{"VALUE": telefone, "VALUE_TYPE": "WORK"}],
            "COMPANY_TITLE": company_title,
            "ASSIGNED_BY_ID": consultor_bitrix_id,
            "SOURCE_ID": "SELF"
        }
        
        # Campos personalizados do Bitrix (ajuste conforme seu Bitrix)
        if cpf:
            fields["UF_CRM_1750199925"] = cpf
        if curso:
            fields["UF_CRM_1750199990"] = curso
        if polo:
            fields["UF_CRM_1750200048"] = polo
        if candidato_id:
            fields["UF_CRM_1750200103"] = candidato_id
        if base:
            fields["UF_CRM_1750207963"] = base
        
        # Adiciona campos extras se houver
        if campos_extras:
            fields.update(campos_extras)
        
        payload = {"fields": fields}
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.webhook_url}/crm.lead.add.json",
                    json=payload
                )
                
                result = response.json()
                
                if "error" in result:
                    return {
                        "sucesso": False,
                        "erro": result.get("error_description", result.get("error")),
                        "bitrix_response": result
                    }
                
                return {
                    "sucesso": True,
                    "lead_id": result.get("result"),
                    "bitrix_response": result
                }
                
        except httpx.TimeoutException:
            return {
                "sucesso": False,
                "erro": "Timeout na conexão com Bitrix24"
            }
        except Exception as e:
            return {
                "sucesso": False,
                "erro": str(e)
            }
    
    async def verificar_conexao(self) -> bool:
        """Verifica se a conexão com o Bitrix está funcionando."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.webhook_url}/profile.json"
                )
                return response.status_code == 200
        except:
            return False


def obter_bitrix_service() -> BitrixService:
    """Factory para criar instância do BitrixService."""
    # URL do webhook - pode ser movida para config depois
    webhook_url = "https://hagperformance.bitrix24.com.br/rest/10/2bw621q6mkhdklgz"
    return BitrixService(webhook_url)