export abstract class Hasher {
  abstract hash(plain: string): Promise<string>
  // With no stored hash (null), still spends the time of a real check and
  // returns false, so callers can hide whether an account exists
  abstract compare(plain: string, hash: string | null): Promise<boolean>
}
