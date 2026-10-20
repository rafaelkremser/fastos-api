import { Controller, Get, Req } from '@nestjs/common'
import { NestExpressApplication } from '@nestjs/platform-express'
import { Test } from '@nestjs/testing'
import { Request } from 'express'
import request from 'supertest'
import { configureHttp, SWAGGER_PATH } from './configure-http'

@Controller('/probe')
class ProbeController {
  @Get()
  probe(@Req() req: Request) {
    return { ip: req.ip }
  }
}

const defaults = {
  corsOrigins: ['http://localhost:5173', 'https://*.fastos.com'],
  trustProxyHops: 0,
  swaggerEnabled: false,
}

async function createApp(options: Partial<typeof defaults> = {}) {
  const moduleRef = await Test.createTestingModule({
    controllers: [ProbeController],
  }).compile()

  const app = moduleRef.createNestApplication<NestExpressApplication>()
  configureHttp(app, { ...defaults, ...options })
  await app.init()
  return app
}

describe('HTTP configuration', () => {
  let app: NestExpressApplication

  afterEach(async () => {
    await app.close()
  })

  it('should send security headers and hide the framework', async () => {
    app = await createApp()

    const response = await request(app.getHttpServer()).get('/probe')

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['strict-transport-security']).toBeDefined()
    expect(response.headers['content-security-policy']).toBeDefined()
    expect(response.headers['x-powered-by']).toBeUndefined()
  })

  it.each(['http://localhost:5173', 'https://loja-a.fastos.com'])(
    'should allow the browser origin %s',
    async (origin) => {
      app = await createApp()

      const response = await request(app.getHttpServer())
        .get('/probe')
        .set('Origin', origin)

      expect(response.headers['access-control-allow-origin']).toBe(origin)
      expect(response.headers['access-control-allow-credentials']).toBe('true')
    },
  )

  it.each(['https://evil.com', 'https://a.b.fastos.com'])(
    'should not allow the browser origin %s',
    async (origin) => {
      app = await createApp()

      const response = await request(app.getHttpServer())
        .get('/probe')
        .set('Origin', origin)

      expect(response.headers['access-control-allow-origin']).toBeUndefined()
    },
  )

  it('should answer the preflight of an allowed origin', async () => {
    app = await createApp()

    const response = await request(app.getHttpServer())
      .options('/probe')
      .set('Origin', 'https://loja-a.fastos.com')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type')

    expect(response.status).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe(
      'https://loja-a.fastos.com',
    )
    expect(response.headers['access-control-allow-headers']).toContain(
      'authorization',
    )
  })

  it('should allow no browser origin when none is configured', async () => {
    app = await createApp({ corsOrigins: [] })

    const response = await request(app.getHttpServer())
      .get('/probe')
      .set('Origin', 'http://localhost:5173')

    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('should not serve Swagger when it is disabled', async () => {
    app = await createApp({ swaggerEnabled: false })

    const response = await request(app.getHttpServer()).get(`/${SWAGGER_PATH}`)

    expect(response.status).toBe(404)
  })

  it('should serve Swagger when it is enabled', async () => {
    app = await createApp({ swaggerEnabled: true })

    const response = await request(app.getHttpServer())
      .get(`/${SWAGGER_PATH}`)
      .redirects(1)

    expect(response.status).toBe(200)
    expect(response.text).toContain('swagger')
  })

  it('should ignore X-Forwarded-For when no proxy is trusted', async () => {
    app = await createApp({ trustProxyHops: 0 })

    const response = await request(app.getHttpServer())
      .get('/probe')
      .set('X-Forwarded-For', '203.0.113.9')

    expect(response.body.ip).not.toBe('203.0.113.9')
  })

  it('should read the client IP from a trusted proxy', async () => {
    app = await createApp({ trustProxyHops: 1 })

    const response = await request(app.getHttpServer())
      .get('/probe')
      .set('X-Forwarded-For', '203.0.113.9')

    expect(response.body.ip).toBe('203.0.113.9')
  })
})
