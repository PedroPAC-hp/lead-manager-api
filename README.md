# 🚀 Lead Manager API

API FastAPI para gerenciamento automatizado de leads educacionais com integração Bitrix24 CRM.

![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Sobre o Projeto

Sistema desenvolvido para automatizar o fluxo de processamento de leads do Portal NEAD (Unicesumar), substituindo processos manuais com Google Sheets por uma API robusta e escalável.

### Problema Resolvido

**Antes:** Processo manual e demorado
```
Portal NEAD → Script Python → Google Sheets → Apps Script → Bitrix24
```

**Depois:** Fluxo automatizado e centralizado
```
Portal NEAD → Lead Manager API → Bitrix24
```

### Benefícios

- ✅ Eliminação de planilhas intermediárias
- ✅ Processamento mais rápido e confiável
- ✅ Histórico completo de disparos
- ✅ Filtros customizáveis por produto
- ✅ Distribuição inteligente entre consultores
- ✅ Dashboard para acompanhamento

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Uso |
|------------|-----|
| **FastAPI** | Framework web assíncrono de alta performance |
| **MongoDB Atlas** | Banco de dados NoSQL na nuvem |
| **Pydantic** | Validação de dados e schemas |
| **JWT** | Autenticação segura com tokens |
| **BeautifulSoup4** | Parser de arquivos HTML/XLS |
| **HTTPX** | Cliente HTTP assíncrono para integração Bitrix |
| **Passlib + Bcrypt** | Hash seguro de senhas |

## 📁 Estrutura do Projeto

```
lead_manager_api_project/
├── lead_manager_api/
│   ├── __init__.py
│   ├── config.py           # Configurações via .env
│   ├── database.py         # Conexão MongoDB
│   ├── schemas.py          # Modelos Pydantic
│   ├── security.py         # JWT e hash de senhas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py         # Autenticação
│   │   ├── consultores.py  # CRUD Consultores
│   │   ├── produtos.py     # CRUD Produtos
│   │   └── leads.py        # Upload, processamento, envio
│   └── services/
│       ├── __init__.py
│       ├── parser_service.py   # Parser de arquivos XLS/HTML
│       └── bitrix_service.py   # Integração Bitrix24
├── main.py                 # Ponto de entrada da API
├── requirements.txt        # Dependências
├── .env.example           # Exemplo de variáveis de ambiente
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos

- Python 3.12+
- MongoDB Atlas (conta gratuita)
- Bitrix24 com webhook configurado

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/lead-manager-api.git
cd lead-manager-api
```

2. **Crie o ambiente virtual**
```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instale as dependências**
```bash
pip install -r requirements.txt
```

4. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais
```

5. **Execute a API**
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

6. **Acesse a documentação**
```
http://localhost:8000/docs
```

## 📡 Endpoints da API

### Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/auth/register` | Registrar novo usuário |
| POST | `/auth/login` | Login e obter token JWT |
| GET | `/auth/me` | Dados do usuário logado |

### Consultores
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/consultores/` | Listar consultores |
| POST | `/consultores/` | Criar consultor |
| PUT | `/consultores/{id}` | Atualizar consultor |
| DELETE | `/consultores/{id}` | Remover consultor |

### Produtos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/produtos/` | Listar produtos |
| POST | `/produtos/` | Criar produto |
| PUT | `/produtos/{id}` | Atualizar produto |
| POST | `/produtos/{id}/consultores/{consultor_id}` | Associar consultor |

### Leads
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/leads/upload/{produto_id}` | Upload de arquivo XLS |
| POST | `/leads/processar/{lote_id}` | Processar lote (filtros + duplicados) |
| GET | `/leads/lote/{lote_id}/resumo` | Resumo do lote |
| GET | `/leads/lote/{lote_id}/leads` | Listar leads do lote |
| POST | `/leads/enviar/{lote_id}` | Enviar para Bitrix24 |

## ⚙️ Configuração de Filtros

### Filtro "Inscrito Por"
```json
{
  "filtro_inscrito_por": {
    "valores_permitidos": ["6111 DIGITAL"],
    "modo": "whitelist"
  }
}
```

### Filtro de Status
```json
{
  "filtro_status": {
    "remover": ["PAGO"]
  }
}
```

### Mapeamento de Colunas (Customizável)
```json
{
  "mapeamento_colunas": {
    "candidato": 0,
    "nome": 3,
    "curso_codigo": 4,
    "polo": 5,
    "mensalidade": 12,
    "celular": 14,
    "cpf": 21,
    "inscrito_por": 31,
    "nome_curso": 36
  }
}
```

## 🔄 Fluxo de Uso

```mermaid
graph TD
    A[Upload Arquivo XLS] --> B[Preview dos Dados]
    B --> C[Processar Lote]
    C --> D{Aplicar Filtros}
    D --> E[Remove PAGO]
    D --> F[Filtra Inscrito Por]
    D --> G[Remove Duplicados]
    E --> H[Leads Válidos]
    F --> H
    G --> H
    H --> I[Revisar Leads]
    I --> J[Enviar para Bitrix24]
    J --> K[Histórico Atualizado]
```

## 🔐 Variáveis de Ambiente

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/
DATABASE_NAME=lead_manager_db

# JWT
SECRET_KEY=sua-chave-secreta-aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📊 Funcionalidades Futuras

- [ ] Dashboard web com React
- [ ] Agendamento automático de disparos
- [ ] Relatórios em PDF
- [ ] Integração com WhatsApp Business API
- [ ] Notificações por email

## 👨‍💻 Autor

**Pedro** - Desenvolvedor Full Stack

- LinkedIn: [Seu LinkedIn]
- GitHub: [@PedroPAC-hp](https://github.com/PedroPAC-hp)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

⭐ Se este projeto te ajudou, deixe uma estrela!
