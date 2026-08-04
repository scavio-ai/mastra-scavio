import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// TikTok - 11 endpoints, 1 credit each.
//
// Wire quirks worth knowing before building a pipeline:
// - `cursor` is a STRING ("0", not 0) everywhere it exists, while `count` is a
//   number. Sending a numeric cursor is a 400.
// - sec_user_id, NOT the @handle, is the identity key for user/posts,
//   user/followers and user/followings, and it is required there. Only
//   scavio-tiktok-profile accepts a username, so profile is the first call in
//   any account pipeline.
// - hashtag/videos needs a hashtag_id, which only scavio-tiktok-hashtag returns.
// - the search field is `keyword` - never `query` or `search`.
// - followers and followings do not page by cursor at all: they use page_token
//   plus min_time, and min_time is the one numeric pagination field here.
// - sort_type and publish_time are strings of digits ("0", "1", "30"), not ints.
// - data is a raw upstream passthrough, so top-level keys inside data vary with
//   which upstream leg answered (aweme_list on the app leg, and so on).

const cursor = z
  .string()
  .optional()
  .describe('Pagination cursor as a STRING (default "0"). Never send a number.');
const secUserId = z
  .string()
  .describe('TikTok sec_user_id, from scavio-tiktok-profile. A username is not accepted here.');
const videoId = z.string().describe("TikTok video id, e.g. '7000000000000000000'.");
const keyword = z.string().describe('Search keyword (1-500 characters). Not named query.');
const sortType = z
  .enum(['0', '1'])
  .optional()
  .describe('Digit string, not a number. See the tool description for what each value means.');

