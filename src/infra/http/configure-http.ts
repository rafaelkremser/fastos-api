import helmet from 'helmet'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { createOriginMatcher } from './cors'

export const SWAGGER_PATH = 'api/docs'

interface HttpOptions {
  corsOrigins: string[]
  trustProxyHops: number
  swaggerEnabled: boolean
}

export function configureHttp(
  app: NestExpressApplication,
  { corsOrigins, trustProxyHops, swaggerEnabled }: HttpOptions,
) {
  // Rate limits are per client IP. Behind N proxies, trust exactly N hops of
  // X-Forwarded-For; trusting more lets clients spoof their IP.
  if (trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops)
  }

  app.use(helmet())

  const isAllowedOrigin = createOriginMatcher(corsOrigins)
  app.enableCors({
    origin: (origin, callback) =>
      callback(null, origin !== undefined && isAllowedOrigin(origin)),
    credentials: true,
  })

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('FastOS API')
      .setDescription('SaaS multi-tenant para gestão de ordens de serviço')
      .setVersion('1.0')
      .addBearerAuth()
      .build()

    SwaggerModule.setup(
      SWAGGER_PATH,
      app,
      SwaggerModule.createDocument(app, config),
    )
  }
}
