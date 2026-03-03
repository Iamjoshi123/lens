/**
 * Fastify JSON Schema definitions for ad search endpoint.
 * Used for request validation and OpenAPI documentation.
 */

export const searchAdsBodySchema = {
  type: 'object',
  required: ['query', 'platform'],
  properties: {
    query: {
      type: 'string',
      minLength: 2,
      maxLength: 200,
      description: 'Search query for ad discovery',
    },
    platform: {
      type: 'string',
      enum: ['META', 'TIKTOK'],
      description: 'Platform to search',
    },
    country: {
      type: 'string',
      minLength: 2,
      maxLength: 5,
      default: 'US',
      description: 'Country code (ISO 3166-1 alpha-2)',
    },
    adType: {
      type: 'string',
      enum: ['all', 'image', 'video'],
      default: 'all',
      description: 'Filter by media type',
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 50,
      default: 20,
      description: 'Maximum number of results to return',
    },
  },
  additionalProperties: false,
} as const;

export const searchAdsResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        results: {
          type: 'array',
          items: { type: 'object' },
        },
        totalFound: { type: 'integer' },
        searchId: { type: 'string' },
      },
    },
  },
} as const;

/** Typed request body — mirrors the JSON Schema above */
export interface SearchAdsBody {
  query: string;
  platform: 'META' | 'TIKTOK';
  country?: string;
  adType?: 'all' | 'image' | 'video';
  limit?: number;
}
