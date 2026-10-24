import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Kroger - 2 endpoints, all 2 credits. Kroger operates Kroger, Ralphs, Fred Meyer,
// Harris Teeter, King Soopers, Fry's and other banners.

export const krogerToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioKrogerSearch',
    id: 'scavio-kroger-search',
    platform: 'kroger',
    endpoint: '/api/v1/kroger/search',
    credits: 2,
    description:
      'Search Kroger-family grocery stores (Kroger, Ralphs, Fred Meyer, Harris Teeter, King ' +
      'Soopers, Fry\'s) for products. Returns structured product rows. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Product search query.'),
      page: z.number().int().optional()
        .describe('Results page, 1-based.'),
    }),
    call: (client, input) => client.kroger.search(input),
  }),
  defineScavioTool({
    key: 'scavioKrogerProduct',
    id: 'scavio-kroger-product',
    platform: 'kroger',
    endpoint: '/api/v1/kroger/product',
    credits: 2,
    description:
      'Full detail for a single Kroger-family product: price, description, nutrition, images. ' +
      'Pass product_url (preferred), or upc, or slug. Costs 2 credits.',
    inputSchema: z.object({
      product_url: z.string().optional()
        .describe('Full Kroger product page URL (preferred identifier).'),
      upc: z.string().optional()
        .describe('Product UPC code.'),
      slug: z.string().optional()
        .describe('Product URL slug.'),
    }),
    call: (client, input) => client.kroger.product(input),
  }),
];

export const createScavioKrogerSearchTool = toolFactory(krogerToolSpecs, 'scavioKrogerSearch');
export const createScavioKrogerProductTool = toolFactory(krogerToolSpecs, 'scavioKrogerProduct');
