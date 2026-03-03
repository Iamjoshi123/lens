import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';
import { env } from '../config/env.js';
import { logger } from '../infrastructure/logger/index.js';

let pool: Pool | null = null;

export function createPool(): Pool {
  return new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === 'test' ? 5 : 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export function getPool(): Pool {
  if (!pool) {
    pool = createPool();

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });

    pool.on('connect', () => {
      logger.debug('New database connection established');
    });
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export async function checkDbConnection(): Promise<boolean> {
  const client = await getPool()
    .connect()
    .catch(() => null);

  if (!client) return false;

  try {
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    client.release();
  }
}

// Singleton db instance for use across the application
export const db = drizzle(getPool(), { schema });

export type Database = typeof db;
