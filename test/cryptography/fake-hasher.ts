import { Hasher } from '@/domain/account/application/cryptography/hasher'

export class FakeHasher implements Hasher {
  async hash(plain: string) {
    return plain.concat('-hashed')
  }

  async compare(plain: string, hash: string) {
    return plain.concat('-hashed') === hash
  }
}
