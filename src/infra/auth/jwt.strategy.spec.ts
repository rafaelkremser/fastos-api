import { generateKeyPairSync, randomUUID } from 'node:crypto'
import { UnauthorizedException } from '@nestjs/common'
import { EnvService } from '@/infra/env/env.service'
import { JwtStrategy } from './jwt.strategy'

const { publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const env = {
  get: () => Buffer.from(publicKey).toString('base64'),
} as unknown as EnvService

const accessClaims = {
  sub: randomUUID(),
  tenantId: randomUUID(),
  role: 'TECHNICIAN',
  type: 'access',
}

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy(env)

  it('should accept the claims of an access token', async () => {
    expect(
      await strategy.validate({ ...accessClaims, iat: 1, exp: 2 }),
    ).toEqual(accessClaims)
  })

  it.each([
    ['a refresh token', { ...accessClaims, type: 'refresh' }],
    ['a token without a type', { ...accessClaims, type: undefined }],
    ['an unknown role', { ...accessClaims, role: 'SUPERUSER' }],
    ['a missing tenant', { ...accessClaims, tenantId: undefined }],
  ])('should answer 401 for %s', async (_, claims) => {
    await expect(strategy.validate(claims)).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })
})
