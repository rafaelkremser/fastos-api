# Contexto do Projeto

Estou iniciando um **SaaS multi-tenant para gestão de ordens de serviço**, voltado para assistências técnicas.

## Arquivos de Referência

Leia os seguintes arquivos neste repositório:

1. `arquitetura-saas-os-v2.md` — Especificação técnica completa com a arquitetura
2. (Opcional) O projeto `learn-connect-api` que usei como base arquitetural

---

## Arquitetura

O projeto segue **Clean Architecture + DDD + SOLID**, com a seguinte estrutura:

```
src/
├── core/                    # Blocos fundamentais (agnóstico ao domínio)
│   ├── entities/            # Entity, AggregateRoot, ValueObject, UniqueEntityID
│   ├── errors/              # UseCaseError e erros genéricos
│   ├── events/              # Domain Events
│   ├── repositories/        # PaginationParams
│   └── either.ts            # Pattern Either para erros
│
├── domain/                  # Regras de negócio (agnóstico a framework)
│   └── [bounded-context]/
│       ├── application/     # Use cases e interfaces de repository
│       └── enterprise/      # Entidades e eventos de domínio
│
└── infra/                   # Implementações concretas (NestJS, Prisma)
    ├── auth/
    ├── cryptography/
    ├── database/prisma/
    │   ├── mappers/
    │   └── repositories/
    ├── env/
    ├── events/
    └── http/
        ├── controllers/
        ├── pipes/
        └── presenters/
```

---

## Padrões a Seguir

1. **Either Pattern** — Use cases retornam `Either<Error, Success>`, nunca lançam exceções
2. **Repository Pattern** — Interfaces abstratas no `domain`, implementações no `infra`
3. **Mapper Pattern** — `toDomain()` e `toPrisma()` para conversão de dados
4. **Presenter Pattern** — Para formatar respostas HTTP
5. **Dependency Injection** — Via NestJS, usando `abstract class` como token de injeção
6. **Validação com Zod** — Schemas de validação nos controllers

---

## Bounded Contexts

1. **account** — Tenant e User
2. **customer** — Clientes
3. **device** — Aparelhos
4. **service-order** — Ordens de serviço (aggregate root)
5. **notification** — Notificações (futuro)

---

## O que preciso agora

Quero começar pelo **backend**. Implemente na seguinte ordem:

### Fase 1: Core
- [ ] `src/core/entities/` (entity, aggregate-root, unique-entity-id, value-object, watched-list)
- [ ] `src/core/errors/`
- [ ] `src/core/events/`
- [ ] `src/core/either.ts`
- [ ] `src/core/repositories/pagination-params.ts`
- [ ] `src/core/types/optional.ts`

### Fase 2: Domain - Account
- [ ] Entidades: `Tenant`, `User`
- [ ] Value Objects: `Slug`
- [ ] Repositories interfaces
- [ ] Use cases: `RegisterTenant`, `AuthenticateUser`, `CreateUser`

### Fase 3: Infra - Base
- [ ] `PrismaService`
- [ ] `EnvModule` e `EnvService` com Zod
- [ ] `AuthModule` (JWT RS256)
- [ ] `CryptographyModule` (Hasher, Encrypter)

### Fase 4: Infra - Account
- [ ] Mappers: `PrismaTenantMapper`, `PrismaUserMapper`
- [ ] Repositories: `PrismaTenantsRepository`, `PrismaUsersRepository`
- [ ] Controllers: `CreateAccountController`, `AuthenticateController`
- [ ] `DatabaseModule` com providers

### Fase 5: Domain + Infra - Customer
- [ ] Entidade `Customer`
- [ ] Repository interface e implementação
- [ ] Use cases CRUD
- [ ] Controllers

### Fase 6: Domain + Infra - Device
- [ ] Entidade `Device`
- [ ] Repository interface e implementação
- [ ] Use cases CRUD
- [ ] Controllers

### Fase 7: Domain + Infra - ServiceOrder
- [ ] Entidades: `ServiceOrder` (aggregate root), `ServiceOrderItem`, `ServiceOrderHistory`
- [ ] `ServiceOrderItemList` (watched list)
- [ ] Domain Events
- [ ] Repository interfaces e implementações
- [ ] Use cases
- [ ] Controllers

---

## Regras Importantes

- **Multi-tenant**: O `tenantId` vem do JWT. Todos os use cases filtram por ele.
- **Nunca expor entidades diretamente**: Usar Presenters para respostas HTTP
- **Use cases são `@Injectable()`**: Para funcionar com DI do NestJS
- **Repositories são `abstract class`**: Não interfaces, para servir como token de DI
- **Prisma schema**: Está definido no documento de arquitetura

---

## Como quero trabalhar

1. Vá implementando fase por fase
2. Me explique brevemente o que está fazendo
3. Crie os arquivos de teste junto (quando aplicável)
4. Se tiver dúvidas sobre alguma decisão, me pergunte
5. Siga exatamente os padrões do `learn-connect-api`

**Pode começar pela Fase 1: Core.**