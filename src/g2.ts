import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// G2 Software Reviews - 3 endpoints. 5 credits flat on all three endpoints - the dearest
// platform Scavio serves. Budget for it before looping over a product list.

export const g2ToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioG2Search',
    id: 'scavio-g2-search',
    platform: 'g2',
    endpoint: '/api/v1/g2/search',
    credits: 5,
    description:
      'Search G2, the B2B software review site, for products: star rating, review count, vendor, ' +
      'categories, seller description and logo, with product_id and slug on every row. Up to 100 ' +
      'results per page (server default 20) and page-paginated; total_results is G2\'s ' +
      'Products-tab headline and caps at 10000, while total_by_type splits the query across ' +
      'products, sellers, categories and discussions. Provide query or url. Costs 5 credits.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search term (1-200 characters). Provide this or url.'),
      page: z.number().int().optional()
        .describe(
          '1-based page number; page size follows limit (server default 20). G2 keeps paginating ' +
          'well past its own widget\'s page links.',
        ),
      limit: z.number().int().optional()
        .describe(
          'Results per page (1-100; server default 20). The 100 ceiling is ours, to keep a ' +
          'single request inside the 60s deadline; G2 itself paginates at any size.',
        ),
      sort: z.enum(['relevance', 'popular', 'alphabetical', 'rating']).optional()
        .describe(
          'Result sort order (server default \'relevance\'). Closed enum: G2 silently accepts an ' +
          'unknown sort and answers 200 with an unstated ordering.',
        ),
      rating: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ]).optional()
        .describe(
          'Only products at or above this star rating (1-5, sent as an integer). Omit for no ' +
          'rating floor.',
        ),
      url: z.string().optional()
        .describe(
          'Full g2.com/search URL, as an alternative to query (1-1000 characters; the host is ' +
          'checked by the transport).',
        ),
    }),
    call: (client, input) => client.g2.search(input),
  }),
  defineScavioTool({
    key: 'scavioG2Product',
    id: 'scavio-g2-product',
    platform: 'g2',
    endpoint: '/api/v1/g2/product',
    credits: 5,
    description:
      'Full G2 product profile: rating with per-star histogram, review count, vendor, ' +
      'description and seller website, pricing editions with parsed amounts, feature groups, ' +
      'categories and breadcrumbs, supported languages, integrations, alternatives, head-to-head ' +
      'comparisons, media, community discussions and G2\'s AI-derived pros and cons. Carries NO ' +
      'review text at all -- G2 loads review bodies in a separate frame, so call reviews() for ' +
      'those. Provide product_id or url. Costs 5 credits.',
    inputSchema: z.object({
      product_id: z.string().optional()
        .describe(
          'G2 product slug (\'notion\') or the numeric G2 id (\'82623\') as a string (1-200 ' +
          'characters); both resolve on the same upstream path.',
        ),
      url: z.string().optional()
        .describe(
          'Full g2.com product URL, as an alternative to product_id (1-1000 characters).',
        ),
    }),
    call: (client, input) => client.g2.product(input),
  }),
  defineScavioTool({
    key: 'scavioG2Reviews',
    id: 'scavio-g2-reviews',
    platform: 'g2',
    endpoint: '/api/v1/g2/reviews',
    credits: 5,
    description:
      'A page of G2 reviews: rating, title, likes and dislikes, problems solved, reviewer job ' +
      'title, industry and company size, validated and incentivized flags -- plus what the ' +
      'profile page has no form of: exact per-star counts, pros and cons with per-theme counts, ' +
      'and company-size, role, industry, region and category facets with counts. Fixed at 10 ' +
      'reviews per page and paginates well past the 10 pages G2\'s own widget links to. Provide ' +
      'product_id or url. Costs 5 credits.',
    inputSchema: z.object({
      product_id: z.string().optional()
        .describe(
          'G2 product slug or numeric G2 id as a string (1-200 characters).',
        ),
      url: z.string().optional()
        .describe(
          'Full g2.com reviews URL, as an alternative to product_id (1-1000 characters).',
        ),
      page: z.number().int().optional()
        .describe(
          '1-based page number; fixed at 10 reviews per page.',
        ),
      sort: z.enum(['relevance', 'newest', 'most_helpful', 'rating_high', 'rating_low']).optional()
        .describe(
          'Review sort order (server default \'relevance\'). Closed enum: an unknown sort is ' +
          'silently accepted upstream and never runs.',
        ),
      rating: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ]).optional()
        .describe(
          'Only reviews in this star bucket (1-5, sent as an integer). Buckets are half- ' +
          'star-inclusive: 1 returns 0, 0.5 and 1-star reviews.',
        ),
      company_size: z.enum(['small_business', 'mid_market', 'enterprise']).optional()
        .describe(
          'Reviewer company size: small_business is 50 employees or fewer, mid_market 51-1000, ' +
          'enterprise over 1000. Closed enum -- an unknown value matches nothing and returns a ' +
          'billed \'Reviews (0)\'.',
        ),
      role: z.enum([
        'user',
        'administrator',
        'executive_sponsor',
        'internal_consultant',
        'consultant',
        'agency',
        'industry_analyst',
      ]).optional()
        .describe(
          'Reviewer role. Closed enum -- an unknown value matches nothing rather than erroring.',
        ),
      region: z.enum([
        'north_america',
        'europe',
        'asia',
        'latin_america',
        'anz',
        'middle_east',
        'africa',
      ]).optional()
        .describe(
          'Reviewer region. Closed enum -- an unknown value matches nothing rather than ' +
          'erroring.',
        ),
      query: z.string().optional()
        .describe(
          'Full-text search within this product\'s reviews (1-200 characters); narrows the ' +
          'review list AND every facet count.',
        ),
    }),
    call: (client, input) => client.g2.reviews(input),
  }),
];

export const createScavioG2SearchTool = toolFactory(g2ToolSpecs, 'scavioG2Search');
export const createScavioG2ProductTool = toolFactory(g2ToolSpecs, 'scavioG2Product');
export const createScavioG2ReviewsTool = toolFactory(g2ToolSpecs, 'scavioG2Reviews');
