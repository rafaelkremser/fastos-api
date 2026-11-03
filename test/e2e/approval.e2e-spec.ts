import { INestApplication } from '@nestjs/common'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { createApp } from './app'
import { http, signIn, signUp } from './api'

// As in production: TENANT_AUTO_APPROVAL off
describe('Stores waiting for approval', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createApp({ autoApproval: false })
  })

  afterAll(async () => {
    await app.close()
  })

  it('should keep a new store closed until it is activated', async () => {
    const store = await signUp(app)

    expect(store.tenant.isActive).toBe(false)
    // The API says so only when the email and password are right
    await http(app)
      .post('/authenticate')
      .send({ tenantSlug: store.slug, ...store.owner })
      .expect(403)

    // What npm run tenants:activate does
    await app
      .get(PrismaService)
      .tenant.update({ where: { slug: store.slug }, data: { isActive: true } })

    await signIn(app, store.slug, store.owner)
  })
})
