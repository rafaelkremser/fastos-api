import { generateJwtKeys } from './lib/jwt-keys.mjs'

const { JWT_PRIVATE_KEY, JWT_PUBLIC_KEY } = generateJwtKeys()

process.stdout.write(
  [
    '# Cole as linhas abaixo no seu .env (substituindo os valores existentes de JWT_PRIVATE_KEY e JWT_PUBLIC_KEY):',
    `JWT_PRIVATE_KEY="${JWT_PRIVATE_KEY}"`,
    `JWT_PUBLIC_KEY="${JWT_PUBLIC_KEY}"`,
    '',
  ].join('\n'),
)
