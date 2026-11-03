// Runs the end-to-end tests (test/e2e) against a database of their own:
//
//   1. creates a temporary Neon branch from dev (E2E_NEON_PARENT changes it).
//      It expires in two hours, in case this script stops before deleting it
//   2. applies the migrations to the branch
//   3. runs Jest, whose tests start the whole API on that database
//   4. deletes the branch
//
// Needs the Neon CLI signed in. The project comes from the .neon file (neon
// set-context) or from NEON_PROJECT_ID. Arguments go to Jest:
//
//   npm run test:e2e -- tenant-isolation

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const apiDir = path.resolve(import.meta.dirname, '..')
const parent = process.env.E2E_NEON_PARENT ?? 'dev'
const branch = `e2e-api-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`
const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

const contextFile = path.join(apiDir, '.neon')
const project = process.env.NEON_PROJECT_ID
  ? `--project-id ${process.env.NEON_PROJECT_ID}`
  : existsSync(contextFile)
    ? `--context-file "${contextFile}"`
    : ''

// npx and neon are .cmd files on Windows, which only run in a shell. No
// command carries a secret: the database URLs go in the environment
function run(command, options = {}) {
  const result = spawnSync(command, {
    cwd: apiDir,
    shell: true,
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  })

  if (result.status !== 0) {
    throw new Error(`Falhou: ${command.split(' --')[0]}`)
  }

  return result
}

// Neon prints the passwords when it creates a branch, so its output is dropped
function neon(command, stdout = 'ignore') {
  return run(`neon ${command} ${project}`, {
    stdio: ['ignore', stdout, 'inherit'],
  })
}

function connectionString(pooled) {
  const { stdout } = neon(
    `connection-string ${branch}${pooled ? ' --pooled' : ''}`,
    'pipe',
  )

  // As in .env.example: verify-full checks the server, like require does
  // today, without the warning
  return stdout.trim().replace('sslmode=require', 'sslmode=verify-full')
}

// Ctrl+C reaches Jest too; this script waits for it and cleans up
process.on('SIGINT', () => {})

let status = 1

console.log(`Criando o banco temporário ${branch} a partir do ${parent}...`)
neon(
  `branches create --name ${branch} --parent ${parent} --expires-at ${expiresAt}`,
)

try {
  const databaseUrl = connectionString(true)

  console.log('Aplicando as migrations...')
  run('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL_UNPOOLED: connectionString(false) },
  })

  const jest = spawnSync(
    process.execPath,
    [
      path.join(apiDir, 'node_modules/jest/bin/jest.js'),
      '--config',
      'test/jest-e2e.json',
      ...process.argv.slice(2),
    ],
    {
      cwd: apiDir,
      stdio: 'inherit',
      env: { ...process.env, E2E_DATABASE_URL: databaseUrl },
    },
  )
  status = jest.status ?? 1
} finally {
  console.log(`Apagando o banco temporário ${branch}...`)

  try {
    neon(`branches delete ${branch}`)
  } catch {
    console.error(
      `Não deu para apagar o ${branch}; ele expira sozinho em duas horas.`,
    )
  }
}

process.exit(status)
