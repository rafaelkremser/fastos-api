import { randomBytes } from 'node:crypto'
import { NestFactory } from '@nestjs/core'
import { ResetPasswordUseCase } from '@/domain/account/application/use-cases/reset-password'
import { UsersCliModule } from './users-cli.module'

// User commands, run against the database in DATABASE_URL (build first):
//   npm run users:reset-password -- <slug> <email>
//     sets a temporary password and shows it, for someone who forgot theirs.
//     Pass it to the person, who then changes it in "Trocar senha"
async function main() {
  const [command, slug, email] = process.argv.slice(2)

  const app = await NestFactory.createApplicationContext(UsersCliModule, {
    logger: ['error'],
  })

  try {
    if (command === 'reset-password' && slug && email) {
      // 12 characters that are easy to read out and type
      const password = randomBytes(9).toString('base64url')

      const result = await app.get(ResetPasswordUseCase).execute({
        tenantSlug: slug,
        email,
        newPassword: password,
      })

      if (result.isLeft()) {
        console.error(`No user "${email}" in the tenant "${slug}".`)
        process.exitCode = 1
        return
      }

      console.log(`Temporary password for ${email} (${slug}): ${password}`)
    } else {
      console.error('Usage: users reset-password <slug> <email>')
      process.exitCode = 1
    }
  } finally {
    await app.close()
  }
}

main()
