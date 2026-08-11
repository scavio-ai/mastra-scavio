import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Zillow - 3 endpoints. 1 credit flat on all three endpoints.

export const zillowToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioZillowSearch',
    id: 'scavio-zillow-search',
    platform: 'zillow',
    endpoint: '/api/v1/zillow/search',
    credits: 1,
    description:
      'Zillow listings in a region: price, beds, baths, living area, Zestimate, coordinates, ' +
      'images, days on market. A bare ZIP works alone but cannot be combined with a filter or a ' +
      'sort. Costs 1 credit.',
    inputSchema: z.object({
      location: z.string()
        .describe(
          'Region to search (1-200 characters): a Zillow slug (\'austin-tx\'), a human form ' +
          '(\'Austin, TX\'), a ZIP, or a pasted zillow.com search URL. A ZIP works alone but ' +
          'cannot be combined with a filter or sort; an unresolvable region is a 404.',
        ),
      listing_status: z.enum(['for_sale', 'for_rent', 'sold']).optional()
        .describe(
          'Which listings to return. Defaults to \'for_sale\'.',
        ),
      page: z.number().int().optional().describe('Results page, 1-based.'),
      sort: z.enum([
        'relevance',
        'recommended',
        'newest',
        'price_low',
        'price_high',
        'payment_low',
        'payment_high',
        'beds',
        'baths',
        'sqft',
        'lot_size',
        'zestimate_low',
        'zestimate_high',
        'recent_change',
      ]).optional()
        .describe(
          'Result sort order. Sorts that rank against a signed-in profile ' +
          '(saved/featured/personalised) are unsupported - we are never signed in.',
        ),
      min_price: z.number().optional()
        .describe(
          'Minimum price, inclusive (0 or greater). On listing_status=\'for_rent\' this is ' +
          'MONTHLY RENT - Zillow files rent under its payment filter.',
        ),
      max_price: z.number().optional()
        .describe(
          'Maximum price, inclusive (0 or greater). On listing_status=\'for_rent\' this is ' +
          'MONTHLY RENT.',
        ),
      beds_min: z.number().int().optional()
        .describe(
          'Minimum bedrooms; whole number, 0 or greater.',
        ),
      beds_max: z.number().int().optional()
        .describe(
          'Maximum bedrooms; whole number, 0 or greater.',
        ),
      baths_min: z.number().optional()
        .describe(
          'Minimum bathrooms, 0 or greater. Half-baths are allowed (1.5).',
        ),
      baths_max: z.number().optional()
        .describe(
          'Maximum bathrooms, 0 or greater. Half-baths are allowed (1.5).',
        ),
      sqft_min: z.number().int().optional()
        .describe(
          'Minimum living area in square feet; whole number, 0 or greater.',
        ),
      sqft_max: z.number().int().optional()
        .describe(
          'Maximum living area in square feet; whole number, 0 or greater.',
        ),
      lot_size_min: z.number().int().optional()
        .describe(
          'Minimum lot size in square feet; whole number, 0 or greater.',
        ),
      lot_size_max: z.number().int().optional()
        .describe(
          'Maximum lot size in square feet; whole number, 0 or greater.',
        ),
      year_built_min: z.number().int().optional()
        .describe(
          'Earliest year built; whole number, 0 or greater.',
        ),
      year_built_max: z.number().int().optional()
        .describe(
          'Latest year built; whole number, 0 or greater.',
        ),
      max_hoa: z.number().optional().describe('Maximum monthly HOA fee in dollars, 0 or greater.'),
      home_type: z.enum([
        'houses',
        'townhomes',
        'multi_family',
        'condos',
        'apartments',
        'manufactured',
        'lots_land',
      ]).optional()
        .describe(
          'Property type filter.',
        ),
      days_on_zillow: z.enum(['1', '7', '14', '30', '90', '6m', '12m', '24m', '36m']).optional()
        .describe(
          'Listed - or, with listing_status=\'sold\', sold - within the last N days. Closed ' +
          'enum: an unrecognised value returns the UNFILTERED set under a 200.',
        ),
      keywords: z.string().optional()
        .describe(
          'Free-text match against the listing description (1-200 characters).',
        ),
      has_pool: z.boolean().optional().describe('Only listings with a pool.'),
      has_garage: z.boolean().optional().describe('Only listings with a garage.'),
      has_air_conditioning: z.boolean().optional().describe('Only listings with air conditioning.'),
      is_waterfront: z.boolean().optional().describe('Only waterfront listings.'),
      has_basement: z.boolean().optional().describe('Only listings with a basement.'),
      is_new_construction: z.boolean().optional().describe('Only new-construction listings.'),
      has_open_house: z.boolean().optional().describe('Only listings with an upcoming open house.'),
      price_reduced: z.boolean().optional().describe('Only listings whose price was reduced.'),
      is_3d_tour: z.boolean().optional().describe('Only listings with a 3D tour.'),
    }),
    call: (client, input) => client.zillow.search(input),
  }),
  defineScavioTool({
    key: 'scavioZillowProperty',
    id: 'scavio-zillow-property',
    platform: 'zillow',
    endpoint: '/api/v1/zillow/property',
    credits: 1,
    description:
      'Full Zillow listing: price and price history, Zestimate, tax history, RESO facts, rooms, ' +
      'schools, open houses, photos. Rental buildings return floor plans instead. Costs 1 ' +
      'credit.',
    inputSchema: z.object({
      zpid: z.string()
        .describe(
          'Zillow property id (e.g. \'29414894\'), a full /homedetails/ URL, or a rental ' +
          'building URL (zillow.com/apartments/...). The building form is required for ' +
          'buildings: they have no zpid a caller can see.',
        ),
    }),
    call: (client, input) => client.zillow.property(input),
  }),
  defineScavioTool({
    key: 'scavioZillowAgentReviews',
    id: 'scavio-zillow-agent-reviews',
    platform: 'zillow',
    endpoint: '/api/v1/zillow/reviews',
    credits: 1,
    description:
      'A Zillow AGENT\'s profile and reviews: rating, bodies with sub-ratings, specialties, ' +
      'licenses, service areas, sales counts. Zillow server-renders the first five. Costs 1 ' +
      'credit.',
    inputSchema: z.object({
      screen_name: z.string()
        .describe(
          'Zillow agent profile screen name as it appears in zillow.com/profile/<name>/ (1-200 ' +
          'characters, may contain spaces), or a full profile URL.',
        ),
    }),
    call: (client, input) => client.zillow.agentReviews(input),
  }),
];

export const createScavioZillowSearchTool = toolFactory(zillowToolSpecs, 'scavioZillowSearch');
export const createScavioZillowPropertyTool = toolFactory(zillowToolSpecs, 'scavioZillowProperty');
export const createScavioZillowAgentReviewsTool = toolFactory(
  zillowToolSpecs,
  'scavioZillowAgentReviews',
);
