/**
 * SearchQuery repository — audit log for every user search.
 */

import { db, type Database } from '../db.js';
import { searchQueries, type SearchQuery } from '../schema.js';

export interface LogSearchParams {
  userId?: string;
  queryText: string;
  platformFilter?: 'META' | 'TIKTOK' | 'YOUTUBE';
  filtersApplied?: Record<string, unknown>;
  resultsCount: number;
}

/**
 * Log a search query and return the created record.
 * The returned ID is used as the searchId in API responses.
 */
export async function logSearch(
  params: LogSearchParams,
  database: Database = db,
): Promise<SearchQuery> {
  const [record] = await database
    .insert(searchQueries)
    .values({
      userId: params.userId ?? null,
      queryText: params.queryText,
      platformFilter: params.platformFilter ?? null,
      filtersApplied: params.filtersApplied ?? null,
      resultsCount: params.resultsCount,
    })
    .returning();

  return record!;
}
