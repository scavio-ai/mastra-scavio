import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// YouTube runs on a dedicated upstream source. 16 paths exist, but /api/v1/youtube/metadata is a
// byte-identical deprecated alias of /api/v1/youtube/video, so only /video is
// exposed - two tools for one endpoint would just split the agent's choice.
//
// Credits are NOT flat here: /search and /shorts cost 2, /streams 3,
// /transcript 8, everything else 1. Each description states its own cost.
//
// Wire quirk: the four search-ish endpoints take a field literally named
// `search`, not `query`. The scavio SDK exposes `query` and maps it, so these
// tools take `query` and let the SDK do the rename - the same two layers the
// rest of the ecosystem preserves. Pagination is cursor-only.

const cursor = z
  .string()
  .optional()
  .describe('Pagination cursor: the next_cursor from a prior response.');
const videoId = z
  .string()
  .describe("Video id (e.g. 'dQw4w9WgXcQ') or any watch, shorts, embed or youtu.be URL.");
const channelId = z
  .string()
  .describe("Channel id ('UC...'), @handle, or channel URL. A handle costs no extra credit.");

export const youtubeToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioYoutubeSearch',
    id: 'scavio-youtube-search',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/search',
    credits: 2,
    description:
      'Search YouTube for videos, channels and playlists via Scavio (2 credits). Returns data.results (videos) plus data.shorts, data.channels, data.playlists and data.next_cursor.',
    inputSchema: z.object({
      query: z.string().describe('The search query (1-500 characters).'),
      upload_date: z
        .enum(['last_hour', 'today', 'this_week', 'this_month', 'this_year'])
        .optional()
        .describe('Restrict results to a recent upload window.'),
      type: z
        .enum(['video', 'channel', 'playlist', 'movie'])
        .optional()
        .describe('Restrict results to one result type.'),
      duration: z
        .enum(['short', 'medium', 'long'])
        .optional()
        .describe('short (<4 min), medium (4-20 min), long (>20 min).'),
      sort_by: z
        .enum(['relevance', 'date', 'view_count', 'rating'])
        .optional()
        .describe('Sort order.'),
      features: z
        .array(
          z.enum([
            'hd',
            '4k',
            'subtitles',
            'creative_commons',
            'live',
            '360',
            '3d',
            'hdr',
            'vr180',
          ]),
        )
        .optional()
        .describe('Feature filters. Only positive filters exist - there is no way to exclude.'),
      cursor,
    }),
    call: (client, input) => client.youtube.search(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeShorts',
    id: 'scavio-youtube-shorts',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/shorts',
    credits: 2,
    description:
      'Search YouTube Shorts via Scavio (2 credits). Returns data.results with data.next_cursor. Shorts-only - use scavio-youtube-search for long-form video.',
    inputSchema: z.object({
      query: z.string().describe('The search query (1-500 characters).'),
      sort_by: z
        .enum(['relevance', 'date', 'view_count', 'rating'])
        .optional()
        .describe('Sort order.'),
      cursor,
    }),
    call: (client, input) => client.youtube.shorts(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeSuggestions',
    id: 'scavio-youtube-suggestions',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/suggestions',
    credits: 1,
    description:
      'Get YouTube autocomplete suggestions for a partial query via Scavio (1 credit). Returns data.suggestions as bare strings - there is no search volume upstream, so none is reported.',
    inputSchema: z.object({
      query: z.string().describe('Partial query to expand (1-500 characters).'),
      language: z.string().optional().describe("Language code for suggestions, e.g. 'en'."),
      region: z.string().optional().describe("Region code for suggestions, e.g. 'US'."),
    }),
    call: (client, input) => client.youtube.suggestions(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeVideo',
    id: 'scavio-youtube-video',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/video',
    credits: 1,
    description:
      'Fetch full details for one YouTube video via Scavio (1 credit): title, author, published_at, description, view_count, length_seconds, keywords and the caption tracks available.',
    inputSchema: z.object({ video_id: videoId }),
    call: (client, input) => client.youtube.video(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeComments',
    id: 'scavio-youtube-comments',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/comments',
    credits: 1,
    description:
      'List the top-level comments on a YouTube video via Scavio (1 credit). Each comment carries a reply_cursor - feed that to scavio-youtube-comment-replies to open its thread.',
    inputSchema: z.object({ video_id: videoId, cursor }),
    call: (client, input) => client.youtube.comments(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeCommentReplies',
    id: 'scavio-youtube-comment-replies',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/comments/replies',
    credits: 1,
    description:
      'Fetch the replies to one YouTube comment via Scavio (1 credit). Needs both the video_id and a reply_cursor taken from a comment in scavio-youtube-comments; it cannot be called from a video id alone.',
    inputSchema: z.object({
      video_id: videoId,
      reply_cursor: z
        .string()
        .describe('The reply_cursor of the comment whose thread you want to open.'),
      cursor: z
        .string()
        .optional()
        .describe('Page 2+ cursor. It overrides reply_cursor, so send it only to continue paging.'),
    }),
    call: (client, input) => client.youtube.commentReplies(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeTranscript',
    id: 'scavio-youtube-transcript',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/transcript',
    credits: 8,
    description:
      'Fetch a YouTube video transcript via Scavio (8 credits - the most expensive YouTube tool, call it once and cache the text). Returns the whole transcript as one string in data.content, plain text by default or SRT with format "srt".',
    inputSchema: z.object({
      video_id: videoId,
      language: z.string().optional().describe('Caption language code. Defaults to "en".'),
      format: z
        .enum(['text', 'srt'])
        .optional()
        .describe('"text" for a plain transcript (default), "srt" for timed subtitles.'),
    }),
    call: (client, input) => client.youtube.transcript(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeRelated',
    id: 'scavio-youtube-related',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/related',
    credits: 1,
    description:
      'List the videos YouTube recommends alongside a given video via Scavio (1 credit). Returns data.results; this endpoint reports no next_cursor, so treat one call as the whole answer.',
    inputSchema: z.object({ video_id: videoId, cursor }),
    call: (client, input) => client.youtube.related(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeChannelSearch',
    id: 'scavio-youtube-channel-search',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/channel/search',
    credits: 1,
    description:
      'Search YouTube for channels via Scavio (1 credit). Returns data.results with channel_id, handle, subscriber_count and verified - feed a channel_id into the other channel tools.',
    inputSchema: z.object({
      query: z.string().describe('The channel search query (1-500 characters).'),
      cursor,
    }),
    call: (client, input) => client.youtube.channelSearch(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeChannel',
    id: 'scavio-youtube-channel',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/channel',
    credits: 1,
    description:
      'Fetch a YouTube channel profile via Scavio (1 credit): title, description, handle, subscriber_count, video_count, view_count, country and external links.',
    inputSchema: z.object({ channel_id: channelId }),
    call: (client, input) => client.youtube.channel(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeChannelVideos',
    id: 'scavio-youtube-channel-videos',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/channel/videos',
    credits: 1,
    description:
      "List a channel's uploaded videos via Scavio (1 credit). Returns data.results with view_count and published_time, plus data.next_cursor for more pages.",
    inputSchema: z.object({ channel_id: channelId, cursor }),
    call: (client, input) => client.youtube.channelVideos(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeChannelShorts',
    id: 'scavio-youtube-channel-shorts',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/channel/shorts',
    credits: 1,
    description:
      "List a channel's Shorts via Scavio (1 credit). Items carry video_id, title, url and thumbnail only - view counts are deliberately omitted because the upstream value is unreliable for Shorts.",
    inputSchema: z.object({ channel_id: channelId, cursor }),
    call: (client, input) => client.youtube.channelShorts(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeChannelCommunity',
    id: 'scavio-youtube-channel-community',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/channel/community',
    credits: 1,
    description:
      "Fetch a channel's community posts via Scavio (1 credit). This is the only YouTube tool whose list key is data.posts, each with text, vote_count, comment_count and any attached images.",
    inputSchema: z.object({ channel_id: channelId, cursor }),
    call: (client, input) => client.youtube.channelCommunity(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeChannelResolve',
    id: 'scavio-youtube-channel-resolve',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/channel/resolve',
    credits: 1,
    description:
      'Resolve a YouTube @handle or channel URL to its UC channel id via Scavio (1 credit). The parameter is `channel`, not `channel_id` - the other channel tools accept handles directly, so use this only when you need the id itself.',
    inputSchema: z.object({
      channel: z.string().describe("A channel @handle or channel URL, e.g. '@MrBeast'."),
    }),
    call: (client, input) => client.youtube.channelResolve(input),
  }),
  defineScavioTool({
    key: 'scavioYoutubeStreams',
    id: 'scavio-youtube-streams',
    platform: 'youtube',
    endpoint: '/api/v1/youtube/streams',
    credits: 3,
    description:
      'Get playable and downloadable stream formats for a YouTube video via Scavio (3 credits). Stream URLs are time-limited - data.expires_in_seconds is the TTL, so use them immediately rather than storing them.',
    inputSchema: z.object({ video_id: videoId }),
    call: (client, input) => client.youtube.streams(input),
  }),
];

export const createScavioYoutubeSearchTool = toolFactory(youtubeToolSpecs, 'scavioYoutubeSearch');
export const createScavioYoutubeShortsTool = toolFactory(youtubeToolSpecs, 'scavioYoutubeShorts');
export const createScavioYoutubeSuggestionsTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeSuggestions',
);
export const createScavioYoutubeVideoTool = toolFactory(youtubeToolSpecs, 'scavioYoutubeVideo');
export const createScavioYoutubeCommentsTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeComments',
);
export const createScavioYoutubeCommentRepliesTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeCommentReplies',
);
export const createScavioYoutubeTranscriptTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeTranscript',
);
export const createScavioYoutubeRelatedTool = toolFactory(youtubeToolSpecs, 'scavioYoutubeRelated');
export const createScavioYoutubeChannelSearchTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeChannelSearch',
);
export const createScavioYoutubeChannelTool = toolFactory(youtubeToolSpecs, 'scavioYoutubeChannel');
export const createScavioYoutubeChannelVideosTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeChannelVideos',
);
export const createScavioYoutubeChannelShortsTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeChannelShorts',
);
export const createScavioYoutubeChannelCommunityTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeChannelCommunity',
);
export const createScavioYoutubeChannelResolveTool = toolFactory(
  youtubeToolSpecs,
  'scavioYoutubeChannelResolve',
);
export const createScavioYoutubeStreamsTool = toolFactory(youtubeToolSpecs, 'scavioYoutubeStreams');