export const tiktokToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioTiktokProfile',
    id: 'scavio-tiktok-profile',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/profile',
    credits: 1,
    description:
      'Fetch a TikTok account profile via Scavio (1 credit). The profile is under data.user with follower_count, following_count, aweme_count, signature and sec_uid. This is the only TikTok tool that takes a username, so call it first to obtain the sec_user_id that the posts and follow-list tools require. Provide username or sec_user_id.',
    inputSchema: z.object({
      username: z.string().optional().describe("TikTok @handle WITHOUT the @, e.g. 'tiktok'."),
      sec_user_id: z
        .string()
        .optional()
        .describe('TikTok sec_user_id. Takes precedence over username when both are sent.'),
    }),
    call: (client, input) => client.tiktok.profile(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokUserPosts',
    id: 'scavio-tiktok-user-posts',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/user/posts',
    credits: 1,
    description:
      "Fetch an account's TikTok videos via Scavio (1 credit). Returns data.aweme_list with data.max_cursor and data.has_more - page by feeding max_cursor back as cursor. sec_user_id is required; resolve it with scavio-tiktok-profile first.",
    inputSchema: z.object({
      sec_user_id: secUserId,
      cursor,
      count: z.number().optional().describe('Videos per page (1-30, default 20).'),
      sort_type: sortType.describe('"0" = latest (default), "1" = popular. A digit string.'),
    }),
    call: (client, input) => client.tiktok.userPosts(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokVideo',
    id: 'scavio-tiktok-video',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/video',
    credits: 1,
    description:
      'Fetch one TikTok video in full via Scavio (1 credit). The video is under data.aweme_detail: desc, statistics (play, digg, comment, share counts), music, author and the video addresses.',
    inputSchema: z.object({ video_id: videoId }),
    call: (client, input) => client.tiktok.video(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokVideoComments',
    id: 'scavio-tiktok-video-comments',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/video/comments',
    credits: 1,
    description:
      'Fetch the comments on a TikTok video via Scavio (1 credit). Returns data.comments with data.cursor and data.has_more. Replies are not included - expand a comment with scavio-tiktok-comment-replies.',
    inputSchema: z.object({
      video_id: videoId,
      cursor,
      count: z.number().optional().describe('Comments per page (1-50, default 20).'),
    }),
    call: (client, input) => client.tiktok.videoComments(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokCommentReplies',
    id: 'scavio-tiktok-comment-replies',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/video/comments/replies',
    credits: 1,
    description:
      'Fetch the replies to one TikTok comment via Scavio (1 credit). Returns data.comments for that thread with data.cursor and data.has_more. Needs both the video id and the parent comment_id from scavio-tiktok-video-comments.',
    inputSchema: z.object({
      video_id: videoId,
      comment_id: z.string().describe('Parent comment id, from the video comments tool.'),
      cursor,
      count: z.number().optional().describe('Replies per page (1-50, default 20).'),
    }),
    call: (client, input) => client.tiktok.commentReplies(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokSearchVideos',
    id: 'scavio-tiktok-search-videos',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/search/videos',
    credits: 1,
    description:
      'Search TikTok videos by keyword via Scavio (1 credit). Returns data.aweme_list with data.cursor and data.has_more. The query field is named `keyword`. Here cursor is a numeric offset carried as a string, so page by adding the page size to it.',
    inputSchema: z.object({
      keyword,
      cursor,
      count: z.number().optional().describe('Videos per page (1-30, default 20).'),
      sort_type: sortType.describe('"0" = relevance (default), "1" = most likes. A digit string.'),
      publish_time: z
        .enum(['0', '1', '7', '30', '90', '180'])
        .optional()
        .describe('Age filter in days as a digit string: "0" all time, "1", "7", "30", "90", "180".'),
    }),
    call: (client, input) => client.tiktok.searchVideos(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokSearchUsers',
    id: 'scavio-tiktok-search-users',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/search/users',
    credits: 1,
    description:
      'Search TikTok accounts by keyword via Scavio (1 credit). Returns data.user_list with data.cursor and data.has_more - each entry carries the sec_uid you need for the account tools, so this is a cheaper way in than guessing handles.',
    inputSchema: z.object({
      keyword,
      cursor,
      count: z.number().optional().describe('Accounts per page (1-30, default 20).'),
    }),
    call: (client, input) => client.tiktok.searchUsers(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokHashtag',
    id: 'scavio-tiktok-hashtag',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/hashtag',
    credits: 1,
    description:
      'Fetch a TikTok hashtag via Scavio (1 credit): view count, video count and, crucially, the hashtag id under data.challengeInfo. scavio-tiktok-hashtag-videos accepts only that id, so call this first. Provide hashtag_name or hashtag_id.',
    inputSchema: z.object({
      hashtag_name: z.string().optional().describe("Hashtag WITHOUT the leading #, e.g. 'fyp'."),
      hashtag_id: z
        .string()
        .optional()
        .describe('Hashtag id. Takes precedence over hashtag_name when both are sent.'),
    }),
    call: (client, input) => client.tiktok.hashtag(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokHashtagVideos',
    id: 'scavio-tiktok-hashtag-videos',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/hashtag/videos',
    credits: 1,
    description:
      'List the videos on a TikTok hashtag via Scavio (1 credit). Returns data.aweme_list with data.cursor and data.has_more. Takes a hashtag_id only - the hashtag name is not accepted, so resolve it with scavio-tiktok-hashtag first.',
    inputSchema: z.object({
      hashtag_id: z.string().describe('Hashtag id from scavio-tiktok-hashtag. Not the name.'),
      cursor,
      count: z.number().optional().describe('Videos per page (1-30, default 20).'),
    }),
    call: (client, input) => client.tiktok.hashtagVideos(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokUserFollowers',
    id: 'scavio-tiktok-user-followers',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/user/followers',
    credits: 1,
    description:
      "List a TikTok account's followers via Scavio (1 credit). Returns data.followers with data.next_page_token and data.min_time - page with those two, NOT with a cursor. count caps at 20, the lowest in the family, so a large account costs many credits to walk.",
    inputSchema: z.object({
      sec_user_id: secUserId,
      count: z.number().optional().describe('Followers per page (1-20, default 20).'),
      page_token: z.string().optional().describe('next_page_token from a prior response.'),
      min_time: z
        .number()
        .optional()
        .describe('Timestamp cursor from a prior response. A NUMBER here, unlike cursor elsewhere.'),
    }),
    call: (client, input) => client.tiktok.userFollowers(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokUserFollowings',
    id: 'scavio-tiktok-user-followings',
    platform: 'tiktok',
    endpoint: '/api/v1/tiktok/user/followings',
    credits: 1,
    description:
      'List the accounts a TikTok user follows via Scavio (1 credit). Same inputs and same page_token plus min_time paging as the followers tool; the array comes back as data.followings.',
    inputSchema: z.object({
      sec_user_id: secUserId,
      count: z.number().optional().describe('Accounts per page (1-20, default 20).'),
      page_token: z.string().optional().describe('next_page_token from a prior response.'),
      min_time: z
        .number()
        .optional()
        .describe('Timestamp cursor from a prior response. A NUMBER here, unlike cursor elsewhere.'),
    }),
    call: (client, input) => client.tiktok.userFollowings(input),
  }),
];

export const createScavioTiktokProfileTool = toolFactory(tiktokToolSpecs, 'scavioTiktokProfile');
export const createScavioTiktokUserPostsTool = toolFactory(tiktokToolSpecs, 'scavioTiktokUserPosts');
export const createScavioTiktokVideoTool = toolFactory(tiktokToolSpecs, 'scavioTiktokVideo');
export const createScavioTiktokVideoCommentsTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokVideoComments',
);
export const createScavioTiktokCommentRepliesTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokCommentReplies',
);
export const createScavioTiktokSearchVideosTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokSearchVideos',
);
export const createScavioTiktokSearchUsersTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokSearchUsers',
);
export const createScavioTiktokHashtagTool = toolFactory(tiktokToolSpecs, 'scavioTiktokHashtag');
export const createScavioTiktokHashtagVideosTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokHashtagVideos',
);
export const createScavioTiktokUserFollowersTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokUserFollowers',
);
export const createScavioTiktokUserFollowingsTool = toolFactory(
  tiktokToolSpecs,
  'scavioTiktokUserFollowings',
);
