import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Home Depot - 3 endpoints. 2 credits flat on all three endpoints.

export const homeDepotToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioHomeDepotSearch',
    id: 'scavio-home-depot-search',
    platform: 'home-depot',
    endpoint: '/api/v1/homedepot/search',
    credits: 2,
    description:
      'Search Home Depot: price and promotions, brand and model, ratings, badges, per-store ' +
      'pickup/delivery. Page size is fixed at 12 and cannot be changed. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Search keyword (1-500 characters).'),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. Home Depot serves 12 products per page and offers no way to ' +
          'change that, so paging is the only way to read further.',
        ),
      sort_by: z.enum([
        'best_match',
        'top_sellers',
        'top_rated',
        'price_low',
        'price_high',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'best_match\'. Closed enum: Home Depot answers an ' +
          'unknown sort with an empty page that is still billed. \'Newest\' is absent - it is ' +
          'rejected on keyword search.',
        ),
      min_price: z.number().optional().describe('Minimum price, inclusive. Must be 0 or greater.'),
      max_price: z.number().optional().describe('Maximum price, inclusive. Must be 0 or greater.'),
    }),
    call: (client, input) => client.homeDepot.search(input),
  }),
  defineScavioTool({
    key: 'scavioHomeDepotProduct',
    id: 'scavio-home-depot-product',
    platform: 'home-depot',
    endpoint: '/api/v1/homedepot/product',
    credits: 2,
    description:
      'Full Home Depot item detail: pricing, images and videos, spec table, dimensions, bullets, ' +
      'documents, return policy. Carries a 10-review preview only. Costs 2 credits.',
    inputSchema: z.object({
      item_id: z.string()
        .describe(
          'Home Depot item id (e.g. \'325479354\'), or a full homedepot.com/p/... product URL; ' +
          'tracking parameters on a pasted URL are discarded.',
        ),
    }),
    call: (client, input) => client.homeDepot.product(input),
  }),
  defineScavioTool({
    key: 'scavioHomeDepotReviews',
    id: 'scavio-home-depot-reviews',
    platform: 'home-depot',
    endpoint: '/api/v1/homedepot/reviews',
    credits: 2,
    description:
      'One page of full Home Depot review bodies, the rating distribution, per-attribute ' +
      'ratings, photos and seller responses. 30 reviews per page. Costs 2 credits.',
    inputSchema: z.object({
      item_id: z.string()
        .describe(
          'Home Depot item id (e.g. \'325479354\'), or a full homedepot.com/p/... product URL; ' +
          'tracking parameters on a pasted URL are discarded.',
        ),
      page: z.number().int().optional()
        .describe(
          'Reviews page, 1-based. 30 reviews per page; \'total_pages\' in the response is the ' +
          'last one that exists, and asking past it is a 404.',
        ),
    }),
    call: (client, input) => client.homeDepot.reviews(input),
  }),
];

export const createScavioHomeDepotSearchTool = toolFactory(
  homeDepotToolSpecs,
  'scavioHomeDepotSearch',
);
export const createScavioHomeDepotProductTool = toolFactory(
  homeDepotToolSpecs,
  'scavioHomeDepotProduct',
);
export const createScavioHomeDepotReviewsTool = toolFactory(
  homeDepotToolSpecs,
  'scavioHomeDepotReviews',
);
