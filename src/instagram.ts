import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Instagram - 12 endpoints, priced PER ENDPOINT and never flat: profile, reels
// and tagged 1, everything else 2, the searches 8 with a cursor; any request can
// cost up to 10 when it needs extra work. Cost is stated in every description.
//
// Wire quirks worth knowing before building a pipeline:
// - the search tools take `keyword`, not query.
// - user_id beats username: send one, not both.
// - the three post tools take DIFFERENT identifiers. scavio-instagram-post takes
//   url, media_id or shortcode; scavio-instagram-post-comments takes shortcode
//   or url and does NOT accept media_id; scavio-instagram-comment-replies takes
//   media_id plus comment_id and accepts neither shortcode nor url. There is no
//   single identifier that works on all three - resolve media_id from the post
//   tool before asking for replies.
// - `count` does not exist on profile, stories, the post tools or the search
//   tools, and defaults to 12 (not 20) where it does exist.
// - post detail: video lives at video_versions[].url
//   (there is no video_url) and covers at image_versions2.candidates (there is
//   no thumbnail_url). media_type is 1 image, 2 video, 8 carousel.

const username = z
  .string()
  .optional()
  .describe("Instagram username WITHOUT the @, e.g. 'instagram'.");
const userId = z
  .string()
  .optional()
  .describe('Numeric Instagram user id as a STRING. Takes precedence over username.');
const cursor = z
  .string()
  .optional()
  .describe('Opaque pagination cursor from a prior response.');
const keyword = z.string().describe('Search keyword (1-500 characters). Not named query.');
const feedCount = z.number().optional().describe('Items per page (1-50, default 12).');
const followCount = z.number().optional().describe('Users per page (1-100, default 12).');

