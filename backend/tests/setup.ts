/**
 * Global Vitest setup — runs once before all test files.
 * Loads test environment variables from .env.test.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test before any module resolves process.env
config({ path: resolve(process.cwd(), '.env.test') });
