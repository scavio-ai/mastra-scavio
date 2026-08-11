import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Yelp - 3 endpoints. 2 credits flat on all three endpoints.

export const yelpToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioYelpSearch',
    id: 'scavio-yelp-search',
    platform: 'yelp',
    endpoint: '/api/v1/yelp/search',
    credits: 2,
    description:
      'Businesses in Yelp\'s ranked order: rating, review count, price band, categories, ' +
      'address, contact rails, hours, photos and a review snippet; every row carries both ' +
      'business_id and alias. Yelp fixes the page size at 10. Provide term and location, or url. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      term: z.string().optional()
        .describe(
          'What to look for (1-200 characters): a category (\'plumbers\'), a dish, or a business ' +
          'name. Required together with location unless url is given.',
        ),
      location: z.string().optional()
        .describe(
          'Where to look (1-200 characters): city and region, a full address, or a postcode. ' +
          'Effectively required - Yelp geolocates a location-less search off the proxy exit, so ' +
          'the same request answers about a different metro run to run.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. Yelp fixes the page size at 10.',
        ),
      sort: z.enum(['recommended', 'rating', 'review_count']).optional()
        .describe(
          'Result ordering (upstream default \'recommended\'). Closed enum: Yelp IGNORES an ' +
          'unrecognised sortby and serves default ranking under a 200, billing a premium scrape ' +
          'for a sort that never ran.',
        ),
      price: z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])).optional()
        .describe(
          'Price bands to include, 1 ($) to 4 ($$$$); 1-4 values, combined freely - [1, 2] means ' +
          '$ or $$.',
        ),
      open_now: z.boolean().optional()
        .describe(
          'Only businesses open at the moment of the request.',
        ),
      attributes: z.array(z.string()).optional()
        .describe(
          'Raw Yelp filter aliases, max 20, each 1-100 characters (\'RestaurantsDelivery\', ' +
          '\'GoodForKids\', \'WheelchairAccessible\'). A deliberate PASSTHROUGH, not an enum - ' +
          'Yelp\'s vocabulary runs to ~117 values per vertical and an alias it does not know is ' +
          'ignored upstream, returning unfiltered results.',
        ),
      url: z.string().optional()
        .describe(
          'A full yelp.com/search URL (1-1000 characters) as an alternative to term + location; ' +
          'the query, offset and sort are read out of it and the URL is rebuilt.',
        ),
    }),
    call: (client, input) => client.yelp.search(input),
  }),
  defineScavioTool({
    key: 'scavioYelpBusiness',
    id: 'scavio-yelp-business',
    platform: 'yelp',
    endpoint: '/api/v1/yelp/business',
    credits: 2,
    description:
      'One business in full: rating and per-star histogram, review count, price band, ' +
      'categories, address and coordinates, phone, website and menu links, hours and holidays, ' +
      'amenities, photos and videos, popular items, health inspections, Q&A, licences and claim ' +
      'status - plus the first page of reviews at no extra cost. Provide business_id or url. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      business_id: z.string().optional()
        .describe(
          'A Yelp business alias (\'desnudo-coffee-austin-2\'), its opaque encid, or any ' +
          'yelp.com/biz URL carrying one (1-500 characters). Search rows return both id forms.',
        ),
      url: z.string().optional()
        .describe(
          'A full yelp.com/biz URL (1-1000 characters) as an alternative to business_id.',
        ),
    }),
    call: (client, input) => client.yelp.business(input),
  }),
  defineScavioTool({
    key: 'scavioYelpReviews',
    id: 'scavio-yelp-reviews',
    platform: 'yelp',
    endpoint: '/api/v1/yelp/reviews',
    credits: 2,
    description:
      'A page of reviews: rating, full text, language, author profile and expertise counts, ' +
      'attached photos, reaction counts and owner response. 10 per page. PAGE 1 IS REDUNDANT - ' +
      'it re-fetches the document business() already returned - so start at page 2. Provide ' +
      'business_id or url. Costs 2 credits.',
    inputSchema: z.object({
      business_id: z.string().optional()
        .describe(
          'A Yelp business alias (\'desnudo-coffee-austin-2\'), its opaque encid, or any ' +
          'yelp.com/biz URL carrying one (1-500 characters).',
        ),
      url: z.string().optional()
        .describe(
          'A full yelp.com/biz URL (1-1000 characters) as an alternative to business_id.',
        ),
      page: z.number().int().optional()
        .describe(
          'Reviews page, 1-based, 10 per page. Page 1 duplicates the reviews business() already ' +
          'returned and costs another 2 credits - start at 2. A page past the last review is a ' +
          '404, not an empty result.',
        ),
      sort: z.enum([
        'relevance',
        'newest',
        'oldest',
        'rating_high',
        'rating_low',
        'elites',
      ]).optional()
        .describe(
          'Review ordering (upstream default \'relevance\'). Closed enum: Yelp IGNORES an ' +
          'unrecognised value and serves default ranking under a billed 200.',
        ),
      rating: z.union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ]).optional()
        .describe(
          'Only reviews at this star rating, 1-5. Changes filtered_review_count on the response, ' +
          'not review_count.',
        ),
    }),
    call: (client, input) => client.yelp.reviews(input),
  }),
];

export const createScavioYelpSearchTool = toolFactory(yelpToolSpecs, 'scavioYelpSearch');
export const createScavioYelpBusinessTool = toolFactory(yelpToolSpecs, 'scavioYelpBusiness');
export const createScavioYelpReviewsTool = toolFactory(yelpToolSpecs, 'scavioYelpReviews');
