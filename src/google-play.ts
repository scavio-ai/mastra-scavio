import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Google Play - 3 endpoints. 2 credits flat on all three endpoints. This is NOT the 1-credit
// Google SERP price: Google Play is a separate namespace partly because it is a separate, dearer
// scrape.

export const googlePlayToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioGooglePlaySearch',
    id: 'scavio-google-play-search',
    platform: 'google-play',
    endpoint: '/api/v1/googleplay/search',
    credits: 2,
    description:
      'Ranked Google Play apps: package name, title, developer, rating, install count, price and ' +
      'IAP range, content rating, icon and screenshots. A branded query returns the hero card as ' +
      'result 1 in the same row shape, plus Play\'s related-query rail. NO PAGINATION - one ' +
      'shelf of about 30 apps. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string()
        .describe(
          'What to search the store for (1-200 characters): an app name, a publisher, or a ' +
          'category phrase. Apps only - games are folded into the apps vertical, but books and ' +
          'films use a different card shape and are not covered.',
        ),
      hl: z.string().optional()
        .describe(
          'UI language, 2-20 characters (default \'en\'). Changes the STOREFRONT, not only the ' +
          'strings: at hl=pt-BR the title, description, install formatting and content rating ' +
          'all move with it. Play silently falls back to English on a value it does not serve.',
        ),
      gl: z.string().optional()
        .describe(
          'Country code, 2-10 characters (default \'us\'), deciding which storefront\'s price ' +
          'and availability are returned. Play silently falls back to the US storefront on a ' +
          'country it does not serve.',
        ),
    }),
    call: (client, input) => client.googlePlay.search(input),
  }),
  defineScavioTool({
    key: 'scavioGooglePlayApp',
    id: 'scavio-google-play-app',
    platform: 'google-play',
    endpoint: '/api/v1/googleplay/app',
    credits: 2,
    description:
      'Full Google Play store listing: installs including the REAL count Play publishes but ' +
      'never renders, rating and star histogram, description, developer identity and legal ' +
      'contact, price and IAPs, categories and gameplay tags, screenshots and trailer, version ' +
      'and Android requirement, release and update dates, changelog, the full permission tree, ' +
      'the Data safety table, the 20 server-rendered reviews and the similar-apps and ' +
      'more-by-developer rails. Costs 2 credits.',
    inputSchema: z.object({
      app_id: z.string()
        .describe(
          'Android package name (\'com.spotify.music\') or any play.google.com URL carrying one ' +
          'in its id param (1-500 characters).',
        ),
      hl: z.string().optional()
        .describe(
          'UI language, 2-20 characters (default \'en\'). Changes the STOREFRONT, not only the ' +
          'strings: title, description, install formatting and content rating all move with it. ' +
          'Play silently falls back to English on a value it does not serve.',
        ),
      gl: z.string().optional()
        .describe(
          'Country code, 2-10 characters (default \'us\'), deciding which storefront\'s price ' +
          'and availability are returned. Play silently falls back to the US storefront on a ' +
          'country it does not serve.',
        ),
    }),
    call: (client, input) => client.googlePlay.app(input),
  }),
  defineScavioTool({
    key: 'scavioGooglePlayReviews',
    id: 'scavio-google-play-reviews',
    platform: 'google-play',
    endpoint: '/api/v1/googleplay/reviews',
    credits: 2,
    description:
      'A page of Google Play reviews: star score, full text, author, thumbs-up count, developer ' +
      'reply and the APP VERSION the reviewer was running. Paged by cursor, up to 200 per call. ' +
      'app() already returns the 20 reviews Play server-renders; use this to page past them or ' +
      'sort differently. Costs 2 credits.',
    inputSchema: z.object({
      app_id: z.string()
        .describe(
          'Android package name (\'com.spotify.music\') or any play.google.com URL carrying one ' +
          'in its id param (1-500 characters).',
        ),
      sort: z.enum(['relevance', 'newest', 'rating']).optional()
        .describe(
          'Review ordering (default \'newest\'). Closed enum. The cursor encodes the sort, so ' +
          'keep this identical when paging.',
        ),
      count: z.number().int().optional()
        .describe(
          'Reviews to return, 1-200 (default 50); 200 is our cap, not Play\'s. Play honours ' +
          'more, but a single page that large is megabytes for one credit - page with cursor ' +
          'instead.',
        ),
      cursor: z.string().optional()
        .describe(
          'Continuation token from a prior response\'s next_cursor (1-4000 characters). Opaque ' +
          'and SINGLE-USE, and it encodes the sort as well as the position - send it back with ' +
          'the SAME sort it came from. A cursor past the last review is a 404, not an empty ' +
          'page.',
        ),
      hl: z.string().optional()
        .describe(
          'UI language, 2-20 characters (default \'en\'). Changes the STOREFRONT, not only the ' +
          'strings. Play silently falls back to English on a value it does not serve.',
        ),
      gl: z.string().optional()
        .describe(
          'Country code, 2-10 characters (default \'us\'), deciding which storefront\'s price ' +
          'and availability are returned. Play silently falls back to the US storefront on a ' +
          'country it does not serve.',
        ),
    }),
    call: (client, input) => client.googlePlay.reviews(input),
  }),
];

export const createScavioGooglePlaySearchTool = toolFactory(
  googlePlayToolSpecs,
  'scavioGooglePlaySearch',
);
export const createScavioGooglePlayAppTool = toolFactory(
  googlePlayToolSpecs,
  'scavioGooglePlayApp',
);
export const createScavioGooglePlayReviewsTool = toolFactory(
  googlePlayToolSpecs,
  'scavioGooglePlayReviews',
);
