import { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'

interface CreateAppOptions {
  // New stores open right away unless this is false
  autoApproval?: boolean
}

// The whole API, as main.ts starts it, against the temporary database. The
// environment is read when AppModule is first imported, so each test file
// (which Jest loads on its own) can choose it once, here
export async function createApp({
  autoApproval = true,
}: CreateAppOptions = {}) {
  process.env.TENANT_AUTO_APPROVAL = String(autoApproval)

  const { AppModule } = await import('@/infra/app.module')
  const { EnvService } = await import('@/infra/env/env.service')
  const { configureHttp } = await import('@/infra/http/configure-http')

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>()
  const env = app.get(EnvService)

  configureHttp(app, {
    corsOrigins: env.get('CORS_ORIGINS'),
    trustProxyHops: env.get('TRUST_PROXY_HOPS'),
    swaggerEnabled: false,
  })
  await app.init()

  return app
}
