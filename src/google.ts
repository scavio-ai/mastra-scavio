import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getScavioClient } from './client.js';
import type { ScavioClient, ScavioClientOptions } from './client.js';

const outputSchema = z.record(z.string(), z.unknown());

export function createScavioGoogleSearchTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-google-search',
    description:
      'Search Google in real time via Scavio (1 credit). Returns organic results, knowledge graph, related questions, AI overview, and more as structured JSON.',
    inputSchema: z.object({
      query: z.string().describe('The search query'),
      country_code: z.string().optional().describe('Two-letter country code, e.g. "us"'),
      language: z.string().optional().describe('Two-letter language code, e.g. "en"'),
      page: z.number().optional().describe('Result page number (1-based)'),
      device: z.enum(['desktop', 'mobile']).optional().describe('Device to emulate'),
      nfpr: z.boolean().optional().describe('Disable spelling correction / auto-fixes'),
    }),
    outputSchema,
    execute: async ({ query, country_code, language, page, device, nfpr }) =>
      getClient().google.search({
        query,
        ...(country_code !== undefined ? { gl: country_code } : {}),
        ...(language !== undefined ? { hl: language } : {}),
        ...(page !== undefined && page > 1 ? { start: (page - 1) * 10 } : {}),
        ...(device !== undefined ? { device } : {}),
        ...(nfpr !== undefined ? { nfpr } : {}),
      }),
  });
}
