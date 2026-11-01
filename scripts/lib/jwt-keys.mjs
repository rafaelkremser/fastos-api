import { generateKeyPairSync } from 'node:crypto'

// An RS256 pair, each key a base64-encoded PEM, as JWT_PRIVATE_KEY and
// JWT_PUBLIC_KEY expect
export function generateJwtKeys() {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  })

  return {
    JWT_PRIVATE_KEY: Buffer.from(privateKey).toString('base64'),
    JWT_PUBLIC_KEY: Buffer.from(publicKey).toString('base64'),
  }
}
