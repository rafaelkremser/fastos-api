import { Decrypter } from '@/domain/account/application/cryptography/decrypter'

export class FakeDecrypter implements Decrypter {
  async decrypt(token: string) {
    try {
      const claims = JSON.parse(token)
      return typeof claims === 'object' && claims !== null ? claims : null
    } catch {
      return null
    }
  }
}
