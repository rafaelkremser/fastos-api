import { Module } from '@nestjs/common'
import { Hasher } from '@/domain/account/application/cryptography/hasher'
import { Encrypter } from '@/domain/account/application/cryptography/encrypter'
import { Decrypter } from '@/domain/account/application/cryptography/decrypter'
import { BcryptHasher } from './bcrypt-hasher'
import { JwtEncrypter } from './jwt-encrypter'
import { JwtDecrypter } from './jwt-decrypter'

@Module({
  providers: [
    { provide: Hasher, useClass: BcryptHasher },
    { provide: Encrypter, useClass: JwtEncrypter },
    { provide: Decrypter, useClass: JwtDecrypter },
  ],
  exports: [Hasher, Encrypter, Decrypter],
})
export class CryptographyModule {}
