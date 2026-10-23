import { TransactionManager } from '@/core/transactions/transaction-manager'

// In-memory repositories cannot roll back; this only records which writes
// happened inside a transaction
export class FakeTransactionManager implements TransactionManager {
  public isRunning = false
  public runs = 0

  async run<T>(work: () => Promise<T>): Promise<T> {
    this.runs++
    this.isRunning = true

    try {
      return await work()
    } finally {
      this.isRunning = false
    }
  }
}
