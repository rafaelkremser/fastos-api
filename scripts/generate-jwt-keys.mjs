import { generateKeyPairSync } from 'node:crypto'

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const privateB64 = Buffer.from(privateKey).toString('base64')
const publicB64 = Buffer.from(publicKey).toString('base64')

process.stdout.write(
  [
    '# Cole as linhas abaixo no seu .env (substituindo os valores existentes de JWT_PRIVATE_KEY e JWT_PUBLIC_KEY):',
    `JWT_PRIVATE_KEY="${privateB64}"`,
    `JWT_PUBLIC_KEY="${publicB64}"`,
    '',
  ].join('\n'),
)
