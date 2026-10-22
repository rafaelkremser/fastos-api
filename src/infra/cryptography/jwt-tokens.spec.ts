import { createHmac, generateKeyPairSync } from 'node:crypto'
import { JwtService } from '@nestjs/jwt'
import { JwtEncrypter } from './jwt-encrypter'
import { JwtDecrypter } from './jwt-decrypter'

function createJwtService() {
  const keys = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  const service = new JwtService({
    privateKey: keys.privateKey,
    publicKey: keys.publicKey,
    signOptions: { algorithm: 'RS256' },
  })

  return { service, publicKey: keys.publicKey }
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url')
}

describe('JWT encrypter and decrypter', () => {
  const { service, publicKey } = createJwtService()
  const encrypter = new JwtEncrypter(service)
  const decrypter = new JwtDecrypter(service)

  it('should read back a token it issued, with the requested lifetime', async () => {
    const token = await encrypter.encrypt(
      { sub: 'user-1', type: 'refresh' },
      60,
    )

    const claims = await decrypter.decrypt(token)

    expect(claims).toMatchObject({ sub: 'user-1', type: 'refresh' })
    expect(Number(claims?.exp) - Number(claims?.iat)).toBe(60)
  })

  it('should reject an expired token', async () => {
    const token = service.sign({
      sub: 'user-1',
      exp: Math.floor(Date.now() / 1000) - 10,
    })

    expect(await decrypter.decrypt(token)).toBeNull()
  })

  it('should reject a token signed with another key', async () => {
    const other = createJwtService().service
    const token = await new JwtEncrypter(other).encrypt({ sub: 'user-1' }, 60)

    expect(await decrypter.decrypt(token)).toBeNull()
  })

  it('should reject a token whose content was changed', async () => {
    const token = await encrypter.encrypt(
      { sub: 'user-1', role: 'TECHNICIAN' },
      60,
    )
    const [header, , signature] = token.split('.')
    const forged = base64url(JSON.stringify({ sub: 'user-1', role: 'OWNER' }))

    expect(
      await decrypter.decrypt(`${header}.${forged}.${signature}`),
    ).toBeNull()
  })

  it('should reject an unsigned token (alg none)', async () => {
    const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    const payload = base64url(JSON.stringify({ sub: 'user-1', role: 'OWNER' }))

    expect(await decrypter.decrypt(`${header}.${payload}.`)).toBeNull()
  })

  it('should reject a token signed with HMAC using the public key as secret', async () => {
    const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = base64url(
      JSON.stringify({
        sub: 'user-1',
        exp: Math.floor(Date.now() / 1000) + 60,
      }),
    )
    const signature = createHmac('sha256', publicKey)
      .update(`${header}.${payload}`)
      .digest('base64url')

    expect(
      await decrypter.decrypt(`${header}.${payload}.${signature}`),
    ).toBeNull()
  })
})
