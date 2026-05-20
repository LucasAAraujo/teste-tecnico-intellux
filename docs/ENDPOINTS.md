# Intellux Drive — Endpoints

Base URL: `http://localhost:3000/api`

Todas as respostas são encapsuladas pelo interceptor global:
```json
{ "data": <payload> }
```

Rotas protegidas exigem o header:
```
Authorization: Bearer <token>
```

---

## Autenticação

### POST `/auth/login`
Login com e-mail e senha. Retorna o JWT de acesso.

**Público** — sem autenticação.

**Body:**
```json
{
  "email": "admin@intellux.com",
  "password": "changeme"
}
```

**Resposta 200:**
```json
{
  "data": {
    "accessToken": "eyJhbGci..."
  }
}
```

---

## Usuário

### GET `/users/me`
Retorna o perfil do usuário autenticado.

**Roles:** todas.

**Resposta 200:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Nome",
    "email": "email@exemplo.com",
    "role": "OWNER",
    "organizationId": "uuid | null"
  }
}
```

---

## Convites

### GET `/invites`
Lista os convites. Super Admin vê todos; Owner vê apenas da sua organização.

**Roles:** `SUPER_ADMIN`, `OWNER`.

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "novo@empresa.com",
      "role": "USER",
      "expiresAt": "2025-01-01T00:00:00.000Z",
      "acceptedAt": null,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### POST `/invites`
Cria um convite por e-mail. Super Admin gera convites de `OWNER`; Owner gera convites de `USER`.

**Roles:** `SUPER_ADMIN`, `OWNER`.

**Body:**
```json
{
  "email": "novo@empresa.com"
}
```

**Resposta 201:**
```json
{
  "data": {
    "id": "uuid",
    "email": "novo@empresa.com",
    "role": "USER",
    "token": "uuid-do-token",
    "expiresAt": "2025-01-03T00:00:00.000Z"
  }
}
```

> Um e-mail com o link de ativação é enviado automaticamente para o convidado.

---

### GET `/invites/validate/:token`
Valida o token do convite e retorna os dados para o formulário de ativação.

**Público** — sem autenticação.

**Resposta 200:**
```json
{
  "data": {
    "email": "novo@empresa.com",
    "role": "OWNER"
  }
}
```

**Erros:**
- `400` — Token expirado
- `404` — Token inválido
- `409` — Convite já aceito

---

### POST `/invites/activate`
Aceita o convite e cria a conta do usuário. Se `role = OWNER`, cria também a organização.

**Público** — sem autenticação.

**Body (role = USER):**
```json
{
  "token": "uuid-do-token",
  "name": "João Silva",
  "password": "senha123"
}
```

**Body (role = OWNER):**
```json
{
  "token": "uuid-do-token",
  "name": "Maria Souza",
  "password": "senha123",
  "orgName": "Empresa XPTO"
}
```

**Resposta 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "Maria Souza",
    "email": "maria@xpto.com",
    "role": "OWNER",
    "organizationId": "uuid"
  }
}
```

---

## Organizações

### GET `/organizations`
Lista organizações. Super Admin recebe lista paginada; Owner recebe apenas a sua.

**Roles:** todas.

**Query params:**
| Parâmetro | Tipo | Padrão | Descrição |
|---|---|---|---|
| `page` | number | 1 | Página atual |
| `limit` | number | 10 | Itens por página |

**Resposta 200:**
```json
{
  "data": {
    "items": [
      { "id": "uuid", "name": "Empresa XPTO", "createdAt": "..." }
    ],
    "total": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### GET `/organizations/:organizationId/members`
Lista os membros de uma organização.

**Roles:** `SUPER_ADMIN`, `OWNER` (da mesma org).

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "role": "USER",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Arquivos

### POST `/files/upload`
Faz upload de um arquivo para a organização.

**Roles:** `OWNER`, `USER`.

**Content-Type:** `multipart/form-data`

**Campo:** `file` (arquivo binário)

**Tipos permitidos:** `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `text/plain`, `text/csv`, `application/pdf`

**Tamanho máximo:** 10 MB

**Resposta 201:**
```json
{
  "data": {
    "id": "uuid",
    "name": "relatorio.pdf",
    "type": "TEXT",
    "mimeType": "application/pdf",
    "sizeBytes": 204800,
    "storagePath": "uploads/uuid.pdf",
    "uploadedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

### GET `/files`
Lista os arquivos da organização do usuário autenticado.

**Roles:** `OWNER`, `USER`.

**Query params:**
| Parâmetro | Tipo | Descrição |
|---|---|---|
| `type` | `TEXT` \| `IMAGE` | Filtrar por tipo |
| `search` | string | Busca por nome (LIKE) |
| `from` | ISO date | `uploadedAt >=` |
| `to` | ISO date | `uploadedAt <=` |
| `userId` | UUID | Filtrar por uploader (apenas OWNER) |

**Resposta 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "foto.png",
      "type": "IMAGE",
      "mimeType": "image/png",
      "sizeBytes": 512000,
      "storagePath": "uploads/uuid.png",
      "uploadedAt": "2025-01-01T00:00:00.000Z",
      "uploader": { "id": "uuid", "name": "João Silva" }
    }
  ]
}
```

---

### GET `/files/:id`
Retorna os detalhes de um arquivo.

**Roles:** `OWNER`, `USER` (da mesma organização).

**Resposta 200:** mesmo formato de um item de `GET /files`.

---

### PATCH `/files/:id`
Renomeia um arquivo.

**Roles:** `OWNER`, `USER` (USER só pode editar arquivos próprios).

**Body:**
```json
{
  "name": "novo-nome.pdf"
}
```

**Resposta 200:** arquivo atualizado.

---

### DELETE `/files/:id`
Remove o arquivo do banco e do disco.

**Roles:** `OWNER`.

**Resposta:** `204 No Content`

---

## Arquivos estáticos

### GET `/uploads/:filename`
Serve o arquivo binário diretamente (imagens, PDFs, etc.).

**Público** — sem autenticação.

**Exemplo:** `http://localhost:3000/uploads/550e8400-e29b-41d4-a716.png`

---

## Códigos de resposta

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Criado |
| 204 | Sem conteúdo (DELETE) |
| 400 | Requisição inválida |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (duplicata) |

---

## Resumo de roles

| Role | Pode fazer |
|---|---|
| `SUPER_ADMIN` | Listar orgs, convidar Owners, ver métricas globais |
| `OWNER` | Gerenciar membros, upload/download/delete de arquivos da org |
| `USER` | Upload/download de arquivos, visualizar todos os arquivos da org |
