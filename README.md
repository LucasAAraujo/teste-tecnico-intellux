# Intellux Drive

Plataforma de gestão e compartilhamento de arquivos multi-tenant. Cada organização possui um Owner que gerencia membros, e todos os membros visualizam os arquivos da organização.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11 + TypeScript |
| Banco de dados | MySQL 8 |
| ORM | TypeORM 0.3 |
| Frontend | React 19 + Vite + TypeScript |
| Autenticação | JWT (Passport) |
| E-mail | Nodemailer + SMTP (Hostinger) |

---

## Pré-requisitos

- Node.js >= 18
- npm >= 9
- MySQL 8 rodando localmente (ou via Docker)
- Conta SMTP ativa (ex: Hostinger) para envio de e-mails de convite

---

## 1. Banco de dados MySQL

### Opção A — MySQL local

Crie o banco manualmente:

```sql
CREATE DATABASE intellux CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Opção B — MySQL via Docker

```bash
docker run --name intellux-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=intellux \
  -p 3306:3306 \
  -d mysql:8
```

---

## 2. Backend

### 2.1 Instalar dependências

```bash
cd backend
npm install
```

### 2.2 Configurar variáveis de ambiente

Copie o arquivo de exemplo e edite conforme seu ambiente:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```env
# Banco de dados
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=intellux

# Super Admin (usado apenas no seed)
SUPER_ADMIN_EMAIL=admin@intellux.com
SUPER_ADMIN_PASSWORD=changeme
SUPER_ADMIN_NAME=Super Admin

# JWT
JWT_SECRET=troque-por-um-segredo-forte
JWT_EXPIRES_IN=7d

# E-mail (SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=voce@seudominio.com
SMTP_PASS=sua-senha-smtp

# URL do frontend (CORS)
APP_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173

NODE_ENV=development
```

> O envio usa **Nodemailer com SSL** (`secure: true`, porta 465). As configurações acima são compatíveis com a Hostinger — substitua `SMTP_USER` e `SMTP_PASS` pelas credenciais da sua conta de e-mail.

### 2.3 Executar as migrations

As migrations criam todas as tabelas do zero:

```bash
npm run migration:run
```

### 2.4 Criar o Super Admin (Seed)

Cria o primeiro usuário `SUPER_ADMIN` com as credenciais definidas no `.env`:

```bash
npm run db:seed
```

> O seed é idempotente — se o Super Admin já existir, não duplica.

### 2.5 Iniciar o servidor

```bash
# Desenvolvimento (hot reload)
npm run start:dev

# Produção
npm run build
npm run start:prod
```

O backend sobe em **http://localhost:3000**. Todos os endpoints ficam sob o prefixo `/api`.

---

## 3. Frontend

### 3.1 Instalar dependências

```bash
cd frontend
npm install
```

### 3.2 Configurar variável de ambiente (opcional)

Por padrão o frontend aponta para `http://localhost:3000/api`. Para alterar, crie `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3.3 Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O frontend sobe em **http://localhost:5173**.

---

## 4. E-mail (SMTP)

Os e-mails de convite são enviados via **Nodemailer** usando SMTP com SSL. Configure as variáveis `SMTP_*` no `.env` com as credenciais do seu provedor (ex: Hostinger, porta 465).

Para testar localmente sem um servidor SMTP real, você pode usar um serviço como [Mailtrap](https://mailtrap.io) — basta substituir `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` e `SMTP_PASS` pelas credenciais do inbox de teste.

---

## 5. Seed — Super Admin

O script lê as variáveis `SUPER_ADMIN_*` do `.env` e cria o usuário se não existir:

```bash
cd backend
npm run db:seed
```

Para usar credenciais customizadas sem alterar o `.env`:

```bash
SUPER_ADMIN_EMAIL=outro@email.com \
SUPER_ADMIN_PASSWORD=senha123 \
SUPER_ADMIN_NAME="Outro Admin" \
npm run db:seed
```

### Criação manual via SQL (alternativa)

Substitua `$HASH` pelo hash bcrypt da senha desejada (salt rounds: 12):

```sql
INSERT INTO users (id, name, email, password_hash, role, organization_id, created_at, updated_at)
VALUES (
  UUID(),
  'Super Admin',
  'admin@intellux.com',
  '$2b$12$HASH_DA_SENHA_AQUI',
  'SUPER_ADMIN',
  NULL,
  NOW(),
  NOW()
);
```

---

## 6. Multi-tenancy

O isolamento entre organizações é feito via **JWT**, não via parâmetro na URL.

No login, o token carrega o `organizationId` do usuário:

```json
{ "sub": "uuid", "role": "OWNER", "organizationId": "uuid" }
```

Em todos os endpoints protegidos, o backend lê esse valor do token e aplica automaticamente o filtro de organização — por exemplo, `WHERE organization_id = :orgId`. Nenhuma rota aceita um `orgId` fornecido pelo cliente no body ou query, o que evita que um usuário acesse dados de outra organização forjando um ID (IDOR).

O **Super Admin** é o único usuário com `organizationId: null` no token, o que lhe permite atravessar os filtros e enxergar todas as organizações.

---

## 7. Fluxo de uso

```
1. Super Admin faz login           →  POST /api/auth/login
2. Super Admin convida um Owner    →  POST /api/invites  { email }
3. Owner ativa a conta pelo link   →  POST /api/invites/activate  { token, name, password, orgName }
4. Owner convida membros (USERs)   →  POST /api/invites  { email }
5. Membros ativam conta e acessam o Workspace
6. Todos os membros da organização visualizam todos os arquivos da empresa
```

---

## 8. Documentação dos endpoints

- Markdown: [`docs/ENDPOINTS.md`](docs/ENDPOINTS.md)
- Insomnia/Postman (JSON): [`docs/endpoints.json`](docs/endpoints.json)

---

## 9. Estrutura do projeto

```
Intellux/
├── docker-compose.yml        # MailHog
├── README.md
├── docs/
│   ├── ENDPOINTS.md
│   └── endpoints.json
├── backend/
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── auth/             # Login, JWT
│   │   ├── users/            # Perfil do usuário
│   │   ├── invites/          # Convites e ativação de conta
│   │   ├── organizations/    # Organizações e membros
│   │   ├── files/            # Upload, listagem, download
│   │   ├── database/
│   │   │   ├── entities/     # Entidades TypeORM
│   │   │   ├── migrations/   # Migrations versionadas
│   │   │   └── seeds/        # Script de seed
│   │   └── common/           # Filtros, interceptors, decorators
│   └── uploads/              # Arquivos enviados (gerado em runtime)
└── frontend/
    └── src/
        ├── pages/
        ├── features/
        ├── hooks/
        ├── services/
        ├── store/
        ├── styles/
        └── types/
```
