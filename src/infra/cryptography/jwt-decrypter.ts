import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Decrypter } from '@/domain/account/application/cryptography/decrypter'

@Injectable()
export class JwtDecrypter implements Decrypter {
  constructor(private jwtService: JwtService) {}

  async decrypt(token: string): Promise<Record<string, unknown> | null> {
    try {
      // jsonwebtoken already refuses "none" and HMAC for an RSA key; pinning
      // keeps that true if the library default ever changes
      return await this.jwtService.verifyAsync(token, { algorithms: ['RS256'] })
    } catch {
      return null
    }
  }
}
