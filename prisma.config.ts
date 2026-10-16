import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Migrations need a direct connection; Neon's pooled URL (PgBouncer, transaction mode) breaks Prisma Migrate.
  // Read without env() so `prisma generate` (postinstall) works on machines with no database configured.
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED,
  },
})
