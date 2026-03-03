export const APP_VERSION = '1.0.0';

export const QUEUE_NAMES = {
  SCREENSHOT_CAPTURE: 'screenshot-capture',
  LANDING_PAGE_SCRAPE: 'landing-page-scrape',
  AD_FRESHNESS_CHECK: 'ad-freshness-check',
  PERFORMANCE_TIER_RECALC: 'performance-tier-recalc',
} as const;

export const API_PREFIX = '/api/v1';

/** Minimum query length for ad search */
export const SEARCH_QUERY_MIN_LENGTH = 2;
/** Maximum query length for ad search */
export const SEARCH_QUERY_MAX_LENGTH = 200;
/** Maximum ads returned per search request */
export const SEARCH_MAX_LIMIT = 50;
/** Default ads returned per search request */
export const SEARCH_DEFAULT_LIMIT = 20;

/** Number of consecutive scrape misses before marking an ad inactive */
export const AD_INACTIVE_MISS_THRESHOLD = 3;

/** Performance tier score thresholds (0-100) */
export const TIER_THRESHOLDS = {
  TOP: 80,
  HIGH: 60,
  MID: 35,
  LOW: 0,
} as const;
