import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .default('3001')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().min(1).max(65535)),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z
    .string()
    .min(1)
    .describe('PostgreSQL connection string. Required.'),

  // Redis
  REDIS_URL: z.string().default('redis://redis:6379'),

  // Firecrawl
  FIRECRAWL_API_KEY: z
    .string()
    .min(1)
    .describe('Firecrawl API key. Required for ad scraping and health checks.'),
  FIRECRAWL_BASE_URL: z.string().default('https://api.firecrawl.dev/v1'),
  FIRECRAWL_TIMEOUT_MS: z
    .string()
    .default('30000')
    .transform((v) => parseInt(v, 10)),
  FIRECRAWL_MAX_RETRIES: z
    .string()
    .default('3')
    .transform((v) => parseInt(v, 10)),
  FIRECRAWL_RETRY_DELAY_MS: z
    .string()
    .default('1000')
    .transform((v) => parseInt(v, 10)),
  FIRECRAWL_DAILY_CREDIT_BUDGET: z
    .string()
    .default('500')
    .transform((v) => parseInt(v, 10)),

  // Logging
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  // Rate limiting (requests per minute)
  API_RATE_LIMIT_SEARCH: z
    .string()
    .default('10')
    .transform((v) => parseInt(v, 10)),
  API_RATE_LIMIT_CRUD: z
    .string()
    .default('60')
    .transform((v) => parseInt(v, 10)),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
      .join('\n');

    // Use console.error here intentionally — logger isn't bootstrapped yet
    console.error(`\n❌  Environment validation failed:\n${errors}\n`);
    console.error(
      '  Copy .env.example to .env and fill in the required values.\n',
    );
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
