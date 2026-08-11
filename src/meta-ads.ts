import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Meta Ad Library - 3 endpoints. 1 credit flat on all three endpoints, and every cursor page is
// another credit. Page 1 is 30 ads, each page after it is 10, so walking a whole query costs
// roughly one credit per ten ads past the first thirty.

export const metaAdsToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioMetaAdsSearch',
    id: 'scavio-meta-ads-search',
    platform: 'meta-ads',
    endpoint: '/api/v1/meta-ads/search',
    credits: 1,
    description:
      'Search the Meta Ad Library by keyword: 30 ads on page 1 with the full creative -- page ' +
      'name, ad copy, headline, CTA, images and videos, the platforms each ran on and its run ' +
      'dates -- then 10 ads per cursor page, walking has_next_page to the end of the query. ' +
      'total_results caps at 50000 with total_is_capped true, because Meta only reports ' +
      '\'>50,000\'; never present it as an exact count. Every page costs 1 credit.',
    inputSchema: z.object({
      query: z.string().describe('Keyword to search the ad library for (1-200 characters).'),
      country: z.string().optional()
        .describe(
          'Ad library country as an exactly 2-character ISO 3166-1 alpha-2 code (server default ' +
          '\'US\').',
        ),
      active_status: z.enum(['all', 'active', 'inactive']).optional()
        .describe(
          'Whether the ad is still running (server default \'all\').',
        ),
      ad_type: z.enum(['all', 'political_and_issue_ads']).optional()
        .describe(
          'Set \'political_and_issue_ads\' to expose spend, reach, impressions and the ' +
          'paid-for-by disclosure; commercial ads leave all four null (server default \'all\').',
        ),
      media_type: z.enum(['all', 'image', 'video', 'meme', 'image_and_meme', 'none']).optional()
        .describe(
          'Creative media filter. Default: no media filter.',
        ),
      search_type: z.enum(['keyword_unordered', 'keyword_exact_phrase']).optional()
        .describe(
          'How the query is matched (server default \'keyword_unordered\').',
        ),
      cursor: z.string().optional()
        .describe(
          'next_cursor from the previous response: page 1 is 30 ads, every cursor page is 10. ' +
          'The cursor is a self-contained blob, so ALL other filters are ignored when it is ' +
          'present.',
        ),
    }),
    call: (client, input) => client.metaAds.search(input),
  }),
  defineScavioTool({
    key: 'scavioMetaAdsAdvertiser',
    id: 'scavio-meta-ads-advertiser',
    platform: 'meta-ads',
    endpoint: '/api/v1/meta-ads/advertiser',
    credits: 1,
    description:
      'Every ad a Facebook Page is running, by numeric page id: 30 ads on page 1 with the same ' +
      'creative detail as search(), then 10 ads per cursor page, walking has_next_page to the ' +
      'end of the advertiser. Every page costs 1 credit.',
    inputSchema: z.object({
      page_id: z.string()
        .describe(
          'The advertiser\'s numeric Facebook Page id (3-25 digits, as a string).',
        ),
      country: z.string().optional()
        .describe(
          'Ad library country as an exactly 2-character ISO 3166-1 alpha-2 code (server default ' +
          '\'US\').',
        ),
      active_status: z.enum(['all', 'active', 'inactive']).optional()
        .describe(
          'Whether the ad is still running (server default \'all\').',
        ),
      ad_type: z.enum(['all', 'political_and_issue_ads']).optional()
        .describe(
          'Set \'political_and_issue_ads\' to expose spend, reach, impressions and the ' +
          'paid-for-by disclosure; commercial ads leave all four null (server default \'all\').',
        ),
      media_type: z.enum(['all', 'image', 'video', 'meme', 'image_and_meme', 'none']).optional()
        .describe(
          'Creative media filter. Default: no media filter.',
        ),
      cursor: z.string().optional()
        .describe(
          'next_cursor from the previous response: page 1 is 30 ads, every cursor page is 10. ' +
          'ALL other filters are ignored when it is present.',
        ),
    }),
    call: (client, input) => client.metaAds.advertiser(input),
  }),
  defineScavioTool({
    key: 'scavioMetaAdsAd',
    id: 'scavio-meta-ads-ad',
    platform: 'meta-ads',
    endpoint: '/api/v1/meta-ads/ad',
    credits: 1,
    description:
      'One Meta ad in full by archive id: creative, advertiser, run dates, the platforms it ran ' +
      'on, and the political disclosure when the ad carries one. Commercial ads leave spend, ' +
      'reach and impressions null. Costs 1 credit.',
    inputSchema: z.object({
      ad_archive_id: z.string().describe('Meta ad archive id (3-25 digits, as a string).'),
    }),
    call: (client, input) => client.metaAds.ad(input),
  }),
];

export const createScavioMetaAdsSearchTool = toolFactory(metaAdsToolSpecs, 'scavioMetaAdsSearch');
export const createScavioMetaAdsAdvertiserTool = toolFactory(
  metaAdsToolSpecs,
  'scavioMetaAdsAdvertiser',
);
export const createScavioMetaAdsAdTool = toolFactory(metaAdsToolSpecs, 'scavioMetaAdsAd');
