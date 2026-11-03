import { generateKeyPairSync } from 'node:crypto'

// npm run test:e2e creates a temporary database and passes it here. Without
// it, the app would fall back to the database in .env
const databaseUrl = process.env.E2E_DATABASE_URL

if (!databaseUrl) {
  throw new Error(
    'Rode os testes de ponta a ponta com npm run test:e2e, que cria o banco temporário.',
  )
}

process.env.DATABASE_URL = databaseUrl

// A key pair of their own, so the tests do not depend on the keys in .env
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

process.env.JWT_PRIVATE_KEY = Buffer.from(privateKey).toString('base64')
process.env.JWT_PUBLIC_KEY = Buffer.from(publicKey).toString('base64')
process.env.SWAGGER_ENABLED = 'false'
