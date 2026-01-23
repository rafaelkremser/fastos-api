# FastOS API

SaaS Multi-Tenant para Gestão de Ordens de Serviço voltado para assistências técnicas.

## Stack Tecnológica

- **Backend**: NestJS + TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT + Refresh Token
- **Validação**: class-validator + class-transformer
- **Documentação API**: Swagger (OpenAPI)

## Instalação

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/fastos_db?schema=public"
JWT_SECRET="sua-chave-secreta-muito-segura"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="outra-chave-secreta-para-refresh"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
```

### 3. Configurar banco de dados PostgreSQL

Certifique-se de que o PostgreSQL está instalado e rodando. Crie o banco de dados:

```sql
CREATE DATABASE fastos_db;
```

### 4. Executar migrations do Prisma

```bash
# Gerar client do Prisma
npm run prisma:generate

# Executar migrations
npm run prisma:migrate
```

## Executar o projeto

### Desenvolvimento

```bash
npm run start:dev
```

A aplicação estará disponível em `http://localhost:3000`

### Documentação Swagger

Acesse `http://localhost:3000/api/docs` para visualizar a documentação interativa da API.

### Prisma Studio

Para visualizar e gerenciar os dados do banco:

```bash
npm run prisma:studio
```

## Estrutura dos Módulos

### 1. Auth
- `POST /auth/register` - Registrar novo tenant e usuário owner
- `POST /auth/login` - Fazer login
- `POST /auth/refresh` - Renovar access token

### 2. Tenants
- `GET /tenants/me` - Buscar dados do tenant atual
- `PATCH /tenants/me` - Atualizar dados do tenant

### 3. Users
- `POST /users` - Criar novo usuário
- `GET /users` - Listar usuários
- `GET /users/:id` - Buscar usuário
- `PATCH /users/:id` - Atualizar usuário
- `DELETE /users/:id` - Desativar usuário
- `PATCH /users/:id/activate` - Ativar usuário

### 4. Customers
- `POST /customers` - Criar cliente
- `GET /customers` - Listar clientes
- `GET /customers/:id` - Buscar cliente
- `PATCH /customers/:id` - Atualizar cliente
- `DELETE /customers/:id` - Excluir cliente
- `GET /customers/:id/devices` - Listar aparelhos do cliente
- `GET /customers/:id/service-orders` - Listar OS do cliente

### 5. Devices
- `POST /devices` - Criar aparelho
- `GET /devices` - Listar aparelhos
- `GET /devices/:id` - Buscar aparelho
- `PATCH /devices/:id` - Atualizar aparelho
- `DELETE /devices/:id` - Excluir aparelho

### 6. Service Orders
- `POST /service-orders` - Criar ordem de serviço
- `GET /service-orders` - Listar ordens
- `GET /service-orders/:id` - Buscar ordem
- `PATCH /service-orders/:id` - Atualizar ordem
- `PATCH /service-orders/:id/status` - Atualizar status
- `POST /service-orders/:id/items` - Adicionar item
- `DELETE /service-orders/:id/items/:itemId` - Remover item
- `GET /service-orders/:id/history` - Ver histórico
- `DELETE /service-orders/:id` - Cancelar ordem

### 7. Dashboard
- `GET /dashboard/stats` - Estatísticas gerais
- `GET /dashboard/orders-by-status` - Contagem por status
- `GET /dashboard/recent-orders` - Últimas ordens
- `GET /dashboard/revenue` - Faturamento
- `GET /dashboard/monthly-revenue` - Faturamento mensal
- `GET /dashboard/top-customers` - Principais clientes

## Fluxo de Uso

### 1. Registrar novo tenant

```bash
POST /auth/register
{
  "tenantName": "Assistência Tech",
  "name": "João Silva",
  "email": "joao@assistenciatech.com",
  "password": "senha123",
  "phone": "11987654321"
}
```

### 2. Fazer login

```bash
POST /auth/login
{
  "email": "joao@assistenciatech.com",
  "password": "senha123"
}
```

### 3. Usar o token nas requisições

Inclua o header `Authorization: Bearer <access_token>` em todas as requisições autenticadas.

## Estratégia Multi-Tenant

O sistema utiliza a estratégia de **coluna `tenant_id`** em todas as tabelas principais. Isso significa:

- Todos os dados são filtrados automaticamente pelo tenant do usuário logado
- Cada requisição autenticada extrai o `tenantId` do token JWT
- Os decorators `@CurrentTenant()` e `@CurrentUser()` facilitam o acesso aos dados do contexto

## Roles de Usuário

- **OWNER**: Dono da conta - acesso total
- **ADMIN**: Administrador - quase tudo
- **TECHNICIAN**: Técnico - ordens e clientes
- **RECEPTIONIST**: Atendente - cadastro e consulta

## Status das Ordens de Serviço

- **OPEN**: Aberta - acabou de entrar
- **IN_ANALYSIS**: Em análise - técnico avaliando
- **WAITING_APPROVAL**: Aguardando aprovação do orçamento
- **APPROVED**: Orçamento aprovado
- **IN_PROGRESS**: Em andamento - consertando
- **WAITING_PARTS**: Aguardando peças
- **COMPLETED**: Finalizada - pronta para retirada
- **DELIVERED**: Entregue ao cliente
- **CANCELLED**: Cancelada

## Desenvolvimento

### Scripts úteis

```bash
# Rodar testes
npm run test

# Rodar em modo produção
npm run build
npm run start:prod

# Lint
npm run lint

# Format
npm run format
```

## Licença

UNLICENSED
