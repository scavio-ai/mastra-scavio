import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Reddit - 12 endpoints, 1 credit each.
//
// Wire quirks worth knowing before reading a response:
// - /reddit/search takes ONLY query and cursor. There is no sort or type filter
//   upstream, so none is offered: a control that is silently dropped is worse
//   than no control.
// - search answers with data.results; the subreddit, user and popular feeds
//   answer with data.posts. They are not the same key.
// - /reddit/post is a FLAT post object under data with NO comments - only a
//   num_comments count. Comments are a separate call.
// - two different comment shapes: /post/comments items carry depth and
//   reply_cursor, /user/comments items carry a nested post and neither.
// - /post/comments/replies is the one endpoint where cursor is REQUIRED, and it
//   must be a reply_cursor lifted from a comment, not a next_cursor.
// - sort values are UPPERCASE. Only /subreddit/posts accepts RISING.

const cursor = z
  .string()
  .optional()
  .describe('Opaque pagination cursor: the next_cursor from a prior response.');
const sort = z
  .enum(['HOT', 'NEW', 'TOP', 'BEST', 'CONTROVERSIAL'])
  .optional()
  .describe('Sort order, UPPERCASE. RISING is not accepted here.');
const postId = z.string().describe("Post fullname ('t3_...') or bare id, e.g. 't3_1v6ngaf'.");
const subredditName = z.string().describe("Subreddit name WITHOUT the r/ prefix, e.g. 'AskReddit'.");
const username = z.string().describe("Redditor username WITHOUT the u/ prefix, e.g. 'spez'.");

