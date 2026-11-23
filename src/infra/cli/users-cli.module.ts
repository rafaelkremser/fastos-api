import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { Hasher } from '@/domain/account/application/cryptography/hasher'
import { ResetPasswordUseCase } from '@/domain/account/application/use-cases/reset-password'
import { BcryptHasher } from '../cryptography/bcrypt-hasher'
import { DatabaseModule } from '../database/database.module'
import { envSchema } from '../env/env'
import { EnvModule } from '../env/env.module'

// Only what the user commands need: no HTTP server, no tokens
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    EnvModule,
    DatabaseModule,
  ],
  providers: [
    { provide: Hasher, useClass: BcryptHasher },
    ResetPasswordUseCase,
  ],
})
export class UsersCliModule {}
