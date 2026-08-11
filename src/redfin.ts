import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Redfin - 3 endpoints. 1 credit flat on all three endpoints.

export const redfinToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioRedfinSearch',
    id: 'scavio-redfin-search',
    platform: 'redfin',
    endpoint: '/api/v1/redfin/search',
    credits: 1,
    description:
      'Redfin listings: price, price per sqft, beds, baths, living area, lot size, year built, ' +
      'coordinates, listing remarks and full photo galleries, for sale, sold or for rent. Up to ' +
      '350 per page. Provide location, or region_id together with region_type. Costs 1 credit.',
    inputSchema: z.object({
      location: z.string().optional()
        .describe(
          'A redfin.com region URL (/city/, /neighborhood/, /county/, /zipcode/) or a bare ' +
          '5-digit ZIP (1-500 characters). CITY NAMES ARE NOT ACCEPTED - Redfin\'s own name ' +
          'lookup is blocked to us; use region_id + region_type instead.',
        ),
      region_id: z.number().int().optional()
        .describe(
          'Redfin internal region id (>= 1), used together with region_type. NOT a ZIP code - ' +
          'the two are different number spaces and a ZIP here resolves to another city rather ' +
          'than failing.',
        ),
      region_type: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(6)]).optional()
        .describe(
          'Region kind that region_id belongs to: 1 neighborhood, 2 ZIP, 5 county, 6 city. Must ' +
          'be sent together with region_id or both are ignored in favour of location.',
        ),
      listing_status: z.enum(['for_sale', 'sold', 'for_rent']).optional()
        .describe(
          'Market to search. Defaults to \'for_sale\'.',
        ),
      sold_within_days: z.number().int().optional()
        .describe(
          'Sold within the last N days (>= 1). REJECTED unless listing_status=\'sold\', where it ' +
          'defaults to 90.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based; page size is whatever limit is set to. No upper bound.',
        ),
      limit: z.number().int().optional().describe('Listings per page, 1-350. Defaults to 100.'),
      sort: z.enum([
        'recommended',
        'price_low',
        'price_high',
        'newest',
        'oldest',
        'sqft_low',
        'sqft_high',
        'price_per_sqft_low',
        'price_per_sqft_high',
      ]).optional()
        .describe(
          'Result sort order. Defaults to \'recommended\', Redfin\'s own ranking.',
        ),
      min_price: z.number().optional()
        .describe(
          'Minimum price, inclusive (>= 0). Monthly rent when listing_status=\'for_rent\'.',
        ),
      max_price: z.number().optional()
        .describe(
          'Maximum price, inclusive (>= 0). Monthly rent when listing_status=\'for_rent\'.',
        ),
      beds_min: z.number().int().optional()
        .describe(
          'Minimum bedrooms (whole number >= 0); fractional values are rejected.',
        ),
      beds_max: z.number().int().optional()
        .describe(
          'Maximum bedrooms (whole number >= 0); fractional values are rejected.',
        ),
      baths_min: z.number().int().optional()
        .describe(
          'Minimum bathrooms (whole number >= 0). WHOLE BATHS ONLY - 1.5 is rejected rather than ' +
          'silently truncated to 1. There is no baths_max.',
        ),
      sqft_min: z.number().int().optional()
        .describe(
          'Minimum living area in square feet (whole number >= 0).',
        ),
      sqft_max: z.number().int().optional()
        .describe(
          'Maximum living area in square feet (whole number >= 0).',
        ),
      lot_size_min: z.number().int().optional()
        .describe(
          'Minimum lot size in square feet (whole number >= 0). There is no lot_size_max.',
        ),
      year_built_min: z.number().int().optional()
        .describe(
          'Earliest year built (whole number >= 0).',
        ),
      year_built_max: z.number().int().optional()
        .describe(
          'Latest year built (whole number >= 0).',
        ),
      max_hoa: z.number().optional().describe('Maximum monthly HOA fee in dollars (>= 0).'),
      property_type: z.enum([
        'house',
        'condo',
        'townhouse',
        'multi_family',
        'land',
        'other',
        'co_op',
      ]).optional()
        .describe(
          'Restrict to one property type.',
        ),
      has_pool: z.boolean().optional().describe('Only listings with a pool.'),
      max_days_on_market: z.number().int().optional()
        .describe(
          'Listed at most N days ago (whole number >= 0). Cannot be combined with ' +
          'min_days_on_market - Redfin expresses both bounds through one param.',
        ),
      min_days_on_market: z.number().int().optional()
        .describe(
          'Listed at least N days ago (whole number >= 0). Cannot be combined with ' +
          'max_days_on_market.',
        ),
    }),
    call: (client, input) => client.redfin.search(input),
  }),
  defineScavioTool({
    key: 'scavioRedfinProperty',
    id: 'scavio-redfin-property',
    platform: 'redfin',
    endpoint: '/api/v1/redfin/property',
    credits: 1,
    description:
      'One Redfin listing in full: price, Redfin Estimate and rental estimate, complete MLS fact ' +
      'sheet, price and tax history, listing agents, open houses, schools, climate risk, ' +
      'walkability, sun exposure, monthly weather, permits, zoning, comparable sales and photos. ' +
      'Costs 1 credit.',
    inputSchema: z.object({
      property_id: z.string()
        .describe(
          'Redfin property id, or any redfin.com listing URL carrying one (1-500 characters).',
        ),
    }),
    call: (client, input) => client.redfin.property(input),
  }),
  defineScavioTool({
    key: 'scavioRedfinMarket',
    id: 'scavio-redfin-market',
    platform: 'redfin',
    endpoint: '/api/v1/redfin/market',
    credits: 1,
    description:
      'Redfin housing-market stats for a region: median list and sale price, price per sqft, ' +
      'sale-to-list ratio, average offers and days on market, YoY movement, 0-100 compete score, ' +
      'live inventory by property type and by bedroom count, and Redfin agent presence. Provide ' +
      'location, or region_id together with region_type. Costs 1 credit.',
    inputSchema: z.object({
      location: z.string().optional()
        .describe(
          'A redfin.com region URL (/city/, /neighborhood/, /county/, /zipcode/) or a bare ' +
          '5-digit ZIP (1-500 characters). City names are not accepted.',
        ),
      region_id: z.number().int().optional()
        .describe(
          'Redfin internal region id (>= 1), used together with region_type. Not a ZIP code.',
        ),
      region_type: z.union([z.literal(1), z.literal(2), z.literal(5), z.literal(6)]).optional()
        .describe(
          'Region kind that region_id belongs to: 1 neighborhood, 2 ZIP, 5 county, 6 city. Must ' +
          'be sent together with region_id or both are ignored in favour of location.',
        ),
    }),
    call: (client, input) => client.redfin.market(input),
  }),
];

export const createScavioRedfinSearchTool = toolFactory(redfinToolSpecs, 'scavioRedfinSearch');
export const createScavioRedfinPropertyTool = toolFactory(redfinToolSpecs, 'scavioRedfinProperty');
export const createScavioRedfinMarketTool = toolFactory(redfinToolSpecs, 'scavioRedfinMarket');
