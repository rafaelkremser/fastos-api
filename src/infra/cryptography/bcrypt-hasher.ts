import { Injectable } from '@nestjs/common'
import { hash, compare } from 'bcrypt'
import { Hasher } from '@/domain/account/application/cryptography/hasher'

@Injectable()
export class BcryptHasher implements Hasher {
  // Hashes store their own cost, so older hashes keep verifying after a change
  static readonly COST = 12

  private dummyHash?: Promise<string>

  async hash(plain: string): Promise<string> {
    return hash(plain, BcryptHasher.COST)
  }

  async compare(plain: string, hashed: string | null): Promise<boolean> {
    if (hashed === null) {
      this.dummyHash ??= hash('no-account', BcryptHasher.COST)
      await compare(plain, await this.dummyHash)
      return false
    }

    return compare(plain, hashed)
  }
}
