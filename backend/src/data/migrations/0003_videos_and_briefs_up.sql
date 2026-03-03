-- Migration 0003: Videos, heatmap zones, transcript segments,
--                 briefs (frontend shape), hook snippets,
--                 brief references, brief reactions
--
-- The "videos" table is a frontend-facing view of ad creatives.
-- Each row maps to one ad from the "ads" table (via source_ad_id)
-- plus enrichment: heatmap zones, transcript, CDN URLs, metrics.
--
-- A "dev_user" row is seeded here so all briefs/reactions can
-- reference a real user FK without requiring auth in dev.

-- ── Dev user (single identity for auth-less development) ─────────────────────
INSERT INTO users (id, email, name, plan)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'dev@lens.app',
  'Dev User',
  'PRO'
) ON CONFLICT (id) DO NOTHING;

-- ── Videos ───────────────────────────────────────────────────────────────────
CREATE TABLE videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_ad_id     UUID REFERENCES ads(id) ON DELETE SET NULL,
  title            TEXT NOT NULL,
  brand            TEXT NOT NULL,
  platform         platform NOT NULL,
  category         TEXT NOT NULL DEFAULT 'General',
  thumbnail_url    TEXT NOT NULL DEFAULT '',
  video_url        TEXT NOT NULL DEFAULT '',
  duration         INTEGER NOT NULL DEFAULT 0,
  -- Metrics stored as raw numbers; API formats them for the frontend
  spend_cents      BIGINT,
  impressions      BIGINT,
  ctr_percent      DECIMAL(5,2),
  engagement_rate  DECIMAL(5,2),
  hook_rate        DECIMAL(5,2),
  performance_tier performance_tier,
  source_url       TEXT,
  -- Full-text search vector
  search_vector    TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(category, ''))
  ) STORED,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_videos_search       ON videos USING GIN (search_vector);
CREATE INDEX idx_videos_platform     ON videos (platform);
CREATE INDEX idx_videos_category     ON videos (category);
CREATE INDEX idx_videos_tier         ON videos (performance_tier);
CREATE INDEX idx_videos_source_ad    ON videos (source_ad_id);

-- ── Heatmap zones ─────────────────────────────────────────────────────────────
CREATE TABLE heatmap_zones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  start_pct  INTEGER NOT NULL CHECK (start_pct >= 0 AND start_pct <= 100),
  end_pct    INTEGER NOT NULL CHECK (end_pct >= 0 AND end_pct <= 100),
  type       TEXT NOT NULL CHECK (type IN ('hook', 'proof', 'cta')),
  label      TEXT NOT NULL
);

CREATE INDEX idx_heatmap_video ON heatmap_zones (video_id);

-- ── Transcript segments ───────────────────────────────────────────────────────
CREATE TABLE transcript_segments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  time_sec   DECIMAL(8,2) NOT NULL,
  text       TEXT NOT NULL
);

CREATE INDEX idx_transcript_video ON transcript_segments (video_id, time_sec);

-- ── Briefs (frontend shape — standalone, no campaign FK required) ─────────────
-- Note: The existing "briefs" table is campaign-scoped (Collection Engine).
-- This new table matches the frontend's Brief type exactly.
CREATE TABLE user_briefs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  campaign   TEXT NOT NULL DEFAULT '',
  angle      TEXT NOT NULL DEFAULT '',
  content    TEXT NOT NULL DEFAULT '',
  archived   BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_briefs_owner ON user_briefs (owner_id, archived);

-- ── Brief collaborators ───────────────────────────────────────────────────────
CREATE TABLE brief_collaborators (
  brief_id    UUID NOT NULL REFERENCES user_briefs(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (brief_id, user_id)
);

-- ── Brief references (saved videos) ──────────────────────────────────────────
CREATE TABLE brief_references (
  brief_id   UUID NOT NULL REFERENCES user_briefs(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  added_by   UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (brief_id, video_id)
);

-- ── Hook snippets ─────────────────────────────────────────────────────────────
CREATE TABLE hook_snippets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id      UUID NOT NULL REFERENCES user_briefs(id) ON DELETE CASCADE,
  video_id      UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  video_title   TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL DEFAULT '',
  start_time    DECIMAL(8,2) NOT NULL DEFAULT 0,
  end_time      DECIMAL(8,2) NOT NULL DEFAULT 3,
  notes         TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hook_snippets_brief ON hook_snippets (brief_id);

-- ── Brief reactions (like / dislike) ─────────────────────────────────────────
CREATE TABLE brief_reactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id   UUID NOT NULL REFERENCES user_briefs(id) ON DELETE CASCADE,
  video_id   UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL CHECK (reaction IN ('like', 'dislike')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (brief_id, video_id, user_id)
);

CREATE INDEX idx_brief_reactions_brief ON brief_reactions (brief_id);
