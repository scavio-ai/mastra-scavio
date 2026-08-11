import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Target - 4 endpoints. 1 credit flat on all four endpoints.

export const targetToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioTargetSearch',
    id: 'scavio-target-search',
    platform: 'target',
    endpoint: '/api/v1/target/search',
    credits: 1,
    description:
      'Search Target.com, the US retailer: prices, ratings, badges and promotions. Up to 28 ' +
      'results per page; rendered upstream, so expect around 9 seconds. Costs 1 credit.',
    inputSchema: z.object({
      keyword: z.string().describe('Search keyword (1-500 characters).'),
      page: z.number().int().optional().describe('Results page, 1-based.'),
      count: z.number().int().optional()
        .describe(
          'Results per page, 1-28. Defaults to 24; Target rejects anything above 28 outright.',
        ),
      sort: z.enum([
        'relevance',
        'featured',
        'price_low',
        'price_high',
        'rating_high',
        'best_seller',
        'newest',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'relevance\'.',
        ),
      store_id: z.string().optional()
        .describe(
          'Numeric Target store id whose prices and availability the response reflects. Defaults ' +
          'to \'3991\', the store target.com uses with no store context.',
        ),
    }),
    call: (client, input) => client.target.search(input),
  }),
  defineScavioTool({
    key: 'scavioTargetCategory',
    id: 'scavio-target-category',
    platform: 'target',
    endpoint: '/api/v1/target/category',
    credits: 1,
    description:
      'Products in a Target category, same shape as search plus the category breadcrumb. Up to ' +
      '28 per page; the slowest Target endpoint at around 37 seconds. Costs 1 credit.',
    inputSchema: z.object({
      category_id: z.string()
        .describe(
          'Target category id: the segment after \'N-\' in a target.com /c/ URL ' +
          '(target.com/c/apple/-/N-5xtg6 -> \'5xtg6\').',
        ),
      page: z.number().int().optional().describe('Results page, 1-based.'),
      count: z.number().int().optional()
        .describe(
          'Results per page, 1-28. Defaults to 24; Target rejects anything above 28 outright.',
        ),
      sort: z.enum([
        'relevance',
        'featured',
        'price_low',
        'price_high',
        'rating_high',
        'best_seller',
        'newest',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'relevance\'.',
        ),
      store_id: z.string().optional()
        .describe(
          'Numeric Target store id whose prices and availability the response reflects. Defaults ' +
          'to \'3991\'.',
        ),
    }),
    call: (client, input) => client.target.category(input),
  }),
  defineScavioTool({
    key: 'scavioTargetProduct',
    id: 'scavio-target-product',
    platform: 'target',
    endpoint: '/api/v1/target/product',
    credits: 1,
    description:
      'Target product details by TCIN: price, rating, images, specifications, variants, return ' +
      'policy, fulfillment. seller_id/seller_name are null for stock sold by Target. Costs 1 ' +
      'credit.',
    inputSchema: z.object({
      tcin: z.string()
        .describe(
          'Target catalog id (tcin, e.g. \'1010453160\'). A colour/size child tcin is answered ' +
          'by its variation parent, with the child present in \'variants\'.',
        ),
      store_id: z.string().optional()
        .describe(
          'Numeric Target store id whose prices and availability the response reflects. Defaults ' +
          'to \'3991\'.',
        ),
    }),
    call: (client, input) => client.target.product(input),
  }),
  defineScavioTool({
    key: 'scavioTargetReviews',
    id: 'scavio-target-reviews',
    platform: 'target',
    endpoint: '/api/v1/target/reviews',
    credits: 1,
    description:
      'Target reviews with the rating breakdown, per-attribute averages and guest photos. 8 ' +
      'review bodies maximum and no paging; expect around 40 seconds. Costs 1 credit.',
    inputSchema: z.object({
      tcin: z.string().describe('Target catalog id (tcin, e.g. \'1010453160\').'),
      limit: z.number().int().optional()
        .describe(
          'Trim the returned reviews to at most this many (1 or greater). Target publishes 8 ' +
          'anonymously and offers no paging, so this only trims.',
        ),
      store_id: z.string().optional()
        .describe(
          'Numeric Target store id whose prices and availability the response reflects. Defaults ' +
          'to \'3991\'.',
        ),
    }),
    call: (client, input) => client.target.reviews(input),
  }),
];

export const createScavioTargetSearchTool = toolFactory(targetToolSpecs, 'scavioTargetSearch');
export const createScavioTargetCategoryTool = toolFactory(targetToolSpecs, 'scavioTargetCategory');
export const createScavioTargetProductTool = toolFactory(targetToolSpecs, 'scavioTargetProduct');
export const createScavioTargetReviewsTool = toolFactory(targetToolSpecs, 'scavioTargetReviews');
