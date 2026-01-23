# Arquitetura - SaaS Multi-Tenant de Ordens de Serviço

## 1. Visão Geral

Sistema SaaS para gestão de ordens de serviço voltado para assistências técnicas. Permite que múltiplas empresas (tenants) utilizem a mesma aplicação de forma isolada e segura.

### Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | NestJS + TypeScript |
| **Frontend** | React + Vite + TypeScript |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **Autenticação** | JWT + Refresh Token |
| **Validação** | class-validator + class-transformer |
| **Documentação API** | Swagger (OpenAPI) |

---

## 2. Estratégia Multi-Tenant

### Abordagem: Coluna `tenant_id`

Todas as tabelas principais possuem uma coluna `tenant_id` que referencia o tenant proprietário dos dados.

**Vantagens:**
- Simplicidade de implementação
- Custo baixo (um único banco)
- Fácil de escalar inicialmente
- Migrations simplificadas

**Desvantagens:**
- Requer cuidado para sempre filtrar por tenant
- Isolamento lógico, não físico

### Implementação no NestJS

```typescript
// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant não identificado');
    }
    
    request.tenantId = user.tenantId;
    return true;
  }
}
```

```typescript
// tenant.decorator.ts
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
```

```typescript
// Uso no controller
@Get()
async findAll(@CurrentTenant() tenantId: string) {
  return this.customersService.findAll(tenantId);
}
```

---

## 3. Modelo de Dados

### Diagrama ER (Simplificado)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Tenant    │────<│    User     │     │  Customer   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       │
       └───────────────────┬───────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Device    │
                    └─────────────┘
                           │
                    ┌──────┴──────┐
                    │ServiceOrder │
                    └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──────┐ ┌───┴───┐ ┌──────┴──────┐
       │  OSHistory  │ │OSItem │ │  OSStatus   │
       └─────────────┘ └───────┘ └─────────────┘
