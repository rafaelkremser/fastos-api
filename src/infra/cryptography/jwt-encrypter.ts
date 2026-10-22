import { Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Encrypter } from '@/domain/account/application/cryptography/encrypter'

@Injectable()
export class JwtEncrypter implements Encrypter {
  constructor(private jwtService: JwtService) {}

  async encrypt(
    payload: Record<string, unknown>,
    expiresInSeconds: number,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, { expiresIn: expiresInSeconds })
  }
}
