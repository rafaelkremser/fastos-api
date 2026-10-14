import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Migrations need a direct connection; Neon's pooled URL (PgBouncer, transaction mode) breaks Prisma Migrate.
  datasource: {
    url: env('DATABASE_URL_UNPOOLED'),
  },
})