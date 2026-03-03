-- Migration: 0001_initial_up
-- Description: Create all core tables for LENS backend
-- Reversible: see 0001_initial_down.sql

-- ─── Enable extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────
CREATE TYPE platform AS ENUM ('META', 'TIKTOK', 'YOUTUBE');
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL');
CREATE TYPE performance_tier AS ENUM ('TOP', 'HIGH', 'MID', 'LOW');
CREATE TYPE plan AS ENUM ('FREE', 'PRO', 'TEAM');
CREATE TYPE generated_by AS ENUM ('AI', 'MANUAL');

CREATE TYPE hook_type AS ENUM (
  'QUESTION', 'BOLD_CLAIM', 'PATTERN_INTERRUPT', 'POV_STATEMENT',
  'PROBLEM_CALLOUT', 'SOCIAL_PROOF', 'CURIOSITY_GAP', 'BEFORE_AFTER', 'OTHER'
);

CREATE TYPE visual_hook AS ENUM (
  'FACE_TO_CAMERA', 'TEXT_OVERLAY', 'PRODUCT_CLOSEUP', 'BEFORE_AFTER',
  'UNBOXING', 'SCREEN_RECORDING', 'LIFESTYLE', 'OTHER'
);

CREATE TYPE body_structure AS ENUM (
  'PAS', 'AIDA', 'TESTIMONIAL_STACK', 'DEMO_FIRST',
  'STORY_ARC', 'LISTICLE', 'COMPARISON', 'OTHER'
);

CREATE TYPE proof_mechanism AS ENUM (
  'UGC_TESTIMONIAL', 'DATA_STAT', 'AUTHORITY_PRESS', 'DEMONSTRATION',
  'COMPARISON', 'BEFORE_AFTER', 'REVIEW_COUNT', 'OTHER'
);

CREATE TYPE cta_style AS ENUM (
  'URGENCY', 'BENEFIT_RESTATEMENT', 'SOCIAL_PROOF_CTA',
  'RISK_REVERSAL', 'DISCOUNT_CODE', 'OTHER'
);

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) NOT NULL,
  name           VARCHAR(255) NOT NULL,
  plan           plan NOT NULL DEFAULT 'FREE',
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- ─── Ads ──────────────────────────────────────────────────────────────────────
CREATE TABLE ads (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id               VARCHAR(255),
  platform                  platform NOT NULL,
  brand_name                VARCHAR(500) NOT NULL,
  brand_logo_url            TEXT,
  ad_copy                   TEXT NOT NULL,
  headline                  VARCHAR(500),
  cta_text                  VARCHAR(255),
  landing_page_url          TEXT,
  media_type                media_type NOT NULL,
  media_urls                TEXT[] NOT NULL DEFAULT '{}',
  screenshot_url            TEXT,
  video_duration_sec        INTEGER,
  first_seen_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_spend           NUMERIC(12, 2),
  engagement_likes          INTEGER,
  engagement_comments       INTEGER,
  engagement_shares         INTEGER,
  source_url                TEXT,
  raw_scraped_data          JSONB,
  performance_tier          performance_tier,
  performance_score         REAL,
  consecutive_miss_count    INTEGER NOT NULL DEFAULT 0,
  landing_page_title        VARCHAR(500),
  landing_page_headline     TEXT,
  landing_page_offer        TEXT,
  landing_page_screenshot   TEXT,
  landing_page_scraped_at   TIMESTAMP WITH TIME ZONE,
  created_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ads_platform       ON ads (platform);
CREATE INDEX idx_ads_brand_name     ON ads (brand_name);
CREATE INDEX idx_ads_is_active      ON ads (is_active);
CREATE INDEX idx_ads_first_seen_at  ON ads (first_seen_at);
CREATE INDEX idx_ads_performance_tier ON ads (performance_tier);
CREATE INDEX idx_ads_updated_at     ON ads (updated_at);

-- ─── Ad Decompositions ────────────────────────────────────────────────────────
CREATE TABLE ad_decompositions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id             UUID NOT NULL REFERENCES ads (id) ON DELETE CASCADE,
  hook_type         hook_type,
  visual_hook       visual_hook,
  body_structure    body_structure,
  proof_mechanism   proof_mechanism,
  cta_style         cta_style,
  primary_angle     TEXT,
  target_emotion    TEXT,
  performance_tier  performance_tier,
  confidence_score  REAL,
  raw_ai_response   JSONB,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ad_decompositions_ad_id ON ad_decompositions (ad_id);

-- ─── Campaigns ────────────────────────────────────────────────────────────────
CREATE TABLE campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name           VARCHAR(500) NOT NULL,
  description    TEXT,
  brand_context  JSONB,
  created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_campaigns_user_id ON campaigns (user_id);

-- ─── Campaign Ads (join table) ────────────────────────────────────────────────
CREATE TABLE campaign_ads (
  campaign_id  UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  ad_id        UUID NOT NULL REFERENCES ads (id) ON DELETE CASCADE,
  saved_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes        TEXT,
  PRIMARY KEY (campaign_id, ad_id)
);

CREATE INDEX idx_campaign_ads_ad_id ON campaign_ads (ad_id);

-- ─── Briefs ───────────────────────────────────────────────────────────────────
CREATE TABLE briefs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       UUID NOT NULL REFERENCES campaigns (id) ON DELETE CASCADE,
  title             VARCHAR(500) NOT NULL,
  content           TEXT NOT NULL DEFAULT '',
  reference_ad_ids  UUID[] NOT NULL DEFAULT '{}',
  generated_by      generated_by NOT NULL DEFAULT 'MANUAL',
  raw_ai_response   JSONB,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_briefs_campaign_id ON briefs (campaign_id);

-- ─── Search Queries (audit log) ───────────────────────────────────────────────
CREATE TABLE search_queries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users (id) ON DELETE SET NULL,
  query_text       TEXT NOT NULL,
  platform_filter  platform,
  filters_applied  JSONB,
  results_count    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user_id   ON search_queries (user_id);
CREATE INDEX idx_search_queries_created_at ON search_queries (created_at);