export const redditToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioRedditSearch',
    id: 'scavio-reddit-search',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/search',
    credits: 1,
    description:
      'Search Reddit posts via Scavio (1 credit). Returns data.results (not data.posts) with title, text, subreddit, author, score, upvote_ratio and num_comments, plus data.next_cursor and data.has_more. Results cannot be sorted or filtered by type - this endpoint takes nothing but the query and a cursor.',
    inputSchema: z.object({
      query: z.string().describe('The search query (1-500 characters).'),
      cursor,
    }),
    call: (client, input) => client.reddit.search(input),
  }),
  defineScavioTool({
    key: 'scavioRedditSearchSuggestions',
    id: 'scavio-reddit-search-suggestions',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/search/suggestions',
    credits: 1,
    description:
      'Expand a partial Reddit query into related queries via Scavio (1 credit). Returns data.suggestions as bare strings with data.total_count. No volume or ranking exists upstream, so none is reported.',
    inputSchema: z.object({
      query: z.string().describe('Partial query to expand (1-500 characters).'),
    }),
    call: (client, input) => client.reddit.searchSuggestions(input),
  }),
  defineScavioTool({
    key: 'scavioRedditPost',
    id: 'scavio-reddit-post',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/post',
    credits: 1,
    description:
      'Fetch one Reddit post by id or URL via Scavio (1 credit). data is a FLAT post object (title, text, url, subreddit, author, score, upvote_ratio, num_comments, media) - it carries no comments, only the num_comments count. Use scavio-reddit-post-comments for the thread. Provide post_id or url.',
    inputSchema: z.object({
      post_id: postId.optional(),
      url: z.string().optional().describe('Full Reddit post URL, as an alternative to post_id.'),
    }),
    call: (client, input) => client.reddit.post(input),
  }),
  defineScavioTool({
    key: 'scavioRedditPostComments',
    id: 'scavio-reddit-post-comments',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/post/comments',
    credits: 1,
    description:
      "Fetch the top-level comments on a Reddit post via Scavio (1 credit). Returns data.comments with comment_id, text, author, score, depth and reply_cursor, plus data.next_cursor. A comment's reply_cursor is what scavio-reddit-comment-replies needs - collapsed replies are not included here.",
    inputSchema: z.object({ post_id: postId, sort, cursor }),
    call: (client, input) => client.reddit.postComments(input),
  }),
  defineScavioTool({
    key: 'scavioRedditCommentReplies',
    id: 'scavio-reddit-comment-replies',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/post/comments/replies',
    credits: 1,
    description:
      'Expand one collapsed Reddit comment thread via Scavio (1 credit). Returns data.replies in the same comment shape. cursor is REQUIRED here and must be a reply_cursor taken from a comment returned by scavio-reddit-post-comments, not a next_cursor.',
    inputSchema: z.object({
      post_id: postId,
      cursor: z
        .string()
        .describe('Required: the reply_cursor of the comment to expand, from the comments tool.'),
      sort,
    }),
    call: (client, input) => client.reddit.commentReplies(input),
  }),
  defineScavioTool({
    key: 'scavioRedditSubreddit',
    id: 'scavio-reddit-subreddit',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/subreddit',
    credits: 1,
    description:
      'Fetch a subreddit profile via Scavio (1 credit). data is flat: name, title, public_description, subscribers, active_count, type, is_nsfw, icon, banner and created_at. Use this to size a community before paging its feed.',
    inputSchema: z.object({ subreddit: subredditName }),
    call: (client, input) => client.reddit.subreddit(input),
  }),
  defineScavioTool({
    key: 'scavioRedditSubredditPosts',
    id: 'scavio-reddit-subreddit-posts',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/subreddit/posts',
    credits: 1,
    description:
      "Fetch a subreddit's post feed via Scavio (1 credit). Returns data.posts with data.next_cursor. This is the only Reddit tool that accepts RISING. Feed items are lighter than search results - no text and no thumbnail - so fetch the post itself when you need the body.",
    inputSchema: z.object({
      subreddit: subredditName,
      sort: z
        .enum(['BEST', 'HOT', 'NEW', 'TOP', 'CONTROVERSIAL', 'RISING'])
        .optional()
        .describe('Feed sort order, UPPERCASE. Defaults to HOT. RISING works only here.'),
      cursor,
    }),
    call: (client, input) => client.reddit.subredditPosts(input),
  }),
  defineScavioTool({
    key: 'scavioRedditUser',
    id: 'scavio-reddit-user',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/user',
    credits: 1,
    description:
      'Fetch a Redditor profile via Scavio (1 credit). data is flat: name, karma, post_karma, comment_karma, description, is_employee, is_verified, avatar and created_at.',
    inputSchema: z.object({ username }),
    call: (client, input) => client.reddit.user(input),
  }),
  defineScavioTool({
    key: 'scavioRedditUserPosts',
    id: 'scavio-reddit-user-posts',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/user/posts',
    credits: 1,
    description:
      "Fetch a Redditor's submitted posts via Scavio (1 credit). Returns data.posts with title, subreddit, score, num_comments and url, plus data.next_cursor. Defaults to NEW. Each page costs another credit.",
    inputSchema: z.object({ username, sort, cursor }),
    call: (client, input) => client.reddit.userPosts(input),
  }),
  defineScavioTool({
    key: 'scavioRedditUserComments',
    id: 'scavio-reddit-user-comments',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/user/comments',
    credits: 1,
    description:
      "Fetch a Redditor's comment history via Scavio (1 credit). Returns data.comments where each item carries a nested post {id, title} and no depth or reply_cursor - a different shape from the post-comments tool. Defaults to NEW.",
    inputSchema: z.object({ username, sort, cursor }),
    call: (client, input) => client.reddit.userComments(input),
  }),
  defineScavioTool({
    key: 'scavioRedditPopular',
    id: 'scavio-reddit-popular',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/popular',
    credits: 1,
    description:
      'Fetch the site-wide r/popular feed via Scavio (1 credit). Returns data.posts with data.next_cursor. cursor is the only input - there is no sort and no subreddit filter.',
    inputSchema: z.object({ cursor }),
    call: (client, input) => client.reddit.popular(input),
  }),
  defineScavioTool({
    key: 'scavioRedditTrending',
    id: 'scavio-reddit-trending',
    platform: 'reddit',
    endpoint: '/api/v1/reddit/trending',
    credits: 1,
    description:
      'Fetch what is trending on Reddit right now via Scavio (1 credit). Returns data.trending as {query, raw_query} pairs with data.total_count. Takes no parameters, and the list is site-wide - it cannot be scoped to a subreddit.',
    inputSchema: z.object({}),
    call: client => client.reddit.trending(),
  }),
];

export const createScavioRedditSearchTool = toolFactory(redditToolSpecs, 'scavioRedditSearch');
export const createScavioRedditSearchSuggestionsTool = toolFactory(
  redditToolSpecs,
  'scavioRedditSearchSuggestions',
);
export const createScavioRedditPostTool = toolFactory(redditToolSpecs, 'scavioRedditPost');
export const createScavioRedditPostCommentsTool = toolFactory(
  redditToolSpecs,
  'scavioRedditPostComments',
);
export const createScavioRedditCommentRepliesTool = toolFactory(
  redditToolSpecs,
  'scavioRedditCommentReplies',
);
export const createScavioRedditSubredditTool = toolFactory(redditToolSpecs, 'scavioRedditSubreddit');
export const createScavioRedditSubredditPostsTool = toolFactory(
  redditToolSpecs,
  'scavioRedditSubredditPosts',
);
export const createScavioRedditUserTool = toolFactory(redditToolSpecs, 'scavioRedditUser');
export const createScavioRedditUserPostsTool = toolFactory(redditToolSpecs, 'scavioRedditUserPosts');
export const createScavioRedditUserCommentsTool = toolFactory(
  redditToolSpecs,
  'scavioRedditUserComments',
);
export const createScavioRedditPopularTool = toolFactory(redditToolSpecs, 'scavioRedditPopular');
export const createScavioRedditTrendingTool = toolFactory(redditToolSpecs, 'scavioRedditTrending');
