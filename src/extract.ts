import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Extract (any URL) - 1 endpoint. TIER-PRICED by mode: normal and advanced cost 1 credit, ultra
// costs 2. Billing happens only on a successful extraction - a dead link, bot wall or timeout
// costs nothing.

export const extractToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioExtract',
    id: 'scavio-extract',
    platform: 'extract',
    endpoint: '/api/v1/extract',
    credits: 1,
    description:
      'Read any URL and get the page back as raw HTML, readability Markdown or plain text: { ' +
      'url, format, mode, content, content_length }. Tier-priced by mode -- normal and advanced ' +
      'cost 1 credit, ultra costs 2 -- and only a successful extraction is billed, so a dead ' +
      'link, bot wall or timeout costs nothing.',
    inputSchema: z.object({
      url: z.string()
        .describe(
          'Page to read (1-2048 characters). http(s) only; a bare host is upgraded to https, and ' +
          'loopback, private, link-local and metadata hosts are rejected with a 400.',
        ),
      format: z.enum(['html', 'markdown', 'text']).optional()
        .describe(
          'Output format: \'html\' is the raw page, \'markdown\' a readability extraction, ' +
          '\'text\' that markdown flattened to plain text (server default \'markdown\').',
        ),
      mode: z.enum(['normal', 'advanced', 'ultra']).optional()
        .describe(
          'Fetch tier, and the price-bearing parameter: \'normal\' plain datacenter fetch (1 ' +
          'credit), \'advanced\' full browser render (1 credit), \'ultra\' the hardest-target ' +
          'tier (2 credits). Server default \'normal\'.',
        ),
    }),
    call: (client, input) => client.extract(input),
  }),
];

export const createScavioExtractTool = toolFactory(extractToolSpecs, 'scavioExtract');
