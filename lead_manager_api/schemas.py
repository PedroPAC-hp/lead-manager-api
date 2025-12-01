"""
Módulo de schemas Pydantic.
Define a estrutura de validação para todos os dados da API.
"""

from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ==================== ENUMS ====================

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"


class TipoProduto(str, Enum):
    POS = "pos"
    TEC = "tec"
    PROFISSIONALIZANTE = "profissionalizante"


class StatusLead(str, Enum):
    PENDENTE = "pendente"
    PROCESSADO = "processado"
    ENVIADO = "enviado"
    ERRO = "erro"
    DUPLICADO = "duplicado"
    FILTRADO = "filtrado"


class StatusEnvioBitrix(str, Enum):
    AGUARDANDO = "aguardando"
    ENVIADO = "enviado"
    ERRO = "erro"


# ==================== SCHEMAS DE USUÁRIO ====================

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="Email do usuário")
    full_name: str = Field(..., min_length=2, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)
    role: UserRole = Field(default=UserRole.USER)
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('A senha deve conter pelo menos uma letra maiúscula')
        if not any(c.islower() for c in v):
            raise ValueError('A senha deve conter pelo menos uma letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('A senha deve conter pelo menos um número')
        return v


class UserInDB(UserBase):
    id: str
    hashed_password: str
    role: UserRole
    is_active: bool = True
    created_at: datetime
    updated_at: datetime


class UserResponse(UserBase):
    id: str
    role: UserRole
    is_active: bool
    created_at: datetime


# ==================== SCHEMAS DE AUTENTICAÇÃO ====================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None


# ==================== SCHEMAS DE CONSULTOR ====================

class ConsultorBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100, description="Nome do consultor")
    bitrix_id: int = Field(..., gt=0, description="ID do consultor no Bitrix24")
    hora_inicio: int = Field(..., ge=0, le=23, description="Hora de início do expediente")
    hora_fim: int = Field(..., ge=0, le=23, description="Hora de fim do expediente")
    ativo: bool = Field(default=True, description="Se o consultor está ativo")


class ConsultorCreate(ConsultorBase):
    pass


class ConsultorUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    bitrix_id: Optional[int] = Field(None, gt=0)
    hora_inicio: Optional[int] = Field(None, ge=0, le=23)
    hora_fim: Optional[int] = Field(None, ge=0, le=23)
    ativo: Optional[bool] = None


