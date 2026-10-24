import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Kroger - 2 endpoints, 2 credits flat. Operates Kroger, Ralphs, Fred Meyer,
// Harris Teeter, King Soopers, Fry's and other banners.

export const krogerToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioKrogerSearch',
    id: 'scavio-kroger-search',
    platform: 'kroger',
    endpoint: '/api/v1/kroger/search',
    credits: 2,
    description:
      'Search Kroger grocery products: price in cents, promo price, n-for deals, unit price, ' +
      'size, UPC, stock, SNAP eligibility, dietary info, rating and category. Kroger operates ' +
      "Kroger, Ralphs, Fred Meyer, Harris Teeter, King Soopers, Fry's and other banners. " +
      'Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Search keywords (1-200 characters).'),
      page: z.number().int().optional().describe('Results page, 1-based (1-100).'),
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
      'Full Kroger product detail by URL or UPC: nutrition facts, allergens, ingredients, ' +
      'nutrients with daily values, description, images, rating distribution, store aisle, ' +
      'stock, dietary flags, SNAP eligibility, dimensions and country of origin. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      product_url: z.string().optional()
        .describe(
          'Full or relative product URL from kroger.com (e.g. ' +
          '"/p/kroger-2-reduced-fat-milk-gallon/0001111041700"). Preferred.',
        ),
      upc: z.string().optional()
        .describe('Kroger product UPC (from search or product URLs: /p/{slug}/{upc}).'),
      slug: z.string().optional()
        .describe('Product slug for readable URL. Optional with upc.'),
    }),
    call: (client, input) => client.kroger.product(input),
  }),
];

export const createScavioKrogerSearchTool = toolFactory(krogerToolSpecs, 'scavioKrogerSearch');
export const createScavioKrogerProductTool = toolFactory(krogerToolSpecs, 'scavioKrogerProduct');
