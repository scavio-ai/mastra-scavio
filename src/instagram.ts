import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Instagram - 12 endpoints, priced PER ENDPOINT and never flat: 10 for the
// hedged calls, 8 for the two that have no fallback leg to hedge (post detail
// and comment replies), and 2 for user posts, whose cheap leg is the primary.
// Cost is stated in every description because the spread is 5x - fanning out
// blindly here is the fastest way to burn a credit balance.
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
// - data is a raw upstream passthrough: video lives at video_versions[].url
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
    credits: 10,
    description:
      'Fetch an Instagram profile via Scavio (10 credits). The profile is inlined at the root of data - pk, username, full_name, biography, follower_count, following_count, is_private, is_verified, profile_pic_url - with no data.user wrapper. Provide username or user_id.',
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
      "Fetch an account's Instagram timeline posts via Scavio (2 credits - the cheapest Instagram tool by 5x, because its primary upstream leg is the cheap one). Items usually arrive at data.data with data.pagination_token; a fallback leg answers with data.items and next_max_id instead, so read both. Prefer this over the reels and tagged tools when you just need recent media.",
    inputSchema: z.object({ username, user_id: userId, count: feedCount, cursor }),
    call: (client, input) => client.instagram.userPosts(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserReels',
    id: 'scavio-instagram-user-reels',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/reels',
    credits: 10,
    description:
      "Fetch an account's Instagram reels via Scavio (10 credits). Returns data.items with data.next_max_id. Five times the price of scavio-instagram-user-posts, so use it only when you specifically need reels rather than the timeline.",
    inputSchema: z.object({ username, user_id: userId, count: feedCount, cursor }),
    call: (client, input) => client.instagram.userReels(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserTagged',
    id: 'scavio-instagram-user-tagged',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/tagged',
    credits: 10,
    description:
      'Fetch the posts an Instagram account is tagged in via Scavio (10 credits). Returns data.items with data.more_available and data.next_max_id. This is other accounts posting about them - use it for brand mentions and creator collaborations, not for their own feed.',
    inputSchema: z.object({ username, user_id: userId, count: feedCount, cursor }),
    call: (client, input) => client.instagram.userTagged(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserStories',
    id: 'scavio-instagram-user-stories',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/stories',
    credits: 10,
    description:
      "Fetch an Instagram account's currently active stories via Scavio (10 credits). Returns data.items and data.reels. Stories expire after 24 hours and there is no pagination here - no count, no cursor. Provide username or user_id.",
    inputSchema: z.object({ username, user_id: userId }),
    call: (client, input) => client.instagram.userStories(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramPost',
    id: 'scavio-instagram-post',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/post',
    credits: 8,
    description:
      'Fetch one Instagram post via Scavio (8 credits - cheaper than most Instagram tools because there is no fallback leg to hedge). The post is data.items[0]: caption, like_count, comment_count, media_type (1 image, 2 video, 8 carousel), video_versions[].url for video and image_versions2.candidates for the cover. It also carries the media_id that scavio-instagram-comment-replies requires. Provide url, media_id or shortcode.',
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
    credits: 10,
    description:
      'Fetch the comments on an Instagram post via Scavio (10 credits). Returns data.comments with data.comment_count, data.has_more_comments and data.next_min_id. Identify the post by shortcode or url ONLY - media_id is not accepted here, unlike the post and replies tools.',
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
        .describe('popular (default) or newest. A fallback leg can silently ignore it.'),
    }),
    call: (client, input) => client.instagram.postComments(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramCommentReplies',
    id: 'scavio-instagram-comment-replies',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/post/comments/replies',
    credits: 8,
    description:
      'Fetch the replies to one Instagram comment via Scavio (8 credits - no fallback leg to hedge). Returns data.child_comments with data.next_min_child_id. Requires media_id plus comment_id: the comments tool does not return a media_id, so resolve it with scavio-instagram-post first. A shortcode or url will not work here.',
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
    credits: 10,
    description:
      'Search Instagram accounts by keyword via Scavio (10 credits). Returns data.users with data.rank_token. Page size is not controllable - there is no count - and a fallback leg can reset paging to page 1, so treat deep paging as unreliable.',
    inputSchema: z.object({ keyword, cursor }),
    call: (client, input) => client.instagram.searchUsers(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramSearchHashtags',
    id: 'scavio-instagram-search-hashtags',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/search/hashtags',
    credits: 10,
    description:
      'Search Instagram hashtags by keyword via Scavio (10 credits). Returns data.hashtags with media counts and data.rank_token. Same no-count, unreliable-deep-paging caveat as the user search.',
    inputSchema: z.object({ keyword, cursor }),
    call: (client, input) => client.instagram.searchHashtags(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserFollowers',
    id: 'scavio-instagram-user-followers',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/followers',
    credits: 10,
    description:
      "List an Instagram account's followers via Scavio (10 credits). Returns data.users with data.has_more; the followers response often carries no continuation id, so paging can end earlier than followings. Each page costs another 10 credits - cap how deep you walk.",
    inputSchema: z.object({ username, user_id: userId, count: followCount, cursor }),
    call: (client, input) => client.instagram.userFollowers(input),
  }),
  defineScavioTool({
    key: 'scavioInstagramUserFollowings',
    id: 'scavio-instagram-user-followings',
    platform: 'instagram',
    endpoint: '/api/v1/instagram/user/followings',
    credits: 10,
    description:
      'List the accounts an Instagram user follows via Scavio (10 credits). Returns data.users with data.next_max_id and data.has_more. The public name is followings (plural), matching TikTok.',
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
