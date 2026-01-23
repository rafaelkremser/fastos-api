import { Injectable } from '@nestjs/common'
import { hash, compare } from 'bcrypt'
import { Hasher } from '@/domain/account/application/cryptography/hasher'

@Injectable()
export class BcryptHasher implements Hasher {
  private HASH_SALT_LENGTH = 8

  async hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}
