-- Migration: 0002_add_content_hash_down
-- Description: Reverse of 0002_add_content_hash_up

DROP INDEX IF EXISTS idx_ads_external_id_platform;
DROP INDEX IF EXISTS idx_ads_content_hash;
ALTER TABLE ads DROP COLUMN IF EXISTS content_hash;
