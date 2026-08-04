import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// X (Twitter) - 11 endpoints, 1 credit each.
//
// Wire quirks worth knowing before reading a response:
// - /x/search takes a field literally named `search`, not `query`. It is passed
//   through natively rather than renamed, so nothing is silently remapped.
// - `search_type` is Capitalized (Top/Latest/...), `rank` on tweet comments is
//   lowercase (top/latest). They are not the same vocabulary.
// - /x/trending takes a country NAME ("UnitedStates"), never an ISO code.
// - /x/user/followings answers with data.following, not data.followings.
// - the user timeline tools return no has_more; page until next_cursor is null.

const cursor = z
  .string()
  .optional()
  .describe('Pagination cursor: the next_cursor from a prior response.');
const screenName = z.string().describe("An X handle WITHOUT the leading @, e.g. 'elonmusk'.");
const tweetId = z.string().describe("Tweet id as a string, e.g. '1808168603721650364'.");

export const xToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioXSearch',
    id: 'scavio-x-search',
    platform: 'x',
    endpoint: '/api/v1/x/search',
    credits: 1,
    description:
      'Search X (Twitter) posts in real time via Scavio (1 credit). Returns data.timeline of tweet objects with favorites, retweets, replies, views and the author profile, plus data.next_cursor. The query field is named `search`.',
    inputSchema: z.object({
      search: z.string().describe('The search query (1-500 characters).'),
      search_type: z
        .enum(['Top', 'Latest', 'People', 'Photos', 'Videos'])
        .optional()
        .describe('Result category, Capitalized. Defaults to Top.'),
      cursor,
    }),
    call: (client, input) => client.x.search(input),
  }),
  defineScavioTool({
    key: 'scavioXTweet',
    id: 'scavio-x-tweet',
    platform: 'x',
    endpoint: '/api/v1/x/tweet',
    credits: 1,
    description:
      'Fetch one X post by id via Scavio (1 credit). Returns the tweet object plus its reply context (reply_to, in_reply_to_screen_name) and any quoted or retweeted post resolved one level deep.',
    inputSchema: z.object({ tweet_id: tweetId }),
    call: (client, input) => client.x.tweet(input),
  }),
  defineScavioTool({
    key: 'scavioXTweetComments',
    id: 'scavio-x-tweet-comments',
    platform: 'x',
    endpoint: '/api/v1/x/tweet/comments',
    credits: 1,
    description:
      'List the replies to an X post via Scavio (1 credit). Returns data.timeline with data.next_cursor. rank "top" is ranked (default), "latest" is chronological - lowercase, unlike search_type.',
    inputSchema: z.object({
      tweet_id: tweetId,
      rank: z
        .enum(['top', 'latest'])
        .optional()
        .describe('"top" for ranked replies (default), "latest" for chronological.'),
      cursor,
    }),
    call: (client, input) => client.x.tweetComments(input),
  }),
  defineScavioTool({
    key: 'scavioXTweetRetweeters',
    id: 'scavio-x-tweet-retweeters',
    platform: 'x',
    endpoint: '/api/v1/x/tweet/retweeters',
    credits: 1,
    description:
      'List the accounts that reposted an X post via Scavio (1 credit). Returns data.retweeters with follower and post counts, plus data.next_cursor.',
    inputSchema: z.object({ tweet_id: tweetId, cursor }),
    call: (client, input) => client.x.tweetRetweeters(input),
  }),
  defineScavioTool({
    key: 'scavioXUser',
    id: 'scavio-x-user',
    platform: 'x',
    endpoint: '/api/v1/x/user',
    credits: 1,
    description:
      'Fetch an X profile by handle via Scavio (1 credit). Returns a flat object with user_id, name, description, followers_count, friends_count, statuses_count, blue_verified, location, website and pinned_tweet_ids.',
    inputSchema: z.object({ screen_name: screenName }),
    call: (client, input) => client.x.user(input),
  }),
  defineScavioTool({
    key: 'scavioXUserTweets',
    id: 'scavio-x-user-tweets',
    platform: 'x',
    endpoint: '/api/v1/x/user/tweets',
    credits: 1,
    description:
      "Fetch an account's X timeline via Scavio (1 credit). Returns data.timeline, data.pinned and the full data.user profile. There is no has_more here - page until next_cursor is null.",
    inputSchema: z.object({ screen_name: screenName, cursor }),
    call: (client, input) => client.x.userTweets(input),
  }),
  defineScavioTool({
    key: 'scavioXUserReplies',
    id: 'scavio-x-user-replies',
    platform: 'x',
    endpoint: '/api/v1/x/user/replies',
    credits: 1,
    description:
      "Fetch the posts an X account has replied to via Scavio (1 credit). Returns data.timeline and data.user. Use this rather than the timeline tool when you want conversational activity.",
    inputSchema: z.object({ screen_name: screenName, cursor }),
    call: (client, input) => client.x.userReplies(input),
  }),
  defineScavioTool({
    key: 'scavioXUserMedia',
    id: 'scavio-x-user-media',
    platform: 'x',
    endpoint: '/api/v1/x/user/media',
    credits: 1,
    description:
      "Fetch an X account's media posts via Scavio (1 credit). Returns data.timeline restricted to posts with photos or video; each tweet's media object carries direct photo urls and the highest-bitrate mp4 for videos.",
    inputSchema: z.object({ screen_name: screenName, cursor }),
    call: (client, input) => client.x.userMedia(input),
  }),
  defineScavioTool({
    key: 'scavioXUserFollowers',
    id: 'scavio-x-user-followers',
    platform: 'x',
    endpoint: '/api/v1/x/user/followers',
    credits: 1,
    description:
      "List an X account's followers via Scavio (1 credit). Returns data.followers_count and data.followers, plus data.next_cursor. Each page costs another credit, so cap how deep you page.",
    inputSchema: z.object({ screen_name: screenName, cursor }),
    call: (client, input) => client.x.userFollowers(input),
  }),
  defineScavioTool({
    key: 'scavioXUserFollowings',
    id: 'scavio-x-user-followings',
    platform: 'x',
    endpoint: '/api/v1/x/user/followings',
    credits: 1,
    description:
      'List the accounts an X user follows via Scavio (1 credit). The array is data.following (singular), and there is no following_count counterpart to followers_count.',
    inputSchema: z.object({ screen_name: screenName, cursor }),
    call: (client, input) => client.x.userFollowings(input),
  }),
  defineScavioTool({
    key: 'scavioXTrending',
    id: 'scavio-x-trending',
    platform: 'x',
    endpoint: '/api/v1/x/trending',
    credits: 1,
    description:
      'List what is trending on X for one country via Scavio (1 credit). Returns data.trends with name, description and context. country is a country NAME such as "UnitedStates" or "UnitedKingdom", not an ISO code; it defaults to UnitedStates.',
    inputSchema: z.object({
      country: z
        .string()
        .optional()
        .describe("Country NAME, e.g. 'UnitedStates'. Not a 2-letter code."),
    }),
    call: (client, input) => client.x.trending(input),
  }),
];

export const createScavioXSearchTool = toolFactory(xToolSpecs, 'scavioXSearch');
export const createScavioXTweetTool = toolFactory(xToolSpecs, 'scavioXTweet');
export const createScavioXTweetCommentsTool = toolFactory(xToolSpecs, 'scavioXTweetComments');
export const createScavioXTweetRetweetersTool = toolFactory(xToolSpecs, 'scavioXTweetRetweeters');
export const createScavioXUserTool = toolFactory(xToolSpecs, 'scavioXUser');
export const createScavioXUserTweetsTool = toolFactory(xToolSpecs, 'scavioXUserTweets');
export const createScavioXUserRepliesTool = toolFactory(xToolSpecs, 'scavioXUserReplies');
export const createScavioXUserMediaTool = toolFactory(xToolSpecs, 'scavioXUserMedia');
export const createScavioXUserFollowersTool = toolFactory(xToolSpecs, 'scavioXUserFollowers');
export const createScavioXUserFollowingsTool = toolFactory(xToolSpecs, 'scavioXUserFollowings');
export const createScavioXTrendingTool = toolFactory(xToolSpecs, 'scavioXTrending');