export const instagramToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioInstagramProfile',
    id: 'scavio-instagram-profile',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/profile',
    credits: 1,
    description:
      'Fetch an Instagram profile via Scavio (1 credit). The profile is inlined at the root of data - pk, username, full_name, biography, follower_count, following_count, is_private, is_verified, profile_pic_url - with no data.user wrapper. Provide username or user_id.',
    inputSchema: z.object({ username, user_id: userId }),
    call: (client, input) => client.instagram.profile(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserPosts',
    id: 'scavio-instagram-user-posts',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/posts',
    credits: 2,
    description:
      "Fetch an account's Instagram timeline posts via Scavio (2 credits per page). Items arrive at data.data; pass data.pagination_token as cursor for the next page. Use it when you need the whole timeline; the reels tool is cheaper (1 credit) when reels alone will do.",
    inputSchema: z.object({ username, user_id: userId, count: feedCount, cursor }),
    call: (client, input) => client.instagram.userPosts(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserReels',
    id: 'scavio-instagram-user-reels',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/reels',
    credits: 1,
    description:
      "Fetch an account's Instagram reels via Scavio (1 credit; 2 the first time a username is looked up). Returns data.items with data.next_max_id.",
    inputSchema: z.object({ username, user_id: userId, count: feedCount, cursor }),
    call: (client, input) => client.instagram.userReels(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserTagged',
    id: 'scavio-instagram-user-tagged',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/tagged',
    credits: 1,
    description:
      'Fetch the posts an Instagram account is tagged in via Scavio (1 credit; 2 the first time a username is looked up). Returns data.items with data.next_max_id. Video items carry video_url null - fetch the video with scavio-instagram-post. This is other accounts posting about them - use it for brand mentions and creator collaborations, not for their own feed.',
    inputSchema: z.object({ username, user_id: userId, count: feedCount, cursor }),
    call: (client, input) => client.instagram.userTagged(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserStories',
    id: 'scavio-instagram-user-stories',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/stories',
    credits: 2,
    description:
      "Fetch an Instagram account's currently active stories via Scavio (2 credits). Returns data.items and data.reels. Stories expire after 24 hours and there is no pagination here - no count, no cursor. Provide username or user_id.",
    inputSchema: z.object({ username, user_id: userId }),
    call: (client, input) => client.instagram.userStories(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramPost',
    id: 'scavio-instagram-post',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/post',
    credits: 2,
    description:
      'Fetch one Instagram post via Scavio (2 credits). The post is data.items[0]: caption, like_count, comment_count, media_type (1 image, 2 video, 8 carousel), video_versions[].url for video and image_versions2.candidates for the cover. It also carries the media_id that scavio-instagram-comment-replies requires. Provide url, media_id or shortcode.',
    inputSchema: z.object({
      url: z.string().optional().describe('Full Instagram post URL.'),
      media_id: z
        .string()
        .optional()
        .describe('Instagram media id. Highest precedence - url and shortcode are ignored with it.'),
      shortcode: z.string().optional().describe("Shortcode from the post URL, e.g. 'DUajw4YkorV'."),
    }),
    call: (client, input) => client.instagram.post(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramPostComments',
    id: 'scavio-instagram-post-comments',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/post/comments',
    credits: 2,
    description:
      'Fetch the comments on an Instagram post via Scavio (2 credits per page). Returns data.comments with data.comment_count, data.has_more_comments and data.next_min_id. Identify the post by shortcode or url ONLY - media_id is not accepted here, unlike the post and replies tools.',
    inputSchema: z.object({
      shortcode: z.string().optional().describe("Shortcode from the post URL, e.g. 'DUajw4YkorV'."),
      url: z
        .string()
        .optional()
        .describe('Full Instagram post URL. It is parsed down to the shortcode, so /p/, /reel/ and /tv/ links work and others fail.'),
      cursor,
      sort_order: z
        .enum(['popular', 'newest'])
        .optional()
        .describe('popular (default) or newest.'),
    }),
    call: (client, input) => client.instagram.postComments(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramCommentReplies',
    id: 'scavio-instagram-comment-replies',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/post/comments/replies',
    credits: 2,
    description:
      'Fetch the replies to one Instagram comment via Scavio (2 credits). Returns data.child_comments; when data.has_more_tail_child_comments is true, pass data.next_min_child_cursor as cursor. Requires media_id plus comment_id: the comments tool does not return a media_id, so resolve it with scavio-instagram-post first. A shortcode or url will not work here.',
    inputSchema: z.object({
      media_id: z.string().describe('Instagram media id, from scavio-instagram-post.'),
      comment_id: z.string().describe('Parent comment id, from scavio-instagram-post-comments.'),
      cursor,
    }),
    call: (client, input) => client.instagram.commentReplies(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramSearchUsers',
    id: 'scavio-instagram-search-users',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/search/users',
    credits: 2,
    description:
      'Search Instagram accounts by keyword via Scavio (2 credits; a request with a cursor costs 8). Returns data.users with data.rank_token. Page size is not controllable - there is no count - so the first page is usually the one to use.',
    inputSchema: z.object({ keyword, cursor }),
    call: (client, input) => client.instagram.searchUsers(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramSearchHashtags',
    id: 'scavio-instagram-search-hashtags',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/search/hashtags',
    credits: 2,
    description:
      'Search Instagram hashtags by keyword via Scavio (2 credits; a request with a cursor costs 8). Returns data.hashtags with media counts and data.rank_token. No count parameter, same as the user search.',
    inputSchema: z.object({ keyword, cursor }),
    call: (client, input) => client.instagram.searchHashtags(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserFollowers',
    id: 'scavio-instagram-user-followers',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/followers',
    credits: 2,
    description:
      "List an Instagram account's followers via Scavio (2 credits per page). Returns data.users with data.has_more, and data.next_max_id when there is a next page. Each page costs another 2 credits - cap how deep you walk.",
    inputSchema: z.object({ username, user_id: userId, count: followCount, cursor }),
    call: (client, input) => client.instagram.userFollowers(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserFollowings',
    id: 'scavio-instagram-user-followings',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/followings',
    credits: 2,
    description:
      'List the accounts an Instagram user follows via Scavio (2 credits per page). Returns data.users with data.next_max_id and data.has_more. The public name is followings (plural), matching TikTok.',
    inputSchema: z.object({ username, user_id: userId, count: followCount, cursor }),
    call: (client, input) => client.instagram.userFollowings(input),
  }),
];

export const createScavioInstagramProfileTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramProfile',
);
export const createScavioInstagramUserPostsTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramUserPosts',
);
export const createScavioInstagramUserReelsTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramUserReels',
);
export const createScavioInstagramUserTaggedTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramUserTagged',
);
export const createScavioInstagramUserStoriesTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramUserStories',
);
export const createScavioInstagramPostTool = toolFactory(instagramToolSpecs, 'scavioInstagramPost');
export const createScavioInstagramPostCommentsTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramPostComments',
);
export const createScavioInstagramCommentRepliesTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramCommentReplies',
);
export const createScavioInstagramSearchUsersTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramSearchUsers',
);
export const createScavioInstagramSearchHashtagsTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramSearchHashtags',
);
export const createScavioInstagramUserFollowersTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramUserFollowers',
);
export const createScavioInstagramUserFollowingsTool = toolFactory(
  instagramToolSpecs,
  'scavioInstagramUserFollowings',
);
