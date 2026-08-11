import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Airbnb - 3 endpoints. 1 credit flat on all three endpoints.

export const airbnbToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioAirbnbSearch',
    id: 'scavio-airbnb-search',
    platform: 'airbnb',
    endpoint: '/api/v1/airbnb/search',
    credits: 1,
    description:
      'Airbnb stays: stay-total and per-night price with the full discount ledger, rating and ' +
      'review count, bedrooms/beds/baths, coordinates, badges, images, dates_are_defaulted. 18 ' +
      'listings per page; page and cursor are mutually exclusive. Costs 1 credit.',
    inputSchema: z.object({
      location: z.string()
        .describe(
          'City, region, ZIP, or a pasted airbnb.com/s/ URL (1-200 characters). An unresolvable ' +
          'location is a 404.',
        ),
      check_in: z.string().optional()
        .describe(
          'Check-in date, YYYY-MM-DD. Must be sent with check_out; omitting both defaults to +30 ' +
          'days and flags dates_are_defaulted in the response.',
        ),
      check_out: z.string().optional()
        .describe(
          'Check-out date, YYYY-MM-DD. Must be later than check_in; defaults to check_in plus 5 ' +
          'nights when omitted.',
        ),
      adults: z.number().int().optional().describe('Adult guests, >= 1.'),
      children: z.number().int().optional().describe('Children aged 2-12, >= 0.'),
      infants: z.number().int().optional().describe('Infants under 2, >= 0.'),
      pets: z.number().int().optional().describe('Pets, >= 0.'),
      min_price: z.number().optional()
        .describe(
          'Minimum price for the WHOLE STAY in `currency`, not per night, >= 0. Must not exceed ' +
          'max_price.',
        ),
      max_price: z.number().optional()
        .describe(
          'Maximum price for the WHOLE STAY in `currency`, not per night, >= 0.',
        ),
      room_type: z.enum(['entire_home', 'private_room', 'shared_room', 'hotel_room']).optional()
        .describe(
          'Room type. Validated before the scrape, because an unrecognised value returns the ' +
          'UNFILTERED set under a 200.',
        ),
      min_bedrooms: z.number().int().optional().describe('Minimum bedrooms, >= 0.'),
      min_beds: z.number().int().optional().describe('Minimum beds, >= 0.'),
      min_bathrooms: z.number().int().optional().describe('Minimum bathrooms, >= 0.'),
      superhost: z.boolean().optional().describe('Superhost listings only.'),
      instant_book: z.boolean().optional().describe('Instant Book listings only.'),
      guest_favorite: z.boolean().optional().describe('Guest Favorite listings only.'),
      free_cancellation: z.boolean().optional().describe('Listings with free cancellation only.'),
      amenities: z.string().optional()
        .describe(
          'Comma-separated amenities (1-200 characters): wifi, air_conditioning, pool, kitchen, ' +
          'free_parking, washer, self_check_in, tv, or raw numeric Airbnb amenity ids. An ' +
          'unrecognised NAME is rejected before the scrape.',
        ),
      currency: z.string().optional()
        .describe(
          'ISO 4217 currency for prices, 3 letters (default \'USD\'). Without it Airbnb prices ' +
          'off the proxy exit and identical requests disagree.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. 18 listings per page. Cannot be combined with cursor.',
        ),
      cursor: z.string().optional()
        .describe(
          'next_cursor from a previous response (1-500 characters); wins over page, so sending ' +
          'both is rejected.',
        ),
    }),
    call: (client, input) => client.airbnb.search(input),
  }),
  defineScavioTool({
    key: 'scavioAirbnbListing',
    id: 'scavio-airbnb-listing',
    platform: 'airbnb',
    endpoint: '/api/v1/airbnb/listing',
    credits: 1,
    description:
      'One Airbnb listing in full: description, property/room type, capacity and room counts, ' +
      'the complete grouped amenity list (including what the place does NOT have), host profile ' +
      'and stats, house rules, cancellation policy, sleeping arrangements, photo tour and the ' +
      'RATING BREAKDOWN. Carries NO nightly price - prices are search-only. Costs 1 credit.',
    inputSchema: z.object({
      listing_id: z.string()
        .describe(
          'Airbnb listing id or a full /rooms/ URL (1-500 characters); query params are ' +
          'discarded, since they carry someone else\'s dates.',
        ),
      check_in: z.string().optional()
        .describe(
          'Check-in date, YYYY-MM-DD. Must be sent with check_out. Does not produce a price: the ' +
          'room page has no nightly rate.',
        ),
      check_out: z.string().optional()
        .describe(
          'Check-out date, YYYY-MM-DD. Must be later than check_in and sent together with it.',
        ),
      adults: z.number().int().optional().describe('Adult guests, >= 1.'),
      children: z.number().int().optional().describe('Children aged 2-12, >= 0.'),
      infants: z.number().int().optional().describe('Infants under 2, >= 0.'),
      pets: z.number().int().optional().describe('Pets, >= 0.'),
      currency: z.string().optional().describe('ISO 4217 currency, 3 letters (default \'USD\').'),
    }),
    call: (client, input) => client.airbnb.listing(input),
  }),
  defineScavioTool({
    key: 'scavioAirbnbReviews',
    id: 'scavio-airbnb-reviews',
    platform: 'airbnb',
    endpoint: '/api/v1/airbnb/reviews',
    credits: 1,
    description:
      'Airbnb review BODIES with per-review rating, date and reviewer name/photo/location, ' +
      'limit/offset paged at up to 50 per call. `count` is the listing\'s TOTAL review count, ' +
      '`returned` is how many this page holds. The rating breakdown lives on listing(), not ' +
      'here. Costs 1 credit.',
    inputSchema: z.object({
      listing_id: z.string()
        .describe(
          'Airbnb listing id or a full /rooms/ URL (1-500 characters).',
        ),
      currency: z.string().optional().describe('ISO 4217 currency, 3 letters (default \'USD\').'),
      limit: z.number().int().optional()
        .describe(
          'Reviews to return, 1-50 (default 30). Upstream returns a fixed 7 when no explicit ' +
          'limit is sent.',
        ),
      offset: z.number().int().optional()
        .describe(
          'Reviews to skip before this page, >= 0 (default 0).',
        ),
    }),
    call: (client, input) => client.airbnb.reviews(input),
  }),
];

export const createScavioAirbnbSearchTool = toolFactory(airbnbToolSpecs, 'scavioAirbnbSearch');
export const createScavioAirbnbListingTool = toolFactory(airbnbToolSpecs, 'scavioAirbnbListing');
export const createScavioAirbnbReviewsTool = toolFactory(airbnbToolSpecs, 'scavioAirbnbReviews');