```

### Schema Prisma Completo

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// TENANT & AUTENTICAÇÃO
// ============================================

model Tenant {
  id        String   @id @default(uuid())
  name      String
  slug      String   @unique // identificador único (ex: "assistencia-joao")
  document  String?  // CNPJ ou CPF
  email     String
  phone     String?
  
  // Endereço
  address      String?
  addressNumber String?  @map("address_number")
  complement   String?
  neighborhood String?
  city         String?
  state        String?
  zipCode      String?  @map("zip_code")
  
  // Configurações
  isActive  Boolean  @default(true) @map("is_active")
  plan      Plan     @default(FREE)
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relacionamentos
  users         User[]
  customers     Customer[]
  devices       Device[]
  serviceOrders ServiceOrder[]
  categories    DeviceCategory[]
  
  @@map("tenants")
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}

model User {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  
  name      String
  email     String
  password  String
  role      UserRole @default(TECHNICIAN)
  
  isActive  Boolean  @default(true) @map("is_active")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relacionamentos
  tenant              Tenant         @relation(fields: [tenantId], references: [id])
  assignedOrders      ServiceOrder[] @relation("AssignedTechnician")
  createdOrders       ServiceOrder[] @relation("CreatedBy")
  serviceOrderHistory ServiceOrderHistory[]
  
  @@unique([tenantId, email])
  @@map("users")
}

enum UserRole {
  OWNER       // Dono da conta - acesso total
  ADMIN       // Administrador - quase tudo
  TECHNICIAN  // Técnico - ordens e clientes
  RECEPTIONIST // Atendente - cadastro e consulta
}

// ============================================
// CLIENTES & APARELHOS
// ============================================

model Customer {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  
  name      String
  document  String?  // CPF ou CNPJ
  email     String?
  phone     String
  phone2    String?  @map("phone_2")
  
  // Endereço
  address      String?
  addressNumber String?  @map("address_number")
  complement   String?
  neighborhood String?
  city         String?
  state        String?
  zipCode      String?  @map("zip_code")
  
  notes     String?  // Observações gerais do cliente
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relacionamentos
  tenant        Tenant         @relation(fields: [tenantId], references: [id])
  devices       Device[]
  serviceOrders ServiceOrder[]
  
  @@index([tenantId, phone])
  @@index([tenantId, name])
  @@map("customers")
}

model DeviceCategory {
  id        String   @id @default(uuid())
  tenantId  String   @map("tenant_id")
  
  name      String   // Ex: "Celular", "Notebook", "TV", "Impressora"
  
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relacionamentos
  tenant  Tenant   @relation(fields: [tenantId], references: [id])
  devices Device[]
  
  @@unique([tenantId, name])
  @@map("device_categories")
}

model Device {
  id         String   @id @default(uuid())
  tenantId   String   @map("tenant_id")
  customerId String   @map("customer_id")
  categoryId String?  @map("category_id")
  
  // Identificação do aparelho
  type       String   // Tipo livre: "Celular", "Notebook", etc
  brand      String?  // Marca: "Samsung", "Apple", etc
  model      String?  // Modelo: "Galaxy S21", "iPhone 13"
  serialNumber String? @map("serial_number")
  imei       String?  // Para celulares
  color      String?
  
  // Condição de entrada
  condition  String?  // Descrição do estado físico
  accessories String? // Acessórios que vieram junto
  
  notes      String?  // Observações do aparelho
  
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  // Relacionamentos
  tenant        Tenant          @relation(fields: [tenantId], references: [id])
  customer      Customer        @relation(fields: [customerId], references: [id])
  category      DeviceCategory? @relation(fields: [categoryId], references: [id])
  serviceOrders ServiceOrder[]
  
  @@index([tenantId, customerId])
  @@map("devices")
}

// ============================================
// ORDENS DE SERVIÇO
// ============================================

model ServiceOrder {
  id         String   @id @default(uuid())
  tenantId   String   @map("tenant_id")
  customerId String   @map("customer_id")
  deviceId   String   @map("device_id")
  
  // Controle
  number     Int      // Número sequencial por tenant
  status     OrderStatus @default(OPEN)
  priority   OrderPriority @default(NORMAL)
  
  // Técnico
  technicianId String? @map("technician_id")
  createdById  String  @map("created_by_id")
  
  // Problema e Solução
  problemDescription String  @map("problem_description") // O que o cliente relatou
  diagnosis          String? // Diagnóstico técnico
  solution           String? // O que foi feito para resolver
  
  // Datas
  entryDate       DateTime  @default(now()) @map("entry_date")
  estimatedDate   DateTime? @map("estimated_date") // Previsão de entrega
  completedDate   DateTime? @map("completed_date") // Quando foi finalizado
  deliveredDate   DateTime? @map("delivered_date") // Quando cliente retirou
  
  // Valores
  estimatedCost   Decimal?  @map("estimated_cost") @db.Decimal(10, 2)
  finalCost       Decimal?  @map("final_cost") @db.Decimal(10, 2)
  discount        Decimal?  @default(0) @db.Decimal(10, 2)
  
  // Observações
  internalNotes   String?   @map("internal_notes") // Notas internas (não visíveis ao cliente)
  customerNotes   String?   @map("customer_notes") // Notas para o cliente
  
  // Garantia
  warrantyDays    Int?      @map("warranty_days") @default(90)
  warrantyUntil   DateTime? @map("warranty_until")
  
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relacionamentos
  tenant     Tenant    @relation(fields: [tenantId], references: [id])
  customer   Customer  @relation(fields: [customerId], references: [id])
  device     Device    @relation(fields: [deviceId], references: [id])
  technician User?     @relation("AssignedTechnician", fields: [technicianId], references: [id])
  createdBy  User      @relation("CreatedBy", fields: [createdById], references: [id])
  
  items   ServiceOrderItem[]
  history ServiceOrderHistory[]
  
  @@unique([tenantId, number])
  @@index([tenantId, status])
  @@index([tenantId, customerId])
  @@index([tenantId, entryDate])
  @@map("service_orders")
}

enum OrderStatus {
  OPEN            // Aberta - acabou de entrar
  IN_ANALYSIS     // Em análise - técnico avaliando
  WAITING_APPROVAL // Aguardando aprovação do orçamento
  APPROVED        // Orçamento aprovado
  IN_PROGRESS     // Em andamento - consertando
  WAITING_PARTS   // Aguardando peças
  COMPLETED       // Finalizada - pronta para retirada
  DELIVERED       // Entregue ao cliente
  CANCELLED       // Cancelada
}

enum OrderPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

model ServiceOrderItem {
  id             String   @id @default(uuid())
  serviceOrderId String   @map("service_order_id")
  
  type        ItemType
  description String
  quantity    Int      @default(1)
  unitPrice   Decimal  @map("unit_price") @db.Decimal(10, 2)
  totalPrice  Decimal  @map("total_price") @db.Decimal(10, 2)
  
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relacionamentos
  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  
  @@map("service_order_items")
}

enum ItemType {
  SERVICE // Mão de obra
  PART    // Peça
  OTHER   // Outros
}

model ServiceOrderHistory {
  id             String   @id @default(uuid())
  serviceOrderId String   @map("service_order_id")
  userId         String?  @map("user_id")
  
  action      String   // Ex: "STATUS_CHANGED", "TECHNICIAN_ASSIGNED", "NOTE_ADDED"
  description String   // Descrição legível
  oldValue    String?  @map("old_value")
  newValue    String?  @map("new_value")
  
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relacionamentos
  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id])
  
  @@index([serviceOrderId, createdAt])
  @@map("service_order_history")
}
```

