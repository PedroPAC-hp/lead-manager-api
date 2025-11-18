# Lead Manager API 🚀

API RESTful para gerenciamento de leads e integração com Bitrix24.

## 📋 Funcionalidades

- ✅ Autenticação JWT segura
- ✅ Gerenciamento de usuários com roles (admin/member)
- ✅ CRUD de configurações de produtos
- 🔄 Integração com Bitrix24 (em desenvolvimento)
- 📊 Distribuição automática de leads

## 🛠️ Tecnologias

- **FastAPI** - Framework web moderno e rápido
- **MongoDB Atlas** - Banco de dados NoSQL na nuvem
- **Pydantic V2** - Validação de dados
- **JWT** - Autenticação segura
- **Argon2** - Hash de senhas

## 🚀 Instalação

### Pré-requisitos

- Python 3.8+
- MongoDB Atlas account
- Git

### Passos

1. Clone o repositório:
```bash
git clone https://github.com/PedroPAC-hp/lead-manager-api.git
cd lead-manager-api
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

5. Execute a aplicação:
```bash
uvicorn main:app --reload
```

Acesse: http://localhost:8000/docs

## 📁 Estrutura do Projeto
```
lead-manager-api/
├── lead_manager_api/
│   ├── api/          # Endpoints da API
│   ├── core/         # Configurações e database
│   ├── models/       # Modelos Pydantic
│   └── security/     # Autenticação e segurança
├── tests/            # Testes automatizados
├── .env.example      # Exemplo de configuração
├── requirements.txt  # Dependências
└── main.py          # Entrada da aplicação
```

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:
```env
MONGO_URI=mongodb+srv://leadmanageruser:TJ5rx1QMquEv70bg@lead-manager-cluster.dsbqynk.mongodb.net/?appName=lead-manager-cluster
DATABASE_NAME=lead_manager
SECRET_KEY=W138d66zw4eiwZiiR7YWJnqij2_LqXhMAUIVm_5YdUc
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## 📚 API Endpoints

### Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Login (retorna token JWT)
- `GET /api/auth/me` - Dados do usuário autenticado

### Configurações de Produto
- `GET /api/config/products` - Listar configurações
- `POST /api/config/products` - Criar configuração (admin)
- `GET /api/config/products/{id}` - Detalhes da configuração
- `PATCH /api/config/products/{id}` - Atualizar configuração (admin)
- `DELETE /api/config/products/{id}` - Deletar configuração (admin)

## 🧪 Testes

Execute os testes com:
```bash
pytest tests/
```

## 🚢 Deploy

### Render.com

1. Fork este repositório
2. Conecte ao Render
3. Configure as variáveis de ambiente
4. Deploy automático a cada push

## 📄 Licença

MIT

## 👥 Autor

Pedro H. Pacola

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

Feito com ❤️ e ☕