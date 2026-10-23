import { AsyncLocalStorage } from 'node:async_hooks'
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { EnvService } from '@/infra/env/env.service'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool
  // PrismaClient's constructor returns a proxy that carries the models
  // (tenant, user...). Getters on this class run against the raw instance,
  // which lacks them, so keep a reference to the proxy itself.
  private proxy: PrismaClient
  private transaction = new AsyncLocalStorage<Prisma.TransactionClient>()

  constructor(private env: EnvService) {
    const connectionString = env.get('DATABASE_URL')

    const pool = new Pool({ connectionString })
    const adapter = new PrismaPg(pool)

    super({
      adapter,
      log: ['warn', 'error'],
    })

    this.pool = pool
    this.proxy = this
  }

  // Repositories query through this, so inside runInTransaction they
  // automatically use the open transaction instead of a separate connection
  get client(): Prisma.TransactionClient {
    return this.transaction.getStore() ?? this.proxy
  }

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    // A transaction started inside another one joins it
    if (this.transaction.getStore()) {
      return work()
    }

    return this.$transaction((tx) => this.transaction.run(tx, work))
  }

  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
    await this.pool.end()
  }
}
