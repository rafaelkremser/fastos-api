import { EnvService } from '@/infra/env/env.service'
import { PrismaService } from './prisma.service'

// No query runs here, so no database is needed: the pool only connects on use
const env = {
  get: () => 'postgresql://user:password@localhost:5432/fastos',
} as unknown as EnvService

describe('PrismaService', () => {
  const prisma = new PrismaService(env)

  afterAll(async () => {
    await prisma.onModuleDestroy()
  })

  it('should expose the models through client outside a transaction', () => {
    expect(typeof prisma.client.tenant.findUnique).toBe('function')
    expect(typeof prisma.client.serviceOrder.update).toBe('function')
  })
})
