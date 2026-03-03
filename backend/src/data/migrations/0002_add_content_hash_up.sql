-- Migration: 0002_add_content_hash_up
-- Description: Add content_hash column for deduplication and make external_id unique
-- Reversible: see 0002_add_content_hash_down.sql

ALTER TABLE ads ADD COLUMN content_hash VARCHAR(64);

-- Dedup index: one ad per unique content hash
CREATE UNIQUE INDEX idx_ads_content_hash
  ON ads (content_hash)
  WHERE content_hash IS NOT NULL;

-- Make external_id unique per platform (same external_id from different platforms is OK)
CREATE UNIQUE INDEX idx_ads_external_id_platform
  ON ads (external_id, platform)
  WHERE external_id IS NOT NULL;

-- Drop the old non-unique external_id index if it exists
DROP INDEX IF EXISTS idx_ads_external_id;
