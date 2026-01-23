import { NestFactory } from '@nestjs/core'
import { AppModule } from './infra/app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors()

  const envService = app.get(EnvService)
  const port = envService.get('PORT')

  await app.listen(port)

  console.log(`Server is running on port ${port}`)
}

bootstrap()