class ConsultorResponse(ConsultorBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ==================== SCHEMAS DE PRODUTO ====================

class FiltroInscritoPor(BaseModel):
    """Configuração de filtro por 'Inscrito Por'"""
    valores_permitidos: List[str] = Field(
        default=["6111 DIGITAL"],
        description="Lista de valores permitidos na coluna 'Inscrito Por'"
    )
    modo: str = Field(
        default="whitelist",
        description="'whitelist' = só permite listados, 'blacklist' = remove listados"
    )


class FiltroStatus(BaseModel):
    """Configuração de filtro por status de mensalidade"""
    remover: List[str] = Field(
        default=["PAGO"],
        description="Lista de status a serem removidos"
    )


class MapeamentoColunas(BaseModel):
    """Mapeamento das colunas do arquivo para os campos do sistema"""
    candidato: int = Field(default=0, description="Índice da coluna Candidato")
    nome: int = Field(default=3, description="Índice da coluna Nome")
    curso_codigo: int = Field(default=4, description="Índice da coluna Código do Curso")
    polo: int = Field(default=5, description="Índice da coluna Polo")
    mensalidade: int = Field(default=12, description="Índice da coluna Mensalidade (status)")
    celular: int = Field(default=14, description="Índice da coluna Celular")
    cpf: int = Field(default=21, description="Índice da coluna CPF")
    inscrito_por: int = Field(default=31, description="Índice da coluna Inscrito Por")
    nome_curso: int = Field(default=36, description="Índice da coluna Nome do Curso completo")


class ProdutoBase(BaseModel):
    nome: str = Field(..., min_length=2, max_length=100, description="Nome do produto")
    tipo: TipoProduto = Field(..., description="Tipo do produto")
    descricao: Optional[str] = Field(None, max_length=500)
    ativo: bool = Field(default=True)
    
    # Configurações de filtros
    filtro_inscrito_por: FiltroInscritoPor = Field(default_factory=FiltroInscritoPor)
    filtro_status: FiltroStatus = Field(default_factory=FiltroStatus)
    
    # Mapeamento de colunas (customizável)
    mapeamento_colunas: MapeamentoColunas = Field(default_factory=MapeamentoColunas)
    
    # IDs dos consultores associados a este produto
    consultores_ids: List[str] = Field(default=[], description="IDs dos consultores deste produto")
    
    # Configuração do Bitrix
    bitrix_company_title: str = Field(
        default="Unicesumar",
        description="Nome da empresa no Bitrix"
    )


class ProdutoCreate(ProdutoBase):
    pass


class ProdutoUpdate(BaseModel):
    nome: Optional[str] = Field(None, min_length=2, max_length=100)
    tipo: Optional[TipoProduto] = None
    descricao: Optional[str] = Field(None, max_length=500)
    ativo: Optional[bool] = None
    filtro_inscrito_por: Optional[FiltroInscritoPor] = None
    filtro_status: Optional[FiltroStatus] = None
    mapeamento_colunas: Optional[MapeamentoColunas] = None
    consultores_ids: Optional[List[str]] = None
    bitrix_company_title: Optional[str] = None


class ProdutoResponse(ProdutoBase):
    id: str
    created_at: datetime
    updated_at: datetime


# ==================== SCHEMAS DE LEAD ====================

class LeadBase(BaseModel):
    candidato_id: str = Field(..., description="ID único do candidato (coluna A)")
    nome: str = Field(..., description="Nome do candidato")
    celular: str = Field(..., description="Telefone celular")
    cpf: Optional[str] = Field(None, description="CPF")
    curso_codigo: Optional[str] = Field(None, description="Código do curso")
    curso_nome: Optional[str] = Field(None, description="Nome completo do curso")
    polo: Optional[str] = Field(None, description="Polo")
    inscrito_por: Optional[str] = Field(None, description="Inscrito por")
    status_mensalidade: Optional[str] = Field(None, description="Status da mensalidade")
    dados_extras: Optional[Dict[str, Any]] = Field(None, description="Dados adicionais")


class LeadCreate(LeadBase):
    produto_id: str = Field(..., description="ID do produto")
    lote_id: str = Field(..., description="ID do lote de upload")


class LeadInDB(LeadBase):
    id: str
    produto_id: str
    lote_id: str
    status: StatusLead = StatusLead.PENDENTE
    motivo_filtro: Optional[str] = None
    bitrix_lead_id: Optional[str] = None
    consultor_id: Optional[str] = None
    enviado_em: Optional[datetime] = None
    erro_envio: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class LeadResponse(LeadInDB):
    pass


# ==================== SCHEMAS DE LOTE ====================

class LoteUpload(BaseModel):
    id: str
    produto_id: str
    nome_arquivo: str
    total_registros: int
    registros_validos: int
    registros_duplicados: int
    registros_filtrados: int
    status: str
    created_at: datetime


class LoteResumo(BaseModel):
    lote_id: str
    produto_nome: str
    total: int
    pendentes: int
    processados: int
    enviados: int
    duplicados: int
    filtrados: int
    erros: int


# ==================== SCHEMAS DE DISPARO ====================

class DisparoCreate(BaseModel):
    lote_id: str
    produto_id: str


class DisparoResponse(BaseModel):
    id: str
    lote_id: str
    produto_id: str
    total_leads: int
    enviados_sucesso: int
    enviados_erro: int
    iniciado_em: datetime
    finalizado_em: Optional[datetime] = None
    status: str


# ==================== SCHEMAS DE RESPOSTA GENÉRICOS ====================

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None


class UploadResponse(BaseModel):
    message: str
    lote_id: str
    arquivo: str
    total_registros: int
    preview: List[Dict[str, Any]]


class ProcessamentoResponse(BaseModel):
    message: str
    lote_id: str
    total_processados: int
    validos: int
    duplicados: int
    filtrados: int
    detalhes: Dict[str, Any]