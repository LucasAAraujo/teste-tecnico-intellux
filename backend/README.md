# Intellux — Backend

API REST construída com **NestJS** + **TypeORM** + **MySQL**, com autenticação JWT, multi-tenancy por organização, upload de arquivos, convites por e-mail e compartilhamento de arquivos entre usuários.

## Deploy

| Camada | URL |
|---|---|
| **Frontend** | https://teste-tecnico-intellux.vercel.app |
| **Backend (EC2)** | https://intellux.devlucasalves.com/api |
| **Banco de dados** | MySQL hospedado na Hostinger (banco dedicado) |

## Tecnologias

- NestJS + TypeScript
- TypeORM + MySQL
- JWT (autenticação)
- Nodemailer (envio de convites)
- Multer (upload de arquivos)
- Docker (containerização para deploy na AWS EC2)

## Endpoints

### Auth
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/auth/login` | Login e geração de token JWT |

### Usuários
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/users/me` | Retorna o usuário autenticado |

### Organizações
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/organizations` | Lista organizações paginadas |
| `GET` | `/api/organizations/:id/members` | Lista membros da organização |

### Convites
| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/invites` | Lista convites da organização |
| `POST` | `/api/invites` | Envia convite por e-mail |
| `GET` | `/api/invites/validate/:token` | Valida token de convite |
| `POST` | `/api/invites/activate` | Ativa conta via convite |

### Arquivos
| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/api/files/upload` | Upload de arquivo |
| `GET` | `/api/files` | Lista arquivos do usuário |
| `GET` | `/api/files/:id` | Busca arquivo por ID |
| `PATCH` | `/api/files/:id` | Atualiza metadados do arquivo |
| `DELETE` | `/api/files/:id` | Remove arquivo |
| `GET` | `/api/files/:id/shares` | Lista compartilhamentos do arquivo |
| `POST` | `/api/files/:id/share` | Compartilha arquivo com usuários |

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=intellux

SUPER_ADMIN_EMAIL=admin@intellux.com
SUPER_ADMIN_PASSWORD=changeme
SUPER_ADMIN_NAME=Super Admin

JWT_SECRET=troque-por-um-segredo-forte
JWT_EXPIRES_IN=7d

MAIL_HOST=
MAIL_PORT=587
MAIL_FROM=noreply@intellux.com
APP_URL=https://teste-tecnico-intellux.vercel.app

NODE_ENV=production
```

## Rodando localmente

```bash
# instalar dependências
npm install

# desenvolvimento (watch)
npm run start:dev

# produção
npm run start:prod
```

## Rodando com Docker

```bash
docker compose up --build
```

## Testes

```bash
# unitários
npm run test

# e2e
npm run test:e2e

# cobertura
npm run test:cov
```
