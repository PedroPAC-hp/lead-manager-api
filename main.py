"""
Lead Manager API - Gerenciamento de Leads para Bitrix24
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from lead_manager_api.database import test_connection, close_connection, criar_indices
from lead_manager_api.api.auth import router as auth_router
from lead_manager_api.api.consultores import router as consultores_router
from lead_manager_api.api.produtos import router as produtos_router
from lead_manager_api.api.leads import router as leads_router
from lead_manager_api.api.estatisticas import router as estatisticas_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Iniciando Lead Manager API...")
    if test_connection():
        print("✓ Conexão com MongoDB estabelecida")
        criar_indices()
        print("✓ Índices criados/verificados")
    else:
        print("✗ AVISO: Falha ao conectar com MongoDB")
    yield
    print("🛑 Encerrando Lead Manager API...")
    close_connection()
    print("✓ Conexões fechadas")


app = FastAPI(
    title="Lead Manager API",
    description="""
    ## API para Gerenciamento de Leads - Integração com Bitrix24
    
    ### Funcionalidades:
    * **Autenticação**: Registro e login com JWT
    * **Consultores**: Gerenciar consultores do Bitrix (CRUD)
    * **Produtos**: Configurar Pós, Tec, Profissionalizante com filtros personalizados
    * **Leads**: Upload, processamento e envio para Bitrix24
    * **Estatísticas**: Dados reais por consultor, produto e período
    
    ### Fluxo de Uso:
    1. Criar consultores
    2. Criar produto e associar consultores
    3. Fazer upload do arquivo XLS
    4. Processar (aplica filtros e remove duplicados)
    5. Revisar leads processados
    6. Enviar para Bitrix24
    """,
    version="2.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(consultores_router)
app.include_router(produtos_router)
app.include_router(leads_router)
app.include_router(estatisticas_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Lead Manager API",
        "version": "2.1.0",
        "docs": "/docs",
        "status": "online"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    mongo_status = "healthy" if test_connection() else "unhealthy"
    return {
        "status": "healthy" if mongo_status == "healthy" else "degraded",
        "mongodb": mongo_status
    }