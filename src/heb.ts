import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// HEB - 3 endpoints, 2 credits flat. Texas-based grocery chain.

export const hebToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioHebSearch',
    id: 'scavio-heb-search',
    platform: 'heb',
    endpoint: '/api/v1/heb/search',
    credits: 2,
    description:
      'Search HEB grocery products: price in cents, sale status, unit price, size, UPC, stock, ' +
      'EBT/SNAP eligibility, aisle location and product URL. Pass store_id for one store\'s ' +
      'prices, stock and assortment. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Search keywords (1-200 characters).'),
      page: z.number().int().optional().describe('Results page, 1-based (1-100).'),
      page_size: z.number().int().optional()
        .describe('Results per page, 1-60. Defaults to 60.'),
      store_id: z.string().optional()
        .describe(
          "HEB store number from the HEB stores tool (store_number), e.g. '441'. Prices, stock, aisle location and assortment come from that store; the store used is echoed in data.store {store_id, name}. US only. Omit for HEB's default store.",
        ),
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
      'Full HEB product detail: nutrition facts, ingredients, description, images, similar ' +
      'products, coupons, EBT/SNAP eligibility and breadcrumbs. Pass product_url (from search) ' +
      'or slug + product_id; with store_id, product_id alone works and price, stock and aisle ' +
      'are for that store. Costs 2 credits.',
    inputSchema: z.object({
      product_url: z.string().optional()
        .describe(
          'Full or relative product URL from heb.com (e.g. ' +
          '"/product-detail/central-market-organics-whole-milk-1-gal/931316"). ' +
          'Preferred over slug + product_id.',
        ),
      product_id: z.string().optional()
        .describe('HEB product id. Needs slug, unless store_id is set (then product_id alone works).'),
      slug: z.string().optional()
        .describe('Product slug (readable part of the URL). Required with product_id unless store_id is set.'),
      store_id: z.string().optional()
        .describe(
          "HEB store number from the HEB stores tool (store_number), e.g. '441'. Prices, stock, aisle location and assortment come from that store; the store used is echoed in data.store {store_id, name}. US only. Omit for HEB's default store.",
        ),
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
      'HEB stores near a US ZIP code or city: store number, address, phone, hours, pharmacy ' +
      'availability, fulfillment channels, distance and store URL. Pass zip or city. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      zip: z.string().optional().describe('5-digit US ZIP code (e.g. "78701").'),
      city: z.string().optional().describe('City name (e.g. "Austin"). Pass zip or city.'),
    }),
    call: (client, input) => client.heb.stores(input),
  }),
];

export const createScavioHebSearchTool = toolFactory(hebToolSpecs, 'scavioHebSearch');
export const createScavioHebProductTool = toolFactory(hebToolSpecs, 'scavioHebProduct');
export const createScavioHebStoresTool = toolFactory(hebToolSpecs, 'scavioHebStores');