---

## 4. Estrutura do Projeto NestJS

```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── current-tenant.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── tenant.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   │
│   ├── config/
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       ├── register.dto.ts
│   │   │       └── refresh-token.dto.ts
│   │   │
│   │   ├── tenants/
│   │   │   ├── tenants.module.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   └── dto/
│   │   │       ├── create-tenant.dto.ts
│   │   │       └── update-tenant.dto.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   │
│   │   ├── customers/
│   │   │   ├── customers.module.ts
│   │   │   ├── customers.controller.ts
│   │   │   ├── customers.service.ts
│   │   │   └── dto/
│   │   │       ├── create-customer.dto.ts
│   │   │       └── update-customer.dto.ts
│   │   │
│   │   ├── devices/
│   │   │   ├── devices.module.ts
│   │   │   ├── devices.controller.ts
│   │   │   ├── devices.service.ts
│   │   │   └── dto/
│   │   │       ├── create-device.dto.ts
│   │   │       └── update-device.dto.ts
│   │   │
│   │   ├── service-orders/
│   │   │   ├── service-orders.module.ts
│   │   │   ├── service-orders.controller.ts
│   │   │   ├── service-orders.service.ts
│   │   │   └── dto/
│   │   │       ├── create-service-order.dto.ts
│   │   │       ├── update-service-order.dto.ts
│   │   │       ├── update-status.dto.ts
│   │   │       └── add-item.dto.ts
│   │   │
│   │   └── dashboard/
│   │       ├── dashboard.module.ts
│   │       ├── dashboard.controller.ts
│   │       └── dashboard.service.ts
│   │
│   └── utils/
│       └── slug.util.ts
│
├── test/
├── .env.example
├── nest-cli.json
├── package.json
└── tsconfig.json
```

---

## 5. Estrutura do Projeto React (Frontend)

