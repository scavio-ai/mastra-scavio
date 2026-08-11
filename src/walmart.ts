import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Walmart - 7 endpoints. BODY-PRICED, not flat: search and category cost 1 credit on domain
// 'com' or 'ca' and 2 credits on 'com.mx'. The other five endpoints take no domain, so they are
// always 1 credit.

export const walmartToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioWalmartSearch',
    id: 'scavio-walmart-search',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/search',
    credits: 1,
    description:
      'Search Walmart and get structured product rows (products, products_count and the store ' +
      'the results were priced against). Costs 1 credit on domain \'com\' or \'ca\' and 2 ' +
      'credits on \'com.mx\'.',
    inputSchema: z.object({
      query: z.string().describe('Product search query (1-500 characters).'),
      domain: z.enum(['com', 'ca', 'com.mx']).optional()
        .describe(
          'Marketplace: \'com\' (US, default, 1 credit), \'ca\' (1 credit), \'com.mx\' (2 ' +
          'credits). Sets the currency and product URLs of the response.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based (integer >= 1). One page per call.',
        ),
      start_page: z.number().int().optional()
        .describe(
          'Deprecated alias for page; send page instead.',
        ),
      sort_by: z.enum([
        'best_match',
        'price_low',
        'price_high',
        'best_seller',
        'rating_high',
        'new',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'best_match\'.',
        ),
      min_price: z.number().optional()
        .describe(
          'Minimum price filter in the marketplace\'s own currency; decimals allowed (e.g. ' +
          '19.99).',
        ),
      max_price: z.number().optional()
        .describe(
          'Maximum price filter in the marketplace\'s own currency; decimals allowed (e.g. ' +
          '199.5).',
        ),
      fulfillment_speed: z.enum(['today', 'tomorrow']).optional()
        .describe(
          'Only items deliverable today, or by tomorrow. \'2_days\' and \'anytime\' are not ' +
          'accepted - for anytime, omit this parameter.',
        ),
      fulfillment_type: z.enum(['in_store']).optional()
        .describe(
          'Set to \'in_store\' to return only items available for in-store pickup.',
        ),
    }),
    call: (client, input) => client.walmart.search(input),
  }),
  defineScavioTool({
    key: 'scavioWalmartProduct',
    id: 'scavio-walmart-product',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/product',
    credits: 1,
    description:
      'Full detail for a single Walmart product: price, rating, images, specifications, ' +
      'availability and seller. US marketplace only - walmart.ca product pages could not be ' +
      'fetched at all, so this endpoint takes no domain. Costs 1 credit. Walmart is body-priced ' +
      'through `domain`, but this endpoint takes no domain, so it is always 1.',
    inputSchema: z.object({
      product_id: z.string().describe('Walmart item id (usItemId), e.g. \'13544111159\'.'),
    }),
    call: (client, input) => client.walmart.product(input),
  }),
  defineScavioTool({
    key: 'scavioWalmartReviews',
    id: 'scavio-walmart-reviews',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/reviews',
    credits: 1,
    description:
      'Customer reviews for a Walmart product with ratings, text, author, date and the rating ' +
      'breakdown. 10 reviews per page; paginate with page. Costs 1 credit. Walmart is ' +
      'body-priced through `domain`, but this endpoint takes no domain, so it is always 1.',
    inputSchema: z.object({
      product_id: z.string().describe('Walmart item id (usItemId), e.g. \'13544111159\'.'),
      page: z.number().int().optional()
        .describe(
          'Reviews page, 1-based (integer >= 1). 10 reviews per page.',
        ),
      sort: z.enum([
        'relevancy',
        'submission-desc',
        'submission-asc',
        'rating-desc',
        'rating-asc',
        'helpful-desc',
      ]).optional()
        .describe(
          'Review sort order. Omit for Walmart\'s own default ordering.',
        ),
    }),
    call: (client, input) => client.walmart.reviews(input),
  }),
  defineScavioTool({
    key: 'scavioWalmartCategory',
    id: 'scavio-walmart-category',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/category',
    credits: 1,
    description:
      'Products within a Walmart category, in the same product shape as search. Costs 1 credit ' +
      'on domain \'com\' or \'ca\' and 2 credits on \'com.mx\'; `limit` trims the response after ' +
      'fetching and never reduces the cost.',
    inputSchema: z.object({
      category_id: z.string()
        .describe(
          'Walmart category id: either a leaf id (\'1095191\') or the full underscore-joined ' +
          'path (\'3944_133251_1095191\'). Both are accepted.',
        ),
      domain: z.enum(['com', 'ca', 'com.mx']).optional()
        .describe(
          'Marketplace: \'com\' (US, default, 1 credit), \'ca\' (1 credit), \'com.mx\' (2 ' +
          'credits). Sets the currency and product URLs of the response.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based (integer >= 1). One page per call.',
        ),
      limit: z.number().int().optional()
        .describe(
          'Trim the returned products to at most this many (integer >= 1). Applied after ' +
          'fetching, so it does not reduce the credit cost of the call.',
        ),
      sort_by: z.enum([
        'best_match',
        'price_low',
        'price_high',
        'best_seller',
        'rating_high',
        'new',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'best_match\'.',
        ),
      min_price: z.number().optional()
        .describe(
          'Minimum price filter in the marketplace\'s own currency; decimals allowed (e.g. ' +
          '19.99).',
        ),
      max_price: z.number().optional()
        .describe(
          'Maximum price filter in the marketplace\'s own currency; decimals allowed (e.g. ' +
          '199.5).',
        ),
      fulfillment_speed: z.enum(['today', 'tomorrow']).optional()
        .describe(
          'Only items deliverable today, or by tomorrow. \'2_days\' and \'anytime\' are not ' +
          'accepted - for anytime, omit this parameter.',
        ),
    }),
    call: (client, input) => client.walmart.category(input),
  }),
  defineScavioTool({
    key: 'scavioWalmartOffers',
    id: 'scavio-walmart-offers',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/offers',
    credits: 1,
    description:
      'The buy-box offer for a Walmart product: price, seller, condition and buy-box flag. ' +
      'BUY-BOX SELLER ONLY - this is not the full offer list, and there is no way to page ' +
      'through the other sellers. Costs 1 credit. Walmart is body-priced through `domain`, but ' +
      'this endpoint takes no domain, so it is always 1.',
    inputSchema: z.object({
      product_id: z.string().describe('Walmart item id (usItemId), e.g. \'2979510112\'.'),
    }),
    call: (client, input) => client.walmart.offers(input),
  }),
  defineScavioTool({
    key: 'scavioWalmartSeller',
    id: 'scavio-walmart-seller',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/seller',
    credits: 1,
    description:
      'Marketplace seller storefront: name, rating, review count, Pro Seller badge and business ' +
      'details. Costs 1 credit. Walmart is body-priced through `domain`, but this endpoint takes ' +
      'no domain, so it is always 1.',
    inputSchema: z.object({
      seller_id: z.string()
        .describe(
          'Numeric Walmart catalog seller id, as returned in `seller_catalog_id` on a product, ' +
          'search or offers response (e.g. \'101480084\'). The GUID `seller_id` is not accepted ' +
          'here - it 404s.',
        ),
    }),
    call: (client, input) => client.walmart.seller(input),
  }),
  defineScavioTool({
    key: 'scavioWalmartSellerProducts',
    id: 'scavio-walmart-seller-products',
    platform: 'walmart',
    endpoint: '/api/v1/walmart/seller-products',
    credits: 1,
    description:
      'A marketplace seller\'s catalog. Roughly the first 40 items are server-rendered and ' +
      'returned; total_count reports the seller\'s real catalog size. There is no pagination - ' +
      'the rest of the catalog is not reachable. Costs 1 credit. Walmart is body-priced through ' +
      '`domain`, but this endpoint takes no domain, so it is always 1.',
    inputSchema: z.object({
      seller_id: z.string()
        .describe(
          'Numeric Walmart catalog seller id, as returned in `seller_catalog_id` on a product, ' +
          'search or offers response (e.g. \'101480084\'). The GUID `seller_id` 404s.',
        ),
    }),
    call: (client, input) => client.walmart.sellerProducts(input),
  }),
];

export const createScavioWalmartSearchTool = toolFactory(walmartToolSpecs, 'scavioWalmartSearch');
export const createScavioWalmartProductTool = toolFactory(walmartToolSpecs, 'scavioWalmartProduct');
export const createScavioWalmartReviewsTool = toolFactory(walmartToolSpecs, 'scavioWalmartReviews');
export const createScavioWalmartCategoryTool = toolFactory(
  walmartToolSpecs,
  'scavioWalmartCategory',
);
export const createScavioWalmartOffersTool = toolFactory(walmartToolSpecs, 'scavioWalmartOffers');
export const createScavioWalmartSellerTool = toolFactory(walmartToolSpecs, 'scavioWalmartSeller');
export const createScavioWalmartSellerProductsTool = toolFactory(
  walmartToolSpecs,
  'scavioWalmartSellerProducts',
);
