import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getScavioClient } from './client.js';
import type { ScavioClient, ScavioClientOptions } from './client.js';

const outputSchema = z.record(z.string(), z.unknown());

export function createScavioRedditSearchTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-reddit-search',
    description:
      'Search Reddit posts via Scavio (1 credit). Returns matching posts under data.results, with data.next_cursor and data.has_more for paging. Results cannot be filtered or sorted.',
    inputSchema: z.object({
      query: z.string().describe('The Reddit search query'),
      cursor: z.string().optional().describe('Pagination cursor (next_cursor) from a prior response'),
    }),
    outputSchema,
    execute: async input => getClient().reddit.search(input),
  });
}

export function createScavioRedditPostTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-reddit-post',
    description:
      'Fetch a single Reddit post by URL or id via Scavio (1 credit). Returns a flat post object under data (title, text, score, num_comments, ...). It carries no comments - only the num_comments count.',
    inputSchema: z.object({
      post_id: z.string().optional().describe('Post fullname ("t3_...") or bare post id'),
      url: z.string().optional().describe('Full URL of the Reddit post'),
    }),
    outputSchema,
    execute: async input => getClient().reddit.post(input),
  });
}
