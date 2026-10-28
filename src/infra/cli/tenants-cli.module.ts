import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ActivateTenantUseCase } from '@/domain/account/application/use-cases/activate-tenant'
import { FetchInactiveTenantsUseCase } from '@/domain/account/application/use-cases/fetch-inactive-tenants'
import { DatabaseModule } from '../database/database.module'
import { envSchema } from '../env/env'
import { EnvModule } from '../env/env.module'

// Only what the tenant commands need: no HTTP server, no auth
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    EnvModule,
    DatabaseModule,
  ],
  providers: [ActivateTenantUseCase, FetchInactiveTenantsUseCase],
})
export class TenantsCliModule {}
