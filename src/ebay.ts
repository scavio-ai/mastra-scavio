import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// eBay - 3 endpoints. 1 credit flat on all three endpoints.

export const ebayToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioEbaySearch',
    id: 'scavio-ebay-search',
    platform: 'ebay',
    endpoint: '/api/v1/ebay/search',
    credits: 1,
    description:
      'Search live or SOLD eBay listings: price, condition, bids, shipping, seller, feedback. ' +
      'Provide query or seller; per_page accepts only 60, 120 or 240. Costs 1 credit.',
    inputSchema: z.object({
      query: z.string().optional()
        .describe(
          'Keyword to search (1-500 characters). Optional: a seller-only search pages that ' +
          'seller\'s whole catalogue.',
        ),
      seller: z.string().optional()
        .describe(
          'Restrict results to one seller\'s listings (1-64 characters), as in ' +
          'ebay.com/usr/<name>. Can be sent with no query.',
        ),
      page: z.number().int().optional().describe('Results page, 1-based.'),
      sort_by: z.enum([
        'best_match',
        'ending_soonest',
        'newly_listed',
        'price_low',
        'price_high',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'best_match\'. eBay\'s \'Distance: nearest first\' is ' +
          'deliberately unsupported (it ranks against our proxy exit, not the caller).',
        ),
      min_price: z.number().optional().describe('Minimum price, inclusive. Must be 0 or greater.'),
      max_price: z.number().optional().describe('Maximum price, inclusive. Must be 0 or greater.'),
      condition: z.enum(['new', 'open_box', 'refurbished', 'used', 'for_parts']).optional()
        .describe(
          'Item condition filter. \'refurbished\' is eBay\'s parent condition, not one of its ' +
          'three graded tiers.',
        ),
      buying_format: z.enum(['auction', 'buy_it_now', 'best_offer']).optional()
        .describe(
          'Listing format: auction, fixed price (buy_it_now), or fixed price accepting offers ' +
          '(best_offer).',
        ),
      free_shipping: z.boolean().optional().describe('Only listings with free shipping.'),
      sold: z.boolean().optional()
        .describe(
          'Search completed listings that actually SOLD, for price research. eBay publishes no ' +
          'headline count on this view, so total_results is null.',
        ),
      category_id: z.string().optional()
        .describe(
          'eBay category id; must be numeric (e.g. \'112529\'). An unrecognised id returns the ' +
          'UNFILTERED set under a 200.',
        ),
      per_page: z.union([z.literal(60), z.literal(120), z.literal(240)]).optional()
        .describe(
          'Listings per page: 60, 120 or 240 only. Defaults to 60; eBay silently falls back to ' +
          '60 for anything else.',
        ),
    }),
    call: (client, input) => client.ebay.search(input),
  }),
  defineScavioTool({
    key: 'scavioEbayProduct',
    id: 'scavio-ebay-product',
    platform: 'ebay',
    endpoint: '/api/v1/ebay/product',
    credits: 1,
    description:
      'One eBay listing in full: price, condition, images, item specifics, shipping, returns, ' +
      'auction state, seller. Costs 1 credit.',
    inputSchema: z.object({
      item_id: z.string()
        .describe(
          'eBay item number (e.g. \'168591664725\'), or a full ebay.com/itm/... listing URL; ' +
          'tracking parameters on a pasted URL are discarded.',
        ),
    }),
    call: (client, input) => client.ebay.product(input),
  }),
  defineScavioTool({
    key: 'scavioEbaySeller',
    id: 'scavio-ebay-seller',
    platform: 'ebay',
    endpoint: '/api/v1/ebay/seller',
    credits: 1,
    description:
      'eBay seller profile card: store name, feedback score and %, items sold, followers, ' +
      'location, categories. Profile only: page a catalogue with search(seller=...). Costs 1 ' +
      'credit.',
    inputSchema: z.object({
      seller: z.string()
        .describe(
          'eBay username as it appears in ebay.com/usr/<name> (1-64 characters), which is what ' +
          'seller_name on a search or product result returns.',
        ),
    }),
    call: (client, input) => client.ebay.seller(input),
  }),
];

export const createScavioEbaySearchTool = toolFactory(ebayToolSpecs, 'scavioEbaySearch');
export const createScavioEbayProductTool = toolFactory(ebayToolSpecs, 'scavioEbayProduct');
export const createScavioEbaySellerTool = toolFactory(ebayToolSpecs, 'scavioEbaySeller');
