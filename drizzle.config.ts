import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit';

const projectDir = process.cwd()
loadEnvConfig(projectDir)

export default defineConfig({
  out: './migrations',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
