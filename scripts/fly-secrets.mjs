// Puts the API's secrets on Fly.io without showing them anywhere:
//
//   - a new JWT key pair, used only in production
//   - the URLs of Neon's production branch, pooled for the API and direct for
//     the migrations, read with the Neon CLI
//
// Needs the Fly CLI (fly auth login) and the Neon CLI signed in, and the app
// created (fly apps create). Run it once, before the first deploy: running it
// again makes a new key pair, which signs everyone out.
//
//   npm run fly:secrets

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { generateJwtKeys } from './lib/jwt-keys.mjs'

const apiDir = path.resolve(import.meta.dirname, '..')
const branch = process.env.NEON_PRODUCTION_BRANCH ?? 'production'

const contextFile = path.join(apiDir, '.neon')
const project = process.env.NEON_PROJECT_ID
  ? `--project-id ${process.env.NEON_PROJECT_ID}`
  : existsSync(contextFile)
    ? `--context-file "${contextFile}"`
    : ''

// neon is a .cmd file on Windows, which only runs in a shell. The secrets
// never go in a command line: the URLs come back on stdout and go to Fly on
// stdin
function run(command, options = {}) {
  const result = spawnSync(command, {
    cwd: apiDir,
    shell: true,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    ...options,
  })

  if (result.status !== 0) {
    throw new Error(`Falhou: ${command.split(' --')[0]}`)
  }

  return result.stdout
}

function connectionString(pooled) {
  const url = run(
    `neon connection-string ${branch}${pooled ? ' --pooled' : ''} ${project}`,
  ).trim()

  // As in .env.example: verify-full checks the server, like require does
  // today, without the warning
  return url.replace('sslmode=require', 'sslmode=verify-full')
}

const secrets = {
  DATABASE_URL: connectionString(true),
  DATABASE_URL_UNPOOLED: connectionString(false),
  ...generateJwtKeys(),
}

console.log(`Enviando ao Fly: ${Object.keys(secrets).join(', ')}...`)

run('fly secrets import', {
  input: Object.entries(secrets)
    .map(([name, value]) => `${name}=${value}`)
    .join('\n'),
  stdio: ['pipe', 'ignore', 'inherit'],
})

console.log(
  'Pronto. Os valores ficaram só no Fly; confira os nomes com fly secrets list.',
)
