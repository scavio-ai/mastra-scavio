import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Threads - 6 endpoints. BODY-PRICED, not flat: profile, user_posts and user_replies cost 2
// credits addressed by user_id and 4 addressed by username - a handle has to be resolved through
// people search first, because the upstream handle lookup is dead. Pass user_id whenever you
// have it. post, post_comments and search_users have no username form and are always 2 credits.

export const threadsToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioThreadsProfile',
    id: 'scavio-threads-profile',
    platform: 'threads',
    endpoint: '/api/v1/threads/profile',
    credits: 2,
    description:
      'Profile details for a Threads user. Costs 2 credits addressed by user_id and 4 by ' +
      'username; pass user_id whenever you have it.',
    inputSchema: z.object({
      user_id: z.string().optional()
        .describe(
          'Numeric Threads user id, e.g. \'63625256886\'. The cheap path: 2 credits.',
        ),
      username: z.string().optional()
        .describe(
          'Threads handle without the @ (1-60 characters). Costs 2 extra credits (4 total): the ' +
          'upstream handle lookup is down, so the handle is resolved through people search ' +
          'first. Pass user_id instead to avoid that.',
        ),
    }),
    call: (client, input) => client.threads.profile(input),
  }),
  defineScavioTool({
    key: 'scavioThreadsUserPosts',
    id: 'scavio-threads-user-posts',
    platform: 'threads',
    endpoint: '/api/v1/threads/user/posts',
    credits: 2,
    description:
      'A user\'s Threads posts, cursor-paginated via next_cursor. Costs 2 credits addressed by ' +
      'user_id and 4 by username.',
    inputSchema: z.object({
      user_id: z.string().optional()
        .describe(
          'Numeric Threads user id, e.g. \'63625256886\'. The cheap path: 2 credits.',
        ),
      username: z.string().optional()
        .describe(
          'Threads handle without the @ (1-60 characters). Costs 2 extra credits (4 total) ' +
          'because the handle has to be resolved through people search first.',
        ),
      cursor: z.string().optional()
        .describe(
          'Pagination cursor from a prior response\'s next_cursor. Omit for the first page.',
        ),
    }),
    call: (client, input) => client.threads.userPosts(input),
  }),
  defineScavioTool({
    key: 'scavioThreadsUserReplies',
    id: 'scavio-threads-user-replies',
    platform: 'threads',
    endpoint: '/api/v1/threads/user/replies',
    credits: 2,
    description:
      'A user\'s Threads replies, cursor-paginated via next_cursor. Costs 2 credits addressed by ' +
      'user_id and 4 by username.',
    inputSchema: z.object({
      user_id: z.string().optional()
        .describe(
          'Numeric Threads user id, e.g. \'63625256886\'. The cheap path: 2 credits.',
        ),
      username: z.string().optional()
        .describe(
          'Threads handle without the @ (1-60 characters). Costs 2 extra credits (4 total) ' +
          'because the handle has to be resolved through people search first.',
        ),
      cursor: z.string().optional()
        .describe(
          'Pagination cursor from a prior response\'s next_cursor. Omit for the first page.',
        ),
    }),
    call: (client, input) => client.threads.userReplies(input),
  }),
  defineScavioTool({
    key: 'scavioThreadsPost',
    id: 'scavio-threads-post',
    platform: 'threads',
    endpoint: '/api/v1/threads/post',
    credits: 2,
    description:
      'A single Threads post, addressed by post_id or by its threads.net URL. Costs 2 credits. ' +
      'Threads is body-priced by identifier, but this endpoint has no username form, so it is ' +
      'always 2.',
    inputSchema: z.object({
      post_id: z.string().optional().describe('Threads post id, e.g. \'3349029093483693129\'.'),
      url: z.string().optional()
        .describe(
          'Full threads.net post URL (e.g. \'https://www.threads.net/@natgeo/post/C8xY\'), as an ' +
          'alternative to post_id.',
        ),
    }),
    call: (client, input) => client.threads.post(input),
  }),
  defineScavioTool({
    key: 'scavioThreadsPostComments',
    id: 'scavio-threads-post-comments',
    platform: 'threads',
    endpoint: '/api/v1/threads/post/comments',
    credits: 2,
    description:
      'Replies to a Threads post, cursor-paginated via next_cursor. Post-keyed only: there is no ' +
      'username form, so this endpoint always costs 2 credits.',
    inputSchema: z.object({
      post_id: z.string().describe('Threads post id, e.g. \'3349029093483693129\'.'),
      cursor: z.string().optional()
        .describe(
          'Pagination cursor from a prior response\'s next_cursor. Omit for the first page.',
        ),
    }),
    call: (client, input) => client.threads.postComments(input),
  }),
  defineScavioTool({
    key: 'scavioThreadsSearchUsers',
    id: 'scavio-threads-search-users',
    platform: 'threads',
    endpoint: '/api/v1/threads/search/users',
    credits: 2,
    description:
      'Search Threads profiles by name or handle. This is the only search Threads exposes - ' +
      'there is no post or content search - and it returns a single unpaginated page. Costs 2 ' +
      'credits. Threads is body-priced by identifier, but this endpoint has no username form, so ' +
      'it is always 2.',
    inputSchema: z.object({
      query: z.string().describe('Name or handle to search for (1-200 characters).'),
    }),
    call: (client, input) => client.threads.searchUsers(input),
  }),
];

export const createScavioThreadsProfileTool = toolFactory(threadsToolSpecs, 'scavioThreadsProfile');
export const createScavioThreadsUserPostsTool = toolFactory(
  threadsToolSpecs,
  'scavioThreadsUserPosts',
);
export const createScavioThreadsUserRepliesTool = toolFactory(
  threadsToolSpecs,
  'scavioThreadsUserReplies',
);
export const createScavioThreadsPostTool = toolFactory(threadsToolSpecs, 'scavioThreadsPost');
export const createScavioThreadsPostCommentsTool = toolFactory(
  threadsToolSpecs,
  'scavioThreadsPostComments',
);
export const createScavioThreadsSearchUsersTool = toolFactory(
  threadsToolSpecs,
  'scavioThreadsSearchUsers',
);
