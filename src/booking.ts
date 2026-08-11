import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Booking.com - 3 endpoints. 1 credit flat on all three endpoints.

export const bookingToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioBookingSearch',
    id: 'scavio-booking-search',
    platform: 'booking',
    endpoint: '/api/v1/booking/search',
    credits: 1,
    description:
      'Booking.com properties for a destination and stay: live nightly price, review score, star ' +
      'rating, location, room type, deal badges. 25 properties per page. Provide destination or ' +
      'dest_id. Costs 1 credit.',
    inputSchema: z.object({
      destination: z.string().optional()
        .describe(
          'Destination to search, e.g. \'Paris\' (1-200 characters). Required unless dest_id is ' +
          'given.',
        ),
      dest_id: z.string().optional()
        .describe(
          'Numeric Booking.com destination id, as an alternative to destination.',
        ),
      dest_type: z.enum([
        'city',
        'region',
        'country',
        'district',
        'landmark',
        'airport',
        'hotel',
      ]).optional()
        .describe(
          'What dest_id refers to. Requires dest_id and is rejected without it, because Booking ' +
          'silently ignores a lone dest_type.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. 25 properties per page, 1 credit each.',
        ),
      sort_by: z.enum([
        'popularity',
        'price_low',
        'price_high',
        'stars_high',
        'stars_low',
        'stars_and_price',
        'distance',
        'review_score',
      ]).optional()
        .describe(
          'Result sort order (default \'popularity\').',
        ),
      min_price: z.number().optional()
        .describe(
          'Minimum price PER NIGHT in `currency`, >= 0. Must not exceed max_price.',
        ),
      max_price: z.number().optional().describe('Maximum price PER NIGHT in `currency`, >= 0.'),
      stars: z.array(z.number().int()).optional()
        .describe(
          'Star ratings to include, each 1-5, 1-5 values, OR\'d together (e.g. [4, 5]).',
        ),
      min_review_score: z.enum(['6', '7', '8', '9']).optional()
        .describe(
          'Minimum guest review score. Only \'6\', \'7\', \'8\' and \'9\' exist upstream; any ' +
          'other threshold is silently dropped.',
        ),
      property_type: z.union([
        z.enum(['apartments', 'hostels', 'hotels', 'motels', 'resorts', 'bed_and_breakfasts', 'villas', 'campgrounds', 'vacation_homes', 'lodges', 'homestays']),
        z.number().int(),
      ]).optional()
        .describe(
          'Accommodation type by name, or a raw numeric Booking accommodation-type id (>= 1).',
        ),
      free_cancellation: z.boolean().optional()
        .describe(
          'Only properties offering free cancellation.',
        ),
      no_prepayment: z.boolean().optional().describe('Only properties that take no prepayment.'),
      breakfast_included: z.boolean().optional().describe('Only rates that include breakfast.'),
      checkin: z.string().optional()
        .describe(
          'Check-in date, YYYY-MM-DD. Must be sent together with checkout: a lone checkin is ' +
          'ignored and Booking prices a default range of its own.',
        ),
      checkout: z.string().optional()
        .describe(
          'Check-out date, YYYY-MM-DD. Must be later than checkin and sent together with it.',
        ),
      adults: z.number().int().optional().describe('Adult guests, >= 1 (default 2).'),
      children_ages: z.array(z.number().int()).optional()
        .describe(
          'AGES of accompanying children, each 0-17, max 10 entries. Ages, not a count.',
        ),
      rooms: z.number().int().optional().describe('Rooms required, >= 1 (default 1).'),
      currency: z.string().optional()
        .describe(
          'ISO 4217 currency for prices, 3 letters (default \'USD\'). Without it Booking prices ' +
          'off the proxy exit and identical requests disagree.',
        ),
    }),
    call: (client, input) => client.booking.search(input),
  }),
  defineScavioTool({
    key: 'scavioBookingHotel',
    id: 'scavio-booking-hotel',
    platform: 'booking',
    endpoint: '/api/v1/booking/hotel',
    credits: 1,
    description:
      'One Booking.com property in full: rooms and rate plans, facilities, house rules, check-in ' +
      'windows, policies, images, location and review scores, priced for the stay asked for. ' +
      'Chaining the `url` a search row returns is cheaper than a bare slug. Costs 1 credit.',
    inputSchema: z.object({
      hotel: z.string()
        .describe(
          'Booking.com property URL or the bare page slug (1-500 characters); query params are ' +
          'discarded.',
        ),
      country_code: z.string().optional()
        .describe(
          'Two-letter country code for the property page (default \'us\'). Only consulted for a ' +
          'bare slug, where a wrong one is a real, BILLED 404.',
        ),
      checkin: z.string().optional()
        .describe(
          'Check-in date, YYYY-MM-DD. Must be sent together with checkout; omitting both prices ' +
          'a two-night range Booking chose, echoed back in the response.',
        ),
      checkout: z.string().optional()
        .describe(
          'Check-out date, YYYY-MM-DD. Must be later than checkin and sent together with it.',
        ),
      adults: z.number().int().optional().describe('Adult guests, >= 1 (default 2).'),
      children_ages: z.array(z.number().int()).optional()
        .describe(
          'AGES of accompanying children, each 0-17, max 10 entries. Ages, not a count.',
        ),
      rooms: z.number().int().optional().describe('Rooms required, >= 1 (default 1).'),
      currency: z.string().optional()
        .describe(
          'ISO 4217 currency for prices, 3 letters (default \'USD\'). Without it Booking prices ' +
          'off the proxy exit and identical requests disagree.',
        ),
    }),
    call: (client, input) => client.booking.hotel(input),
  }),
  defineScavioTool({
    key: 'scavioBookingReviews',
    id: 'scavio-booking-reviews',
    platform: 'booking',
    endpoint: '/api/v1/booking/reviews',
    credits: 1,
    description:
      'Booking.com guest reviews for a property with the score breakdown by category and ' +
      'Booking\'s own praise/complaint summary. No page param: total_count is the whole review ' +
      'history, count is what this response holds. Costs 1 credit.',
    inputSchema: z.object({
      hotel: z.string()
        .describe(
          'Booking.com property URL or the bare page slug (1-500 characters); query params are ' +
          'discarded.',
        ),
      country_code: z.string().optional()
        .describe(
          'Two-letter country code for the property page (default \'us\'). Only consulted for a ' +
          'bare slug, where a wrong one is a real, BILLED 404.',
        ),
      checkin: z.string().optional()
        .describe(
          'Check-in date, YYYY-MM-DD. Must be sent together with checkout; it prices the stay ' +
          'the review page is rendered for.',
        ),
      checkout: z.string().optional()
        .describe(
          'Check-out date, YYYY-MM-DD. Must be later than checkin and sent together with it.',
        ),
      adults: z.number().int().optional().describe('Adult guests, >= 1 (default 2).'),
      children_ages: z.array(z.number().int()).optional()
        .describe(
          'AGES of accompanying children, each 0-17, max 10 entries. Ages, not a count.',
        ),
      rooms: z.number().int().optional().describe('Rooms required, >= 1 (default 1).'),
      currency: z.string().optional()
        .describe(
          'ISO 4217 currency for prices, 3 letters (default \'USD\').',
        ),
    }),
    call: (client, input) => client.booking.reviews(input),
  }),
];

export const createScavioBookingSearchTool = toolFactory(bookingToolSpecs, 'scavioBookingSearch');
export const createScavioBookingHotelTool = toolFactory(bookingToolSpecs, 'scavioBookingHotel');
export const createScavioBookingReviewsTool = toolFactory(bookingToolSpecs, 'scavioBookingReviews');
