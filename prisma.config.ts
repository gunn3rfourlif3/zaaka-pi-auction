import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // This tells the CLI where the DB is for introspection/pulling
    url: process.env.DATABASE_URL, // This is for migrations/CLI only
  },
});