```
frontend/
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── vite-env.d.ts
│   │
│   ├── api/
│   │   ├── axios.ts           # Configuração do axios com interceptors
│   │   ├── auth.api.ts
│   │   ├── customers.api.ts
│   │   ├── devices.api.ts
│   │   ├── service-orders.api.ts
│   │   └── dashboard.api.ts
│   │
│   ├── components/
│   │   ├── ui/                # Componentes base (Button, Input, Modal, etc)
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── forms/
│   │   │   ├── CustomerForm.tsx
│   │   │   ├── DeviceForm.tsx
│   │   │   └── ServiceOrderForm.tsx
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       ├── StatusBadge.tsx
│   │       └── SearchInput.tsx
│   │
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── TenantContext.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCustomers.ts
│   │   ├── useDevices.ts
│   │   └── useServiceOrders.ts
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── dashboard/
│   │   │   └── Dashboard.tsx
│   │   ├── customers/
│   │   │   ├── CustomerList.tsx
│   │   │   ├── CustomerForm.tsx
│   │   │   └── CustomerDetail.tsx
│   │   ├── devices/
│   │   │   └── DeviceList.tsx
│   │   ├── service-orders/
│   │   │   ├── ServiceOrderList.tsx
│   │   │   ├── ServiceOrderForm.tsx
│   │   │   └── ServiceOrderDetail.tsx
│   │   └── settings/
│   │       └── Settings.tsx
│   │
│   ├── routes/
│   │   ├── index.tsx
│   │   └── PrivateRoute.tsx
│   │
│   ├── styles/
│   │   └── global.css
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── customer.types.ts
│   │   ├── device.types.ts
│   │   └── service-order.types.ts
│   │
│   └── utils/
│       ├── format.ts
│       └── validators.ts
│
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

---

## 6. Fluxos Principais

### 6.1 Fluxo de Autenticação

```
1. Usuário acessa /login
2. Envia email e senha
3. Backend valida credenciais
4. Retorna JWT (access_token + refresh_token)
5. Frontend armazena tokens
6. Todas requisições incluem Authorization: Bearer <token>
7. Antes do access_token expirar, usa refresh_token para renovar
```

### 6.2 Fluxo de Abertura de OS

```
1. Atendente busca cliente pelo telefone/nome
   └─ Se não existe: cadastra novo cliente

2. Seleciona ou cadastra o aparelho
   └─ Vincula ao cliente

3. Preenche dados da OS:
   - Descrição do problema (relatado pelo cliente)
   - Prioridade
   - Data estimada (opcional)
   
4. OS criada com status "OPEN"

5. Sistema registra no histórico:
   "OS #123 criada por [Atendente]"
```

### 6.3 Fluxo de Execução da OS

```
1. Técnico vê lista de OS abertas
2. Seleciona uma OS → Status muda para "IN_ANALYSIS"
3. Técnico faz diagnóstico e registra
4. Se precisar de aprovação:
   └─ Status → "WAITING_APPROVAL"
   └─ Define orçamento (itens de serviço e peças)
   
5. Cliente aprova → Status → "APPROVED" → "IN_PROGRESS"
6. Se precisar de peças:
   └─ Status → "WAITING_PARTS"
   
7. Técnico finaliza → Status → "COMPLETED"
8. Registra solução e valores finais
9. Cliente retira → Status → "DELIVERED"
```

### 6.4 Fluxo de Consulta

```
Cliente liga perguntando sobre sua OS:

1. Atendente busca por:
   - Número da OS
   - Nome do cliente
   - Telefone

2. Visualiza status atual e histórico

3. Pode informar:
   - Em qual etapa está
   - Previsão de conclusão
   - Valor do orçamento
```

---

## 7. APIs Principais

### Autenticação

```
POST   /auth/register      # Criar nova conta (tenant + usuário owner)
POST   /auth/login         # Login
POST   /auth/refresh       # Renovar token
POST   /auth/forgot-password
POST   /auth/reset-password
```

### Clientes

```
GET    /customers          # Listar (com paginação e busca)
GET    /customers/:id      # Detalhe
POST   /customers          # Criar
PATCH  /customers/:id      # Atualizar
DELETE /customers/:id      # Remover
GET    /customers/:id/devices        # Aparelhos do cliente
GET    /customers/:id/service-orders # OS do cliente
```

### Aparelhos

```
GET    /devices            # Listar
GET    /devices/:id        # Detalhe
POST   /devices            # Criar
PATCH  /devices/:id        # Atualizar
DELETE /devices/:id        # Remover
```

### Ordens de Serviço

```
GET    /service-orders              # Listar (com filtros)
GET    /service-orders/:id          # Detalhe
POST   /service-orders              # Criar
PATCH  /service-orders/:id          # Atualizar
PATCH  /service-orders/:id/status   # Alterar status
DELETE /service-orders/:id          # Cancelar

