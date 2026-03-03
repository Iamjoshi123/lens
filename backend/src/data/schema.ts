import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const platformEnum = pgEnum('platform', ['META', 'TIKTOK', 'YOUTUBE']);
export const mediaTypeEnum = pgEnum('media_type', ['IMAGE', 'VIDEO', 'CAROUSEL']);
export const performanceTierEnum = pgEnum('performance_tier', ['TOP', 'HIGH', 'MID', 'LOW']);
export const planEnum = pgEnum('plan', ['FREE', 'PRO', 'TEAM']);
export const generatedByEnum = pgEnum('generated_by', ['AI', 'MANUAL']);

export const hookTypeEnum = pgEnum('hook_type', [
  'QUESTION',
  'BOLD_CLAIM',
  'PATTERN_INTERRUPT',
  'POV_STATEMENT',
  'PROBLEM_CALLOUT',
  'SOCIAL_PROOF',
  'CURIOSITY_GAP',
  'BEFORE_AFTER',
  'OTHER',
]);

export const visualHookEnum = pgEnum('visual_hook', [
  'FACE_TO_CAMERA',
  'TEXT_OVERLAY',
  'PRODUCT_CLOSEUP',
  'BEFORE_AFTER',
  'UNBOXING',
  'SCREEN_RECORDING',
  'LIFESTYLE',
  'OTHER',
]);

export const bodyStructureEnum = pgEnum('body_structure', [
  'PAS',
  'AIDA',
  'TESTIMONIAL_STACK',
  'DEMO_FIRST',
  'STORY_ARC',
  'LISTICLE',
  'COMPARISON',
  'OTHER',
]);

export const proofMechanismEnum = pgEnum('proof_mechanism', [
  'UGC_TESTIMONIAL',
  'DATA_STAT',
  'AUTHORITY_PRESS',
  'DEMONSTRATION',
  'COMPARISON',
  'BEFORE_AFTER',
  'REVIEW_COUNT',
  'OTHER',
]);

export const ctaStyleEnum = pgEnum('cta_style', [
  'URGENCY',
  'BENEFIT_RESTATEMENT',
  'SOCIAL_PROOF_CTA',
  'RISK_REVERSAL',
  'DISCOUNT_CODE',
  'OTHER',
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  plan: planEnum('plan').notNull().default('FREE'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ads = pgTable(
  'ads',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    externalId: varchar('external_id', { length: 255 }),
    contentHash: varchar('content_hash', { length: 64 }),
    platform: platformEnum('platform').notNull(),
    brandName: varchar('brand_name', { length: 500 }).notNull(),
    brandLogoUrl: text('brand_logo_url'),
    adCopy: text('ad_copy').notNull(),
    headline: varchar('headline', { length: 500 }),
    ctaText: varchar('cta_text', { length: 255 }),
    landingPageUrl: text('landing_page_url'),
    mediaType: mediaTypeEnum('media_type').notNull(),
    mediaUrls: text('media_urls').array().notNull().default(sql`'{}'::text[]`),
    screenshotUrl: text('screenshot_url'),
    videoDurationSec: integer('video_duration_sec'),
    firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).notNull().defaultNow(),
    isActive: boolean('is_active').notNull().default(true),
    estimatedSpend: numeric('estimated_spend', { precision: 12, scale: 2 }),
    engagementLikes: integer('engagement_likes'),
    engagementComments: integer('engagement_comments'),
    engagementShares: integer('engagement_shares'),
    sourceUrl: text('source_url'),
    rawScrapedData: jsonb('raw_scraped_data'),
    performanceTier: performanceTierEnum('performance_tier'),
    performanceScore: real('performance_score'),
    consecutiveMissCount: integer('consecutive_miss_count').notNull().default(0),
    // Landing page enrichment (populated by background job in Slice 4)
    landingPageTitle: varchar('landing_page_title', { length: 500 }),
    landingPageHeadline: text('landing_page_headline'),
    landingPageOffer: text('landing_page_offer'),
    landingPageScreenshot: text('landing_page_screenshot'),
    landingPageScrapedAt: timestamp('landing_page_scraped_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    platformIdx: index('idx_ads_platform').on(table.platform),
    brandNameIdx: index('idx_ads_brand_name').on(table.brandName),
    isActiveIdx: index('idx_ads_is_active').on(table.isActive),
    firstSeenAtIdx: index('idx_ads_first_seen_at').on(table.firstSeenAt),
    performanceTierIdx: index('idx_ads_performance_tier').on(table.performanceTier),
    updatedAtIdx: index('idx_ads_updated_at').on(table.updatedAt),
  }),
);

export const adDecompositions = pgTable('ad_decompositions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  adId: uuid('ad_id')
    .notNull()
    .references(() => ads.id, { onDelete: 'cascade' }),
  hookType: hookTypeEnum('hook_type'),
  visualHook: visualHookEnum('visual_hook'),
  bodyStructure: bodyStructureEnum('body_structure'),
  proofMechanism: proofMechanismEnum('proof_mechanism'),
  ctaStyle: ctaStyleEnum('cta_style'),
  primaryAngle: text('primary_angle'),
  targetEmotion: text('target_emotion'),
  performanceTier: performanceTierEnum('performance_tier'),
  confidenceScore: real('confidence_score'),
  rawAiResponse: jsonb('raw_ai_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  brandContext: jsonb('brand_context'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const campaignAds = pgTable(
  'campaign_ads',
  {
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    adId: uuid('ad_id')
      .notNull()
      .references(() => ads.id, { onDelete: 'cascade' }),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull().defaultNow(),
    notes: text('notes'),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.campaignId, table.adId] }),
    adIdIdx: index('idx_campaign_ads_ad_id').on(table.adId),
  }),
);

