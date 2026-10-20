import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  const envService = app.get(EnvService)

  // Rate limits are per client IP. Behind N proxies, trust exactly N hops of
  // X-Forwarded-For; trusting more lets clients spoof their IP.
  const trustProxyHops = envService.get('TRUST_PROXY_HOPS')
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops)
  }

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  })

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FastOS API')
    .setDescription('SaaS multi-tenant para gestão de ordens de serviço')
    .setVersion('1.0')
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = envService.get('PORT')

  await app.listen(port)

  console.log(`Server is running on port ${port}`)
  console.log(`Swagger docs at http://localhost:${port}/api/docs`)
}

bootstrap()