# Itens da OS
POST   /service-orders/:id/items    # Adicionar item
PATCH  /service-orders/:id/items/:itemId
DELETE /service-orders/:id/items/:itemId

# Histórico
GET    /service-orders/:id/history  # Ver histórico
```

### Dashboard

```
GET    /dashboard/stats             # Estatísticas gerais
GET    /dashboard/orders-by-status  # Contagem por status
GET    /dashboard/recent-orders     # Últimas OS
GET    /dashboard/revenue           # Faturamento (período)
```

---

## 8. Funcionalidades do MVP

### ✅ Incluídas no MVP

- [ ] Cadastro de tenant (empresa)
- [ ] Autenticação (login, logout, refresh token)
- [ ] CRUD de usuários (com roles)
- [ ] CRUD de clientes
- [ ] CRUD de aparelhos
- [ ] CRUD de ordens de serviço
- [ ] Fluxo de status da OS
- [ ] Histórico de alterações da OS
- [ ] Itens da OS (serviços e peças)
- [ ] Dashboard básico
- [ ] Busca de clientes/OS

### 🔜 Futuras Implementações

- [ ] Notificações (email/WhatsApp quando status mudar)
- [ ] Relatórios (faturamento, produtividade)
- [ ] Impressão de OS / comprovante
- [ ] Fotos do aparelho (antes/depois)
- [ ] Assinatura digital do cliente
- [ ] Controle de estoque de peças
- [ ] Agenda de técnicos
- [ ] App mobile para técnicos
- [ ] Portal do cliente (consultar OS online)
- [ ] Integração com pagamentos

---

## 9. Comandos para Iniciar

### Backend

```bash
# Criar projeto
npx @nestjs/cli new backend
cd backend

# Instalar dependências
npm install @prisma/client class-validator class-transformer
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/swagger swagger-ui-express
npm install bcrypt
npm install -D prisma @types/bcrypt @types/passport-jwt

# Iniciar Prisma
npx prisma init

# Após configurar schema.prisma
npx prisma migrate dev --name init
npx prisma generate

# Rodar
npm run start:dev
```

### Frontend

```bash
# Criar projeto
npm create vite@latest frontend -- --template react-ts
cd frontend

# Instalar dependências
npm install react-router-dom axios
npm install @tanstack/react-query
npm install tailwindcss postcss autoprefixer
npm install lucide-react
npm install react-hook-form @hookform/resolvers zod
npm install date-fns

# Configurar Tailwind
npx tailwindcss init -p

# Rodar
npm run dev
```

---

## 10. Variáveis de Ambiente

### Backend (.env)

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/saas_os?schema=public"

# JWT
JWT_SECRET="sua-chave-secreta-muito-segura"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="outra-chave-secreta-para-refresh"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

---

## 11. Próximos Passos Recomendados

1. **Configurar ambiente de desenvolvimento**
   - Instalar Node.js, PostgreSQL
   - Criar banco de dados

2. **Iniciar backend**
   - Criar projeto NestJS
   - Configurar Prisma e rodar migrations
   - Implementar módulo de auth
   - Implementar módulo de tenants/users

3. **Implementar CRUD básico**
   - Customers
   - Devices
   - Service Orders

4. **Iniciar frontend**
   - Criar projeto React + Vite
   - Configurar rotas e autenticação
   - Criar páginas básicas

5. **Integrar front + back**
   - Testar fluxos completos
   - Ajustar conforme necessário

---

*Documento gerado para servir como guia de desenvolvimento. Atualize conforme o projeto evolui.*
