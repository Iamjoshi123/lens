/**
 * Migration runner — reads SQL files from ./migrations and applies them in order.
 *
 * Usage:
 *   tsx src/data/migrate.ts up      # Apply all pending up migrations
 *   tsx src/data/migrate.ts down    # Roll back the last migration
 *
 * Tracks applied migrations in a `schema_migrations` table.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { env } from '../config/env.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, 'migrations');

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     VARCHAR(255) PRIMARY KEY,
      applied_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(pool: Pool): Promise<Set<string>> {
  const result = await pool.query<{ version: string }>(
    'SELECT version FROM schema_migrations ORDER BY version',
  );
  return new Set(result.rows.map((r) => r.version));
}

async function getAvailableMigrations(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR);
  return files
    .filter((f) => f.endsWith('_up.sql'))
    .map((f) => f.replace('_up.sql', ''))
    .sort();
}

async function runMigration(pool: Pool, sql: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function migrateUp(pool: Pool): Promise<void> {
  await ensureMigrationsTable(pool);
  const applied = await getAppliedMigrations(pool);
  const available = await getAvailableMigrations();
  const pending = available.filter((v) => !applied.has(v));

  if (pending.length === 0) {
    console.log('✅  No pending migrations.');
    return;
  }

  for (const version of pending) {
    const filePath = join(MIGRATIONS_DIR, `${version}_up.sql`);
    const sql = await readFile(filePath, 'utf-8');
    console.log(`⬆️   Applying migration: ${version}`);
    await runMigration(pool, sql);
    await pool.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
    console.log(`✅   Applied: ${version}`);
  }
}

async function migrateDown(pool: Pool): Promise<void> {
  await ensureMigrationsTable(pool);
  const applied = await getAppliedMigrations(pool);

  if (applied.size === 0) {
    console.log('ℹ️   No migrations to roll back.');
    return;
  }

  // Roll back only the latest migration
  const latest = [...applied].sort().at(-1);
  if (!latest) return;

  const filePath = join(MIGRATIONS_DIR, `${latest}_down.sql`);
  const sql = await readFile(filePath, 'utf-8');
  console.log(`⬇️   Rolling back migration: ${latest}`);
  await runMigration(pool, sql);
  await pool.query('DELETE FROM schema_migrations WHERE version = $1', [latest]);
  console.log(`✅   Rolled back: ${latest}`);
}

async function main(): Promise<void> {
  const direction = process.argv[2] ?? 'up';
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  try {
    if (direction === 'up') {
      await migrateUp(pool);
    } else if (direction === 'down') {
      await migrateDown(pool);
    } else {
      console.error(`Unknown direction: ${direction}. Use "up" or "down".`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
