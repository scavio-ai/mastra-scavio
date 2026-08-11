import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Apple App Store - 3 endpoints. 1 credit flat on all three endpoints - this is Apple's official
// iTunes JSON API.

export const appStoreToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioAppStoreSearch',
    id: 'scavio-app-store-search',
    platform: 'app-store',
    endpoint: '/api/v1/appstore/search',
    credits: 1,
    description:
      'Search the App Store and get up to 200 fully-shaped app rows - the same 43-field row as ' +
      'app() - so a search doubles as a bulk metadata fetch and as a publisher lookup. NO ' +
      'PAGINATION: raise limit, there is no second page. Costs 1 credit.',
    inputSchema: z.object({
      term: z.string()
        .describe(
          'What to search for (1-500 characters). Apple matches an app name, a keyword OR a ' +
          'publisher name, so searching a developer returns their catalogue.',
        ),
      limit: z.number().int().optional()
        .describe(
          'Apps to return, 1-200 (default 25). The ONLY lever on result volume: the search API ' +
          'has no pagination and every offset spelling is silently ignored.',
        ),
      country: z.string().optional()
        .describe(
          'Two-letter ISO storefront code (default \'us\'); decides price, currency, localised ' +
          'title and whether the app is sold there at all. Anything that is not exactly two ' +
          'letters is rejected with a free 400.',
        ),
      entity: z.enum(['software', 'ipad_software', 'mac_software']).optional()
        .describe(
          'Which catalogue to search: iPhone/iPad apps (\'software\', the default), iPad apps, ' +
          'or Mac App Store apps. These are separate stores, not a filter - Mac rows carry no ' +
          'iPad/Apple TV screenshots, advisories, features, supported devices or Game Center ' +
          'flag, returning them empty rather than absent.',
        ),
      lang: z.string().optional()
        .describe(
          'Listing text language as a five-letter code (\'en_us\', \'ja_jp\'); any other shape ' +
          'is rejected. Independent of country: the storefront sets the price, this sets the ' +
          'words.',
        ),
    }),
    call: (client, input) => client.appStore.search(input),
  }),
  defineScavioTool({
    key: 'scavioAppStoreApp',
    id: 'scavio-app-store-app',
    platform: 'app-store',
    endpoint: '/api/v1/appstore/app',
    credits: 1,
    description:
      'Full App Store listing: title, description, developer and seller identity, price and ' +
      'currency, all-time and current-version ratings, version and release notes, genres, ' +
      'content rating and advisories, icons at three sizes, screenshots, download size, minimum ' +
      'OS, languages, supported devices and the Game Center and VPP flags. Costs 1 credit.',
    inputSchema: z.object({
      app_id: z.string()
        .describe(
          'App Store id - the digits after \'id\' in an apps.apple.com URL - or the app\'s ' +
          'bundle id (\'notion.id\', \'com.burbn.instagram\'); both resolve to the identical ' +
          'payload. 1-255 characters matching ^[A-Za-z0-9][A-Za-z0-9._-]*$, so a pasted ' +
          'apps.apple.com URL is rejected with a free 400. An id Apple cannot resolve is a ' +
          'billed 404.',
        ),
      country: z.string().optional()
        .describe(
          'Two-letter ISO storefront code (default \'us\'); decides price, currency, localised ' +
          'title and whether the app is sold there at all. Anything that is not exactly two ' +
          'letters is rejected with a free 400.',
        ),
    }),
    call: (client, input) => client.appStore.app(input),
  }),
  defineScavioTool({
    key: 'scavioAppStoreReviews',
    id: 'scavio-app-store-reviews',
    platform: 'app-store',
    endpoint: '/api/v1/appstore/reviews',
    credits: 1,
    description:
      'A page of App Store reviews: star rating, title, full text, author and the APP VERSION ' +
      'the review was written against. 50 per page, hard-stopped at page 10 - 500 reviews per ' +
      'storefront is Apple\'s anonymous ceiling. This endpoint cannot 404: an unknown id and a ' +
      'real app with no reviews return the same empty feed. Costs 1 credit.',
    inputSchema: z.object({
      app_id: z.string()
        .describe(
          'App Store id, NUMERIC ONLY - unlike app(), the reviews feed has no bundle-id form.',
        ),
      country: z.string().optional()
        .describe(
          'Two-letter ISO storefront code (default \'us\'). Anything that is not exactly two ' +
          'letters is rejected with a free 400. Ask a different country to reach past the ' +
          '500-review ceiling.',
        ),
      page: z.number().int().optional()
        .describe(
          'Reviews page, 1-10, 50 reviews each (default 1). Apple hard-stops at page 10.',
        ),
      sort: z.enum(['most_recent', 'most_helpful']).optional()
        .describe(
          'Review ordering (default \'most_recent\'). The choice decides whether the vote fields ' +
          'mean anything: under most_recent almost every review is too new to have been voted on ' +
          'and returns zeroes, while most_helpful returns them densely populated.',
        ),
    }),
    call: (client, input) => client.appStore.reviews(input),
  }),
];

export const createScavioAppStoreSearchTool = toolFactory(
  appStoreToolSpecs,
  'scavioAppStoreSearch',
);
export const createScavioAppStoreAppTool = toolFactory(appStoreToolSpecs, 'scavioAppStoreApp');
export const createScavioAppStoreReviewsTool = toolFactory(
  appStoreToolSpecs,
  'scavioAppStoreReviews',
);
