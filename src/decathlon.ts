import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Decathlon - 2 endpoints, 2 credits flat. Sports retail across 7 country
// domains (FR, ES, IT, IN, UK, PT, NET).

const countryEnum = z.enum(["fr", "es", "it", "in", "uk", "pt", "net"]);

export const decathlonToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioDecathlonSearch',
    id: 'scavio-decathlon-search',
    platform: 'decathlon',
    endpoint: '/api/v1/decathlon/search',
    credits: 2,
    description:
      'Search Decathlon products by keyword across 7 country domains (FR, ES, IT, IN, UK, PT, ' +
      'NET). Returns product name, brand, price (cents), currency, availability, rating, review ' +
      'count and image. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().describe('Search keywords (1-200 characters).'),
      country: countryEnum.describe('Country domain.'),
      page: z.number().int().optional().describe('Results page, 1-based (1-50).'),
    }),
    call: (client, input) => client.decathlon.search(input),
  }),
  defineScavioTool({
    key: 'scavioDecathlonProduct',
    id: 'scavio-decathlon-product',
    platform: 'decathlon',
    endpoint: '/api/v1/decathlon/product',
    credits: 2,
    description:
      'Full Decathlon product detail by URL or product ID: description, images, SKU, GTIN, ' +
      'color, price (cents), list price, availability, offers/variants, rating, review count, ' +
      'category and breadcrumbs. Supports all 7 country domains. Costs 2 credits.',
    inputSchema: z.object({
      product_url: z.string().optional()
        .describe('Full or relative product URL from any Decathlon domain. Preferred.'),
      product_id: z.string().optional()
        .describe('Decathlon numeric product ID.'),
      country: countryEnum.describe('Country domain.'),
    }),
    call: (client, input) => client.decathlon.product(input),
  }),
];

export const createScavioDecathlonSearchTool = toolFactory(decathlonToolSpecs, 'scavioDecathlonSearch');
export const createScavioDecathlonProductTool = toolFactory(decathlonToolSpecs, 'scavioDecathlonProduct');
