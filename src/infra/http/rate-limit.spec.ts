import { Test } from '@nestjs/testing'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ThrottlerModule } from '@nestjs/throttler'
import request from 'supertest'
import { InMemoryTenantsRepository } from 'test/repositories/in-memory-tenants-repository'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FakeHasher } from 'test/cryptography/fake-hasher'
import { FakeEncrypter } from 'test/cryptography/fake-encrypter'
import { FakeTransactionManager } from 'test/transactions/fake-transaction-manager'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { TenantsRepository } from '@/domain/account/application/repositories/tenants-repository'
import { UsersRepository } from '@/domain/account/application/repositories/users-repository'
import { Hasher } from '@/domain/account/application/cryptography/hasher'
import { Encrypter } from '@/domain/account/application/cryptography/encrypter'
import { AuthenticateUserUseCase } from '@/domain/account/application/use-cases/authenticate-user'
import { RegisterTenantUseCase } from '@/domain/account/application/use-cases/register-tenant'
import { EnvService } from '@/infra/env/env.service'
import { AuthenticateController } from './controllers/authenticate.controller'
import { CreateAccountController } from './controllers/create-account.controller'
import {
  LOGIN_RATE_LIMIT,
  SIGNUP_RATE_LIMIT,
  THROTTLER_OPTIONS,
} from './rate-limit'

const wrongLogin = {
  tenantSlug: 'loja',
  email: 'john@example.com',
  password: 'wrong',
}

async function createApp(trustProxyHops = 0) {
  const moduleRef = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot(THROTTLER_OPTIONS)],
    controllers: [AuthenticateController, CreateAccountController],
    providers: [
      AuthenticateUserUseCase,
      RegisterTenantUseCase,
      { provide: TenantsRepository, useClass: InMemoryTenantsRepository },
      { provide: UsersRepository, useClass: InMemoryUsersRepository },
      { provide: Hasher, useClass: FakeHasher },
      { provide: Encrypter, useClass: FakeEncrypter },
      { provide: TransactionManager, useClass: FakeTransactionManager },
      { provide: EnvService, useValue: { get: () => false } },
    ],
  }).compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>()
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops)
  }
  await app.init()
  return app
}

async function login(app: NestExpressApplication, forwardedFor?: string) {
  const req = request(app.getHttpServer()).post('/authenticate')
  if (forwardedFor) {
    req.set('X-Forwarded-For', forwardedFor)
  }
  return req.send(wrongLogin)
}

async function exhaustLogin(
  app: NestExpressApplication,
  forwardedFor?: string,
) {
  for (let i = 0; i < LOGIN_RATE_LIMIT.default.limit; i++) {
    const response = await login(app, forwardedFor)
    expect(response.status).toBe(401)
  }
}

describe('Rate limit on public auth routes', () => {
  let app: NestExpressApplication

  afterEach(async () => {
    await app.close()
  })

  it('should block login attempts over the limit with 429', async () => {
    app = await createApp()
    await exhaustLogin(app)

    const response = await login(app)

    expect(response.status).toBe(429)
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0)
  })

  it('should block sign-ups over the limit with 429', async () => {
    app = await createApp()
    const server = app.getHttpServer()

    for (let i = 0; i < SIGNUP_RATE_LIMIT.default.limit; i++) {
      const response = await request(server).post('/accounts').send({})
      expect(response.status).toBe(400)
    }

    const response = await request(server).post('/accounts').send({})

    expect(response.status).toBe(429)
  })

  it('should count login and sign-up separately', async () => {
    app = await createApp()
    await exhaustLogin(app)

    const response = await request(app.getHttpServer())
      .post('/accounts')
      .send({})

    expect(response.status).toBe(400)
  })

  it('should count each client separately behind a trusted proxy', async () => {
    app = await createApp(1)
    await exhaustLogin(app, '203.0.113.1')

    expect((await login(app, '203.0.113.1')).status).toBe(429)
    expect((await login(app, '203.0.113.2')).status).toBe(401)
  })

  it('should ignore a spoofed X-Forwarded-For when no proxy is trusted', async () => {
    app = await createApp()
    await exhaustLogin(app)

    const response = await login(app, '203.0.113.99')

    expect(response.status).toBe(429)
  })
})
