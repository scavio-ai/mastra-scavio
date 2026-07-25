import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getScavioClient } from './client.js';
import type { ScavioClient, ScavioClientOptions } from './client.js';

const outputSchema = z.record(z.string(), z.unknown());

export function createScavioYoutubeSearchTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-search',
    description: 'Search YouTube for videos, channels, or playlists via Scavio.',
    inputSchema: z.object({
      query: z.string().describe('The video search query'),
      upload_date: z.string().optional().describe('Upload date filter, e.g. "today", "this_week", "this_month"'),
      type: z.string().optional().describe('Result type, e.g. "video", "channel", "playlist", "movie"'),
      duration: z.string().optional().describe('Duration filter: "short", "medium", or "long"'),
      sort_by: z.string().optional().describe('Sort order: "relevance", "date", "view_count", or "rating"'),
      features: z
        .array(z.string())
        .optional()
        .describe('Feature filters, e.g. ["hd", "4k", "subtitles", "creative_commons", "live"]'),
      cursor: z.string().optional().describe('Pagination cursor from a prior response'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.search(input as never),
  });
}

export function createScavioYoutubeVideoTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-video',
    description: 'Fetch full metadata for a YouTube video by id or watch URL via Scavio.',
    inputSchema: z.object({
      video_id: z.string().describe('YouTube video id or full watch URL'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.video(input),
  });
}

export function createScavioYoutubeMetadataTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-metadata',
    description: 'Deprecated alias of scavio-youtube-video: fetch metadata for a YouTube video by id via Scavio.',
    inputSchema: z.object({
      video_id: z.string().describe('YouTube video id'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.metadata(input),
  });
}

export function createScavioYoutubeCommentsTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-comments',
    description: 'List the top-level comments on a YouTube video via Scavio.',
    inputSchema: z.object({
      video_id: z.string().describe('YouTube video id or full watch URL'),
      cursor: z.string().optional().describe('Pagination cursor from a prior response'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.comments(input),
  });
}

export function createScavioYoutubeChannelTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-channel',
    description: 'Fetch details for a YouTube channel by id, @handle, or URL via Scavio.',
    inputSchema: z.object({
      channel_id: z.string().describe('YouTube channel id, @handle, or channel URL'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.channel(input),
  });
}

export function createScavioYoutubeTranscriptTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-transcript',
    description: 'Fetch the transcript or timed subtitles for a YouTube video via Scavio.',
    inputSchema: z.object({
      video_id: z.string().describe('YouTube video id or full watch URL'),
      language: z.string().optional().describe('Caption language code (default "en")'),
      format: z.enum(['text', 'srt']).optional().describe('"text" for plain transcript, "srt" for timed subtitles'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.transcript(input),
  });
}

export function createScavioYoutubeStreamsTool(config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: 'scavio-youtube-streams',
    description: 'Get playable and downloadable stream formats for a YouTube video via Scavio.',
    inputSchema: z.object({
      video_id: z.string().describe('YouTube video id or full watch URL'),
    }),
    outputSchema,
    execute: async input => getClient().youtube.streams(input),
  });
}