export const briefs = pgTable('briefs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => campaigns.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull().default(''),
  referenceAdIds: uuid('reference_ad_ids').array().notNull().default(sql`'{}'::uuid[]`),
  generatedBy: generatedByEnum('generated_by').notNull().default('MANUAL'),
  rawAiResponse: jsonb('raw_ai_response'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const searchQueries = pgTable('search_queries', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  queryText: text('query_text').notNull(),
  platformFilter: platformEnum('platform_filter'),
  filtersApplied: jsonb('filters_applied'),
  resultsCount: integer('results_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Videos (frontend-facing ad creatives) ───────────────────────────────────

export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    sourceAdId: uuid('source_ad_id').references(() => ads.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    brand: text('brand').notNull(),
    platform: platformEnum('platform').notNull(),
    category: text('category').notNull().default('General'),
    thumbnailUrl: text('thumbnail_url').notNull().default(''),
    videoUrl: text('video_url').notNull().default(''),
    duration: integer('duration').notNull().default(0),
    spendCents: numeric('spend_cents', { precision: 20, scale: 0 }),
    impressions: numeric('impressions', { precision: 20, scale: 0 }),
    ctrPercent: decimal('ctr_percent', { precision: 5, scale: 2 }),
    engagementRate: decimal('engagement_rate', { precision: 5, scale: 2 }),
    hookRate: decimal('hook_rate', { precision: 5, scale: 2 }),
    performanceTier: performanceTierEnum('performance_tier'),
    sourceUrl: text('source_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    platformIdx: index('idx_videos_platform').on(table.platform),
    categoryIdx: index('idx_videos_category').on(table.category),
    tierIdx: index('idx_videos_tier').on(table.performanceTier),
    sourceAdIdx: index('idx_videos_source_ad').on(table.sourceAdId),
  }),
);

export const heatmapZones = pgTable('heatmap_zones', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  videoId: uuid('video_id')
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  startPct: integer('start_pct').notNull(),
  endPct: integer('end_pct').notNull(),
  type: text('type').notNull(), // 'hook' | 'proof' | 'cta'
  label: text('label').notNull(),
});

export const transcriptSegments = pgTable('transcript_segments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  videoId: uuid('video_id')
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  timeSec: decimal('time_sec', { precision: 8, scale: 2 }).notNull(),
  text: text('text').notNull(),
});

// ─── User Briefs (frontend Brief type) ───────────────────────────────────────

export const userBriefs = pgTable('user_briefs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  campaign: text('campaign').notNull().default(''),
  angle: text('angle').notNull().default(''),
  content: text('content').notNull().default(''),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const briefCollaborators = pgTable(
  'brief_collaborators',
  {
    briefId: uuid('brief_id')
      .notNull()
      .references(() => userBriefs.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('editor'), // 'owner' | 'editor' | 'viewer'
    invitedAt: timestamp('invited_at', { withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.briefId, table.userId] }),
  }),
);

export const briefReferences = pgTable(
  'brief_references',
  {
    briefId: uuid('brief_id')
      .notNull()
      .references(() => userBriefs.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    addedBy: uuid('added_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.briefId, table.videoId] }),
  }),
);

export const hookSnippets = pgTable('hook_snippets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  briefId: uuid('brief_id')
    .notNull()
    .references(() => userBriefs.id, { onDelete: 'cascade' }),
  videoId: uuid('video_id')
    .notNull()
    .references(() => videos.id, { onDelete: 'cascade' }),
  videoTitle: text('video_title').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull().default(''),
  startTime: decimal('start_time', { precision: 8, scale: 2 }).notNull().default('0'),
  endTime: decimal('end_time', { precision: 8, scale: 2 }).notNull().default('3'),
  notes: text('notes').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const briefReactions = pgTable(
  'brief_reactions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    briefId: uuid('brief_id')
      .notNull()
      .references(() => userBriefs.id, { onDelete: 'cascade' }),
    videoId: uuid('video_id')
      .notNull()
      .references(() => videos.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    reaction: text('reaction').notNull(), // 'like' | 'dislike'
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueReaction: uniqueIndex('idx_brief_reactions_unique').on(
      table.briefId,
      table.videoId,
      table.userId,
    ),
  }),
);

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Ad = typeof ads.$inferSelect;
export type NewAd = typeof ads.$inferInsert;

export type AdDecomposition = typeof adDecompositions.$inferSelect;
export type NewAdDecomposition = typeof adDecompositions.$inferInsert;

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;

export type CampaignAd = typeof campaignAds.$inferSelect;
export type NewCampaignAd = typeof campaignAds.$inferInsert;

export type Brief = typeof briefs.$inferSelect;
export type NewBrief = typeof briefs.$inferInsert;

export type SearchQuery = typeof searchQueries.$inferSelect;
export type NewSearchQuery = typeof searchQueries.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type HeatmapZone = typeof heatmapZones.$inferSelect;
export type NewHeatmapZone = typeof heatmapZones.$inferInsert;

export type TranscriptSegment = typeof transcriptSegments.$inferSelect;
export type NewTranscriptSegment = typeof transcriptSegments.$inferInsert;

export type UserBrief = typeof userBriefs.$inferSelect;
export type NewUserBrief = typeof userBriefs.$inferInsert;

export type BriefCollaborator = typeof briefCollaborators.$inferSelect;
export type BriefReference = typeof briefReferences.$inferSelect;
export type HookSnippet = typeof hookSnippets.$inferSelect;
export type NewHookSnippet = typeof hookSnippets.$inferInsert;
export type BriefReaction = typeof briefReactions.$inferSelect;
