-- Migration: 0001_initial_down
-- Description: Reverse of 0001_initial_up — drops all LENS core tables and types
-- WARNING: This destroys all data. Only run in development or after a confirmed backup.

-- ─── Tables (reverse dependency order) ───────────────────────────────────────
DROP TABLE IF EXISTS search_queries    CASCADE;
DROP TABLE IF EXISTS briefs            CASCADE;
DROP TABLE IF EXISTS campaign_ads      CASCADE;
DROP TABLE IF EXISTS campaigns         CASCADE;
DROP TABLE IF EXISTS ad_decompositions CASCADE;
DROP TABLE IF EXISTS ads               CASCADE;
DROP TABLE IF EXISTS users             CASCADE;

-- ─── Enums ────────────────────────────────────────────────────────────────────
DROP TYPE IF EXISTS cta_style;
DROP TYPE IF EXISTS proof_mechanism;
DROP TYPE IF EXISTS body_structure;
DROP TYPE IF EXISTS visual_hook;
DROP TYPE IF EXISTS hook_type;
DROP TYPE IF EXISTS generated_by;
DROP TYPE IF EXISTS plan;
DROP TYPE IF EXISTS performance_tier;
DROP TYPE IF EXISTS media_type;
DROP TYPE IF EXISTS platform;
