import { Injectable } from '@nestjs/common'
import { TransactionManager } from '@/core/transactions/transaction-manager'
import { PrismaService } from './prisma.service'

@Injectable()
export class PrismaTransactionManager implements TransactionManager {
  constructor(private prisma: PrismaService) {}

  run<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.runInTransaction(work)
  }
}
