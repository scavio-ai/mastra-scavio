import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getScavioClient } from './client.js';
import type { ScavioClient, ScavioClientOptions } from './client.js';

const outputSchema = z.record(z.string(), z.unknown());

// Amazon moved upstream in 2026-07: sort_by, pages, category_id, merchant_id,
// language, currency, device, zip_code and autoselect_variant no longer exist.
// sort_by especially was verified inert - every sort value returns the same
// unordered set - so it is removed rather than kept as a no-op the model plans
// against. `domain` still works on the wire as a deprecated alias but is not
// offered here: one spelling per param.
const COUNTRY_DESCRIPTION =
  'Marketplace country code (ISO 3166-1 alpha-2), not a domain: us (default), gb (the UK is gb, not uk), ca, de, fr, es, it, jp, in, au, br, mx, nl, pl, se, sg, ae, sa, eg, cn, be, tr. An unknown code falls back to us.';

export function createScavioAmazonSearchTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-amazon-search',
    description:
      'Search Amazon for products via Scavio. Returns matching products as structured JSON. Results are unsorted and cannot be filtered by category, merchant or price.',
    inputSchema: z.object({
      query: z.string().describe('The product search query'),
      country: z.string().optional().describe(COUNTRY_DESCRIPTION),
      page: z.number().optional().describe('Result page, 1-based. One page per call, 1 credit each.'),
    }),
    outputSchema,
    execute: async input => getClient().amazon.search(input as never),
  });
}

export function createScavioAmazonProductTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-amazon-product',
    description:
      'Fetch full Amazon product details by ASIN via Scavio. price is the buy-box price only.',
    inputSchema: z.object({
      asin: z.string().describe('Amazon Standard Identification Number (ASIN)'),
      country: z.string().optional().describe(COUNTRY_DESCRIPTION),
    }),
    outputSchema,
    execute: async input => getClient().amazon.product(input),
  });
}

export function createScavioAmazonOffersTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-amazon-offers',
    description:
      'List every seller offer for one Amazon ASIN via Scavio: price, seller, condition, shipping, and which offer holds the buy box. Page 1 only. Use this instead of the product tool when comparing sellers or checking who owns the buy box.',
    inputSchema: z.object({
      asin: z.string().describe('Amazon Standard Identification Number (ASIN)'),
      country: z.string().optional().describe(COUNTRY_DESCRIPTION),
    }),
    outputSchema,
    execute: async input => getClient().amazon.offers(input),
  });
}
