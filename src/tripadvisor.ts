import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Tripadvisor - 4 endpoints. 2 credits flat on all four endpoints.
//
// LOOKUP FIRST: scavio-tripadvisor-locations is the entry point. Every other Tripadvisor
// endpoint is keyed by an id that only exists inside Tripadvisor's own URLs, so a caller holding
// a name resolves it here before anything else will answer.

export const tripadvisorToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioTripadvisorLocations',
    id: 'scavio-tripadvisor-locations',
    platform: 'tripadvisor',
    endpoint: '/api/v1/tripadvisor/locations',
    credits: 2,
    description:
      'START HERE: resolve a place or business NAME to the TripAdvisor geo_id / location_id pair ' +
      'every other TripAdvisor endpoint is keyed by. Up to 20 rows. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Place or business name to resolve (1-120 characters).'),
      limit: z.number().int().optional()
        .describe(
          'Rows to return, 1-20 (default 12). Sizes the response only; there is no paging here.',
        ),
    }),
    call: (client, input) => client.tripadvisor.locations(input),
  }),
  defineScavioTool({
    key: 'scavioTripadvisorSearch',
    id: 'scavio-tripadvisor-search',
    platform: 'tripadvisor',
    endpoint: '/api/v1/tripadvisor/search',
    credits: 2,
    description:
      'Restaurants, hotels or attractions in a TripAdvisor geo, TripAdvisor-ranked: rating, ' +
      'review count, price band, address, coordinates, phone, hours, Travelers\' Choice badge; ' +
      'each row carries the location_id + geo_id pair. 30 locations per page. Provide geo_id or ' +
      'url. Costs 2 credits.',
    inputSchema: z.object({
      geo_id: z.string().optional()
        .describe(
          'TripAdvisor geo id (1-500 characters): 30196, g30196, or a URL carrying one. Required ' +
          'unless url is given.',
        ),
      category: z.enum(['restaurants', 'hotels', 'attractions']).optional()
        .describe(
          'Listing family to search (default \'restaurants\').',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. 30 locations per page; a page beyond the last is a 404, not an ' +
          'empty result.',
        ),
      url: z.string().optional()
        .describe(
          'Full tripadvisor.com listing URL (1-500 characters), as an alternative to geo_id; ' +
          'country sites are accepted.',
        ),
    }),
    call: (client, input) => client.tripadvisor.search(input),
  }),
  defineScavioTool({
    key: 'scavioTripadvisorLocation',
    id: 'scavio-tripadvisor-location',
    platform: 'tripadvisor',
    endpoint: '/api/v1/tripadvisor/location',
    credits: 2,
    description:
      'One TripAdvisor location in full: rating, review histogram and per-aspect sub-ratings, ' +
      'city ranking, price band, cuisines, amenities, address, coordinates, contact, photos, and ' +
      'the FIRST PAGE OF REVIEWS. Provide location_id or url. Costs 2 credits.',
    inputSchema: z.object({
      location_id: z.string().optional()
        .describe(
          'TripAdvisor location id (1-500 characters): 1899234, d1899234, or a full _Review URL. ' +
          'Required unless url is given.',
        ),
      geo_id: z.string().optional()
        .describe(
          'Geo the location sits in; required when location_id is a bare d-id.',
        ),
      category: z.enum(['restaurants', 'hotels', 'attractions']).optional()
        .describe(
          'Location family (default \'restaurants\'); match the location\'s own type.',
        ),
      url: z.string().optional()
        .describe(
          'Full tripadvisor.com _Review URL (1-500 characters), as an alternative to ' +
          'location_id.',
        ),
    }),
    call: (client, input) => client.tripadvisor.location(input),
  }),
  defineScavioTool({
    key: 'scavioTripadvisorReviews',
    id: 'scavio-tripadvisor-reviews',
    platform: 'tripadvisor',
    endpoint: '/api/v1/tripadvisor/reviews',
    credits: 2,
    description:
      'A page of TripAdvisor reviews: rating, trip date and type, reviewer home town and ' +
      'contribution count, management response. Page 1 already rides along in location(), so use ' +
      'this to page PAST it; consecutive pages can repeat one review at the boundary, so ' +
      'de-duplicate on review_id. Provide location_id or url. Costs 2 credits.',
    inputSchema: z.object({
      location_id: z.string().optional()
        .describe(
          'TripAdvisor location id (1-500 characters): 1899234, d1899234, or a full _Review URL. ' +
          'Required unless url is given.',
        ),
      geo_id: z.string().optional()
        .describe(
          'Geo the location sits in; required when location_id is a bare d-id.',
        ),
      category: z.enum(['restaurants', 'hotels', 'attractions']).optional()
        .describe(
          'Location family (default \'restaurants\'). It sets the page size, so it must match ' +
          'the location\'s own type on any page past the first.',
        ),
      url: z.string().optional()
        .describe(
          'Full tripadvisor.com _Review URL (1-500 characters), as an alternative to ' +
          'location_id.',
        ),
      page: z.number().int().optional()
        .describe(
          'Reviews page, 1-based. 15 per page for restaurants, 10 for hotels and attractions; ' +
          'past the last page is a 404.',
        ),
    }),
    call: (client, input) => client.tripadvisor.reviews(input),
  }),
];

export const createScavioTripadvisorLocationsTool = toolFactory(
  tripadvisorToolSpecs,
  'scavioTripadvisorLocations',
);
export const createScavioTripadvisorSearchTool = toolFactory(
  tripadvisorToolSpecs,
  'scavioTripadvisorSearch',
);
export const createScavioTripadvisorLocationTool = toolFactory(
  tripadvisorToolSpecs,
  'scavioTripadvisorLocation',
);
export const createScavioTripadvisorReviewsTool = toolFactory(
  tripadvisorToolSpecs,
  'scavioTripadvisorReviews',
);
