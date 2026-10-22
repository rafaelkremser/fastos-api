import { Encrypter } from '@/domain/account/application/cryptography/encrypter'

export class FakeEncrypter implements Encrypter {
  async encrypt(payload: Record<string, unknown>, expiresInSeconds: number) {
    return JSON.stringify({ ...payload, expiresInSeconds })
  }
}
