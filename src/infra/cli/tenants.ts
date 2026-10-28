import { NestFactory } from '@nestjs/core'
import { ActivateTenantUseCase } from '@/domain/account/application/use-cases/activate-tenant'
import { FetchInactiveTenantsUseCase } from '@/domain/account/application/use-cases/fetch-inactive-tenants'
import { TenantsCliModule } from './tenants-cli.module'

// Tenant commands, run against the database in DATABASE_URL (build first):
//   npm run tenants:inactive            tenants waiting for approval
//   npm run tenants:activate -- <slug>  lets the tenant's users sign in
async function main() {
  const [command, slug] = process.argv.slice(2)

  const app = await NestFactory.createApplicationContext(TenantsCliModule, {
    logger: ['error'],
  })

  try {
    if (command === 'inactive') {
      const result = await app.get(FetchInactiveTenantsUseCase).execute()
      const tenants = result.isRight() ? result.value.tenants : []

      if (tenants.length === 0) {
        console.log('No inactive tenants.')
        return
      }

      console.table(
        tenants.map((tenant) => ({
          slug: tenant.slug.value,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone ?? '',
          createdAt: tenant.createdAt.toISOString(),
        })),
      )
    } else if (command === 'activate' && slug) {
      const result = await app.get(ActivateTenantUseCase).execute({ slug })

      if (result.isLeft()) {
        console.error(`No tenant with the slug "${slug}".`)
        process.exitCode = 1
        return
      }

      console.log(`Tenant "${slug}" is active; its users can sign in now.`)
    } else {
      console.error('Usage: tenants inactive | tenants activate <slug>')
      process.exitCode = 1
    }
  } finally {
    await app.close()
  }
}

main()
