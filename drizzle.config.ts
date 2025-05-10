import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'drizzle-kit';

const projectDir = process.cwd()
loadEnvConfig(projectDir)

export default defineConfig({
  out: './migrations',
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME!,
  },
});
