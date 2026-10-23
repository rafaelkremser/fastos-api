export abstract class TransactionManager {
  // Runs the work atomically: if it throws, every write made inside is undone.
  // Keep slow steps (like hashing a password) outside, so the transaction
  // holds a database connection only for the writes.
  abstract run<T>(work: () => Promise<T>): Promise<T>
}
