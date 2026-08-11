import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Kuaishou (China) - 14 endpoints. PRICED PER ENDPOINT, never per platform: profile 10 credits,
// video 2, videos_batch 40, the four search endpoints 10 each, everything else 1. A single
// platform-wide figure would be wrong by up to 40x, so each tool states its own price.

export const kuaishouToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioKuaishouProfile',
    id: 'scavio-kuaishou-profile',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/profile',
    credits: 10,
    description:
      'Profile details for a Kuaishou user. Costs 10 credits, the dearest single-object call on ' +
      'the platform.',
    inputSchema: z.object({
      user_id: z.string()
        .describe(
          'Kuaishou user id (non-empty); get one from user_resolve or search_users.',
        ),
    }),
    call: (client, input) => client.kuaishou.profile(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouUserPosts',
    id: 'scavio-kuaishou-user-posts',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/user/posts',
    credits: 1,
    description:
      'A Kuaishou user\'s top posts, cursor-paginated via next_cursor. Costs 1 credit. Kuaishou ' +
      'is priced PER ENDPOINT (1, 2, 10 or 40), never per platform.',
    inputSchema: z.object({
      user_id: z.string()
        .describe(
          'Kuaishou user id (non-empty); get one from user_resolve or search_users.',
        ),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.userPosts(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouUserLive',
    id: 'scavio-kuaishou-user-live',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/user/live',
    credits: 1,
    description:
      'A Kuaishou user\'s current live-stream status. Not paginated. Costs 1 credit. Kuaishou is ' +
      'priced PER ENDPOINT (1, 2, 10 or 40), never per platform.',
    inputSchema: z.object({
      user_id: z.string()
        .describe(
          'Kuaishou user id (non-empty); get one from user_resolve or search_users.',
        ),
    }),
    call: (client, input) => client.kuaishou.userLive(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouUserResolve',
    id: 'scavio-kuaishou-user-resolve',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/user/resolve',
    credits: 1,
    description:
      'Turns a Kuaishou share link into a user id. Only kuaishou.com and v.kuaishou.com links ' +
      'are accepted; Kwai international (kwai.com) is not served upstream. Costs 1 credit. ' +
      'Kuaishou is priced PER ENDPOINT (1, 2, 10 or 40), never per platform.',
    inputSchema: z.object({
      share_link: z.string()
        .describe(
          'A kuaishou.com or v.kuaishou.com URL; kwai.com links are rejected.',
        ),
    }),
    call: (client, input) => client.kuaishou.userResolve(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouVideo',
    id: 'scavio-kuaishou-video',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/video',
    credits: 2,
    description:
      'A single Kuaishou video by photo id or URL. Provide photo_id or url. Costs 2 credits.',
    inputSchema: z.object({
      photo_id: z.string().optional().describe('Kuaishou photo (video) id, non-empty.'),
      url: z.string().optional()
        .describe(
          'Full kuaishou.com video URL, as an alternative to photo_id.',
        ),
    }),
    call: (client, input) => client.kuaishou.video(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouVideoComments',
    id: 'scavio-kuaishou-video-comments',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/video/comments',
    credits: 1,
    description:
      'Comments on a Kuaishou video, cursor-paginated via next_cursor. Costs 1 credit. Kuaishou ' +
      'is priced PER ENDPOINT (1, 2, 10 or 40), never per platform.',
    inputSchema: z.object({
      photo_id: z.string().describe('Kuaishou photo (video) id, non-empty.'),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.videoComments(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouCommentReplies',
    id: 'scavio-kuaishou-comment-replies',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/video/sub-comments',
    credits: 1,
    description:
      'Replies under a root comment on a Kuaishou video, cursor-paginated via next_cursor; count ' +
      'sizes the page (1-50). Costs 1 credit. Kuaishou is priced PER ENDPOINT (1, 2, 10 or 40), ' +
      'never per platform.',
    inputSchema: z.object({
      photo_id: z.string().describe('Kuaishou photo (video) id, non-empty.'),
      root_comment_id: z.string()
        .describe(
          'Id of the top-level comment whose replies you want, from video_comments.',
        ),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
      count: z.number().int().optional()
        .describe(
          'Replies per page, 1-50. Omit to use the upstream default.',
        ),
    }),
    call: (client, input) => client.kuaishou.commentReplies(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouVideosBatch',
    id: 'scavio-kuaishou-videos-batch',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/videos/batch',
    credits: 40,
    description:
      'Several Kuaishou videos in one call, hard-capped at 20 photo ids. Costs 40 credits, the ' +
      'dearest call on the platform.',
    inputSchema: z.object({
      photo_ids: z.array(z.string())
        .describe(
          'Kuaishou photo (video) ids, 1-20 per call; more than 20 is rejected.',
        ),
    }),
    call: (client, input) => client.kuaishou.videosBatch(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouSearch',
    id: 'scavio-kuaishou-search',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/search',
    credits: 10,
    description:
      'Mixed-result search across Kuaishou, cursor-paginated via next_cursor. Costs 10 credits ' +
      'per page.',
    inputSchema: z.object({
      keyword: z.string().describe('Search keyword, 1-200 characters.'),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.search(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouSearchVideos',
    id: 'scavio-kuaishou-search-videos',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/search/videos',
    credits: 10,
    description:
      'Kuaishou video search results, cursor-paginated via next_cursor. Costs 10 credits per ' +
      'page.',
    inputSchema: z.object({
      keyword: z.string().describe('Search keyword, 1-200 characters.'),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.searchVideos(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouSearchUsers',
    id: 'scavio-kuaishou-search-users',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/search/users',
    credits: 10,
    description:
      'Kuaishou user search results, cursor-paginated via next_cursor. Costs 10 credits per ' +
      'page.',
    inputSchema: z.object({
      keyword: z.string().describe('Search keyword, 1-200 characters.'),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.searchUsers(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouSearchLive',
    id: 'scavio-kuaishou-search-live',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/search/live',
    credits: 10,
    description:
      'Kuaishou live-stream search results, cursor-paginated via next_cursor. Costs 10 credits ' +
      'per page.',
    inputSchema: z.object({
      keyword: z.string().describe('Search keyword, 1-200 characters.'),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.searchLive(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouTagFeed',
    id: 'scavio-kuaishou-tag-feed',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/tag/feed',
    credits: 1,
    description:
      'Posts under a Kuaishou hashtag, cursor-paginated via next_cursor. Costs 1 credit. ' +
      'Kuaishou is priced PER ENDPOINT (1, 2, 10 or 40), never per platform.',
    inputSchema: z.object({
      tag: z.string().describe('Hashtag text without the leading \'#\', 1-200 characters.'),
      cursor: z.string().optional()
        .describe(
          'Opaque next_cursor from a prior response; omit for the first page.',
        ),
    }),
    call: (client, input) => client.kuaishou.tagFeed(input),
  }),
  defineScavioTool({
    key: 'scavioKuaishouTrending',
    id: 'scavio-kuaishou-trending',
    platform: 'kuaishou',
    endpoint: '/api/v1/kuaishou/trending',
    credits: 1,
    description:
      'Kuaishou hot / live / shopping / brand / music leaderboards. One board per call, not ' +
      'paginated. Costs 1 credit. Kuaishou is priced PER ENDPOINT (1, 2, 10 or 40), never per ' +
      'platform.',
    inputSchema: z.object({
      board: z.enum(['hot', 'live', 'shopping', 'brand', 'music']).optional()
        .describe(
          'Leaderboard to return; defaults to \'hot\' when omitted.',
        ),
    }),
    call: (client, input) => client.kuaishou.trending(input),
  }),
];

export const createScavioKuaishouProfileTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouProfile',
);
export const createScavioKuaishouUserPostsTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouUserPosts',
);
export const createScavioKuaishouUserLiveTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouUserLive',
);
export const createScavioKuaishouUserResolveTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouUserResolve',
);
export const createScavioKuaishouVideoTool = toolFactory(kuaishouToolSpecs, 'scavioKuaishouVideo');
export const createScavioKuaishouVideoCommentsTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouVideoComments',
);
export const createScavioKuaishouCommentRepliesTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouCommentReplies',
);
export const createScavioKuaishouVideosBatchTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouVideosBatch',
);
export const createScavioKuaishouSearchTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouSearch',
);
export const createScavioKuaishouSearchVideosTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouSearchVideos',
);
export const createScavioKuaishouSearchUsersTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouSearchUsers',
);
export const createScavioKuaishouSearchLiveTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouSearchLive',
);
export const createScavioKuaishouTagFeedTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouTagFeed',
);
export const createScavioKuaishouTrendingTool = toolFactory(
  kuaishouToolSpecs,
  'scavioKuaishouTrending',
);
