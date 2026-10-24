import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// HEB - 3 endpoints, all 2 credits.

export const hebToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioHebSearch',
    id: 'scavio-heb-search',
    platform: 'heb',
    endpoint: '/api/v1/heb/search',
    credits: 2,
    description:
      'Search HEB grocery store for products. Returns structured product rows. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Product search query.'),
      page: z.number().int().optional()
        .describe('Results page, 1-based.'),
      page_size: z.number().int().max(60).optional()
        .describe('Number of results per page (1-60, default 30).'),
    }),
    call: (client, input) => client.heb.search(input),
  }),
  defineScavioTool({
    key: 'scavioHebProduct',
    id: 'scavio-heb-product',
    platform: 'heb',
    endpoint: '/api/v1/heb/product',
    credits: 2,
    description:
      'Full detail for a single HEB product: price, description, nutrition, images. Pass ' +
      'product_url (preferred) or product_id + slug. Costs 2 credits.',
    inputSchema: z.object({
      product_url: z.string().optional()
        .describe('Full HEB product page URL (preferred identifier).'),
      product_id: z.string().optional()
        .describe('HEB product id. Requires slug when used.'),
      slug: z.string().optional()
        .describe('Product URL slug, required when using product_id.'),
    }),
    call: (client, input) => client.heb.product(input),
  }),
  defineScavioTool({
    key: 'scavioHebStores',
    id: 'scavio-heb-stores',
    platform: 'heb',
    endpoint: '/api/v1/heb/stores',
    credits: 2,
    description:
      'Find HEB store locations by ZIP code or city name. Costs 2 credits.',
    inputSchema: z.object({
      zip: z.string().optional()
        .describe('5-digit US ZIP code to search near.'),
      city: z.string().optional()
        .describe('City name to search stores in.'),
    }),
    call: (client, input) => client.heb.stores(input),
  }),
];

export const createScavioHebSearchTool = toolFactory(hebToolSpecs, 'scavioHebSearch');
export const createScavioHebProductTool = toolFactory(hebToolSpecs, 'scavioHebProduct');
export const createScavioHebStoresTool = toolFactory(hebToolSpecs, 'scavioHebStores');
