import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'
import { configureHttp, SWAGGER_PATH } from './infra/http/configure-http'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const env = app.get(EnvService)

  const swaggerEnabled = env.get('SWAGGER_ENABLED')

  configureHttp(app, {
    corsOrigins: env.get('CORS_ORIGINS'),
    trustProxyHops: env.get('TRUST_PROXY_HOPS'),
    swaggerEnabled,
  })

  const port = env.get('PORT')

  await app.listen(port)

  console.log(`Server is running on port ${port}`)
  if (swaggerEnabled) {
    console.log(`Swagger docs at http://localhost:${port}/${SWAGGER_PATH}`)
  }
}

bootstrap()
