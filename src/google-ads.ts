import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Google Ads Transparency - 3 endpoints. 1 credit flat on all three endpoints.
//
// LOOKUP FIRST: scavio-google-ads-advertisers is the entry point. Every other Google Ads
// Transparency endpoint is keyed by an id that only exists inside Google Ads Transparency's own
// URLs, so a caller holding a name resolves it here before anything else will answer.

export const googleAdsToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioGoogleAdsAdvertisers',
    id: 'scavio-google-ads-advertisers',
    platform: 'google-ads',
    endpoint: '/api/v1/googleads/advertisers',
    credits: 1,
    description:
      'Resolve a brand name or domain to the advertiser_id that search() and creative() are ' +
      'keyed by. Returns two row kinds in one list: \'advertiser\' rows carrying the id, ' +
      'verified name, verification country and total ad count as a range, and \'domain\' rows ' +
      'carrying a website. A name query returns both kinds; a domain-shaped query returns ' +
      'domains only. Autocomplete-backed, roughly 20 rows per arm, and it does not paginate. ' +
      'Costs 1 credit.',
    inputSchema: z.object({
      query: z.string().describe('Brand name or domain to resolve (1-200 characters).'),
      region: z.string().optional()
        .describe(
          'ISO 3166-1 alpha-2 country (\'US\', \'GB\', \'DE\') or a Google geo criteria id as a ' +
          'string (2-12 characters). Default: no region filter.',
        ),
      limit: z.number().int().optional()
        .describe(
          'Rows per arm (1-20; server default 10). Advertisers and domains are capped ' +
          'separately, so a name query can return up to twice this many rows.',
        ),
    }),
    call: (client, input) => client.googleAds.advertisers(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleAdsSearch',
    id: 'scavio-google-ads-search',
    platform: 'google-ads',
    endpoint: '/api/v1/googleads/search',
    credits: 1,
    description:
      'Every ad Google Ads Transparency holds for one advertiser: the creative (archived image, ' +
      'rich-media bundle, Google\'s renderer link, dimensions), advertiser id and name, format, ' +
      'first and last seen dates and days actually run, plus total_ads_min and total_ads_max -- ' +
      'Google publishes the advertiser\'s ad total as a range, never an exact figure. Up to 100 ' +
      'ads per page (server default 40); paginate by sending next_cursor back as cursor ' +
      'alongside the SAME filters. Provide domain or advertiser_id. Costs 1 credit.',
    inputSchema: z.object({
      domain: z.string().optional()
        .describe(
          'Advertiser website (1-253 characters): bare host, www host or full URL, reduced to ' +
          'the registrable host. The only way to get `domain` back on each row.',
        ),
      advertiser_id: z.string().optional()
        .describe(
          'Google advertiser id, e.g. \'AR16735076323512287233\' (3-40 characters). The shape is ' +
          'checked before any request, so a typo costs no credits. Querying by id drops `domain` ' +
          'from every row.',
        ),
      region: z.string().optional()
        .describe(
          'ISO 3166-1 alpha-2 country (\'US\', \'GB\', \'DE\') or a Google geo criteria id as a ' +
          'string (2-12 characters). Scopes the deep links on every row, and the same advertiser ' +
          'can share zero creatives between two countries. Default: worldwide.',
        ),
      format: z.enum(['text', 'image', 'video']).optional()
        .describe(
          'Creative format. The three sets are disjoint -- an advertiser\'s text, image and ' +
          'video ads share no creatives. Default: all formats.',
        ),
      platform: z.enum(['play', 'maps', 'search', 'shopping', 'youtube']).optional()
        .describe(
          'Google surface the ad ran on. Default: all surfaces.',
        ),
      topic: z.enum(['all', 'political']).optional().describe('Ad topic (server default \'all\').'),
      limit: z.number().int().optional()
        .describe(
          'Ads per page (1-100; server default 40). 100 is a hard upstream ceiling, not our ' +
          'policy: Google answers a larger request with zero rows rather than an error.',
        ),
      cursor: z.string().optional()
        .describe(
          'next_cursor from the previous response (1-4000 characters), 100 ads per page. Re-send ' +
          'the same filters alongside it; next_cursor is null once exhausted.',
        ),
    }),
    call: (client, input) => client.googleAds.search(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleAdsCreative',
    id: 'scavio-google-ads-creative',
    platform: 'google-ads',
    endpoint: '/api/v1/googleads/creative',
    credits: 1,
    description:
      'One creative in full, and the only endpoint carrying its history: every size variation of ' +
      'the asset, the impression bucket, the per-region breakdown with first and last shown ' +
      'dates and a per-surface impression split inside each region, the format, Google\'s ' +
      'category label and the funder disclosure on political ads. Impressions and first_shown ' +
      'are EEA-only (DSA-compelled) and come back null for US creatives, and an impression ' +
      'bucket may carry only a lower or only an upper bound. Costs 1 credit.',
    inputSchema: z.object({
      advertiser_id: z.string()
        .describe(
          'Google advertiser id, e.g. \'AR16735076323512287233\' (3-40 characters).',
        ),
      creative_id: z.string()
        .describe(
          'Creative id (3-40 characters). It must belong to the advertiser_id sent with it -- ' +
          'the lookup is keyed by the pair and a mismatched pair is a 404.',
        ),
    }),
    call: (client, input) => client.googleAds.creative(input),
  }),
];

export const createScavioGoogleAdsAdvertisersTool = toolFactory(
  googleAdsToolSpecs,
  'scavioGoogleAdsAdvertisers',
);
export const createScavioGoogleAdsSearchTool = toolFactory(
  googleAdsToolSpecs,
  'scavioGoogleAdsSearch',
);
export const createScavioGoogleAdsCreativeTool = toolFactory(
  googleAdsToolSpecs,
  'scavioGoogleAdsCreative',
);
