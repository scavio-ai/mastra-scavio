import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGoogleSearch = vi.fn();
const mockAmazonProduct = vi.fn();
const mockRedditSearch = vi.fn();
const mockRedditPost = vi.fn();
const mockRedditSubredditPosts = vi.fn();
const mockRedditCommentReplies = vi.fn();
const mockRedditTrending = vi.fn();
const mockTiktokSearchVideos = vi.fn();
const mockTiktokUserPosts = vi.fn();
const mockTiktokHashtagVideos = vi.fn();
const mockTiktokUserFollowers = vi.fn();
const mockInstagramSearchUsers = vi.fn();
const mockInstagramPostComments = vi.fn();
const mockInstagramCommentReplies = vi.fn();
const mockInstagramUserPosts = vi.fn();
const mockYoutubeChannelResolve = vi.fn();
const mockYoutubeTranscript = vi.fn();
const mockXSearch = vi.fn();
const mockXTrending = vi.fn();
const mockXUserFollowings = vi.fn();
const mockLinkedinSearchJobs = vi.fn();
const mockLinkedinPostComments = vi.fn();
const mockTiktokShopSearch = vi.fn();
const mockTiktokShopCategories = vi.fn();

vi.mock('scavio', () => ({
  Scavio: vi.fn(() => ({
    google: { search: mockGoogleSearch },
    amazon: { search: vi.fn(), product: mockAmazonProduct, offers: vi.fn() },
    walmart: { search: vi.fn(), product: vi.fn() },
    youtube: {
      search: vi.fn(),
      shorts: vi.fn(),
      suggestions: vi.fn(),
      video: vi.fn(),
      comments: vi.fn(),
      commentReplies: vi.fn(),
      transcript: mockYoutubeTranscript,
      related: vi.fn(),
      channelSearch: vi.fn(),
      channel: vi.fn(),
      channelVideos: vi.fn(),
      channelShorts: vi.fn(),
      channelCommunity: vi.fn(),
      channelResolve: mockYoutubeChannelResolve,
      streams: vi.fn(),
    },
    reddit: {
      search: mockRedditSearch,
      searchSuggestions: vi.fn(),
      post: mockRedditPost,
      postComments: vi.fn(),
      commentReplies: mockRedditCommentReplies,
      subreddit: vi.fn(),
      subredditPosts: mockRedditSubredditPosts,
      user: vi.fn(),
      userPosts: vi.fn(),
      userComments: vi.fn(),
      popular: vi.fn(),
      trending: mockRedditTrending,
    },
    tiktok: {
      profile: vi.fn(),
      userPosts: mockTiktokUserPosts,
      video: vi.fn(),
      videoComments: vi.fn(),
      commentReplies: vi.fn(),
      searchVideos: mockTiktokSearchVideos,
      searchUsers: vi.fn(),
      hashtag: vi.fn(),
      hashtagVideos: mockTiktokHashtagVideos,
      userFollowers: mockTiktokUserFollowers,
      userFollowings: vi.fn(),
    },
    tiktokShop: {
      search: mockTiktokShopSearch,
      searchSuggestions: vi.fn(),
      product: vi.fn(),
      productReviews: vi.fn(),
      categories: mockTiktokShopCategories,
      categoryProducts: vi.fn(),
      shopProducts: vi.fn(),
      resolve: vi.fn(),
    },
    instagram: {
      profile: vi.fn(),
      userPosts: mockInstagramUserPosts,
      userReels: vi.fn(),
      userTagged: vi.fn(),
      userStories: vi.fn(),
      post: vi.fn(),
      postComments: mockInstagramPostComments,
      commentReplies: mockInstagramCommentReplies,
      searchUsers: mockInstagramSearchUsers,
      searchHashtags: vi.fn(),
      userFollowers: vi.fn(),
      userFollowings: vi.fn(),
    },
    x: {
      search: mockXSearch,
      tweet: vi.fn(),
      tweetComments: vi.fn(),
      tweetRetweeters: vi.fn(),
      user: vi.fn(),
      userTweets: vi.fn(),
      userReplies: vi.fn(),
      userMedia: vi.fn(),
      userFollowers: vi.fn(),
      userFollowings: mockXUserFollowings,
      trending: mockXTrending,
    },
    linkedin: {
      person: vi.fn(),
      personAbout: vi.fn(),
      personPosts: vi.fn(),
      company: vi.fn(),
      companyPosts: vi.fn(),
      searchJobs: mockLinkedinSearchJobs,
      job: vi.fn(),
      post: vi.fn(),
      postComments: mockLinkedinPostComments,
    },
  })),
}));

import { createScavioGoogleSearchTool, googleToolSpecs } from '../google.js';
import { instagramToolSpecs } from '../instagram.js';
import { linkedinToolSpecs } from '../linkedin.js';
import {
  createScavioRedditPostTool,
  createScavioRedditSearchTool,
  redditToolSpecs,
} from '../reddit.js';
import { tiktokShopToolSpecs } from '../tiktok-shop.js';
import { tiktokToolSpecs } from '../tiktok.js';
import { createScavioTools } from '../tools.js';
import { xToolSpecs } from '../x.js';
import {
  createScavioYoutubeChannelResolveTool,
  createScavioYoutubeTranscriptTool,
  youtubeToolSpecs,
} from '../youtube.js';
import type { AnyScavioToolSpec } from '../tool.js';

const allSpecs: AnyScavioToolSpec[] = [
  ...googleToolSpecs,
  ...youtubeToolSpecs,
  ...redditToolSpecs,
  ...tiktokToolSpecs,
  ...tiktokShopToolSpecs,
  ...instagramToolSpecs,
  ...xToolSpecs,
  ...linkedinToolSpecs,
];

describe('createScavioTools', () => {
  it('returns all Scavio tools keyed by name', () => {
    const tools = createScavioTools({ apiKey: 'test-key' });
    expect(Object.keys(tools)).toEqual([
      'scavioGoogleSearch',
      'scavioGoogleAiMode',
      'scavioGoogleMapsSearch',
      'scavioGoogleMapsPlace',
      'scavioGoogleMapsReviews',
      'scavioGoogleShopping',
      'scavioGoogleShoppingProduct',
      'scavioGoogleShoppingStores',
      'scavioGoogleFlights',
      'scavioGoogleHotels',
      'scavioGoogleHotelsDetail',
      'scavioGoogleNews',
      'scavioGoogleTrends',
      'scavioGoogleTrending',
      'scavioAmazonSearch',
      'scavioAmazonProduct',
      'scavioAmazonOffers',
      'scavioWalmartSearch',
      'scavioWalmartProduct',
      'scavioYoutubeSearch',
      'scavioYoutubeShorts',
      'scavioYoutubeSuggestions',
      'scavioYoutubeVideo',
      'scavioYoutubeComments',
      'scavioYoutubeCommentReplies',
      'scavioYoutubeTranscript',
      'scavioYoutubeRelated',
      'scavioYoutubeChannelSearch',
      'scavioYoutubeChannel',
      'scavioYoutubeChannelVideos',
      'scavioYoutubeChannelShorts',
      'scavioYoutubeChannelCommunity',
      'scavioYoutubeChannelResolve',
      'scavioYoutubeStreams',
      'scavioRedditSearch',
      'scavioRedditSearchSuggestions',
      'scavioRedditPost',
      'scavioRedditPostComments',
      'scavioRedditCommentReplies',
      'scavioRedditSubreddit',
      'scavioRedditSubredditPosts',
      'scavioRedditUser',
      'scavioRedditUserPosts',
      'scavioRedditUserComments',
      'scavioRedditPopular',
      'scavioRedditTrending',
      'scavioTiktokProfile',
      'scavioTiktokUserPosts',
      'scavioTiktokVideo',
      'scavioTiktokVideoComments',
      'scavioTiktokCommentReplies',
      'scavioTiktokSearchVideos',
      'scavioTiktokSearchUsers',
      'scavioTiktokHashtag',
      'scavioTiktokHashtagVideos',
      'scavioTiktokUserFollowers',
      'scavioTiktokUserFollowings',
      'scavioTiktokShopSearch',
      'scavioTiktokShopSearchSuggestions',
      'scavioTiktokShopProduct',
      'scavioTiktokShopProductReviews',
      'scavioTiktokShopCategories',
      'scavioTiktokShopCategoryProducts',
      'scavioTiktokShopShopProducts',
      'scavioTiktokShopResolve',
      'scavioInstagramProfile',
      'scavioInstagramUserPosts',
      'scavioInstagramUserReels',
      'scavioInstagramUserTagged',
      'scavioInstagramUserStories',
      'scavioInstagramPost',
      'scavioInstagramPostComments',
      'scavioInstagramCommentReplies',
      'scavioInstagramSearchUsers',
      'scavioInstagramSearchHashtags',
      'scavioInstagramUserFollowers',
      'scavioInstagramUserFollowings',
      'scavioXSearch',
      'scavioXTweet',
      'scavioXTweetComments',
      'scavioXTweetRetweeters',
      'scavioXUser',
      'scavioXUserTweets',
      'scavioXUserReplies',
      'scavioXUserMedia',
      'scavioXUserFollowers',
      'scavioXUserFollowings',
      'scavioXTrending',
      'scavioLinkedinPerson',
      'scavioLinkedinPersonAbout',
      'scavioLinkedinPersonPosts',
      'scavioLinkedinCompany',
      'scavioLinkedinCompanyPosts',
      'scavioLinkedinSearchJobs',
      'scavioLinkedinJob',
      'scavioLinkedinPost',
      'scavioLinkedinPostComments',
    ]);
    expect(tools.scavioGoogleSearch.id).toBe('scavio-google-search');
  });

  // One tool per billable endpoint: 97 of them, the same number the repo-wide
  // coverage guard counts. Reddit, TikTok and Instagram shipped 2 tools each
  // until 0.5.0 - a wrapper is only "complete" against this number.
  it('exposes 97 tools, one per billable endpoint', () => {
    expect(Object.keys(createScavioTools({ apiKey: 'test-key' }))).toHaveLength(97);
  });

  // A spec that exists but is never registered ships unreachable - which is
  // exactly what happened to 13 of the 14 Google specs before 0.4.0. This is the
  // guard: every declared spec must come back out of createScavioTools().
  it('registers every declared spec - no spec is left unreachable', () => {
    const registered = new Set(Object.keys(createScavioTools({ apiKey: 'test-key' })));
    const unreachable = allSpecs.filter(spec => !registered.has(spec.key));
    expect(unreachable.map(spec => spec.key)).toEqual([]);
  });

  it('gives every tool a unique id and a cost-bearing description', () => {
    const tools = createScavioTools({ apiKey: 'test-key' });
    const ids = Object.values(tools).map(tool => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const spec of allSpecs) {
      expect(spec.description).toContain(`${spec.credits} credit`);
    }
  });
});

describe('endpoint coverage', () => {
  const endpointsFor = (specs: AnyScavioToolSpec[]) => specs.map(spec => spec.endpoint).sort();

  it('covers all 14 Google v2 endpoints', () => {
    expect(googleToolSpecs).toHaveLength(14);
    expect(endpointsFor(googleToolSpecs)).toEqual(
      [
        '/api/v2/google',
        '/api/v2/google/ai-mode',
        '/api/v2/google/maps/search',
        '/api/v2/google/maps/place',
        '/api/v2/google/maps/reviews',
        '/api/v2/google/shopping',
        '/api/v2/google/shopping/product',
        '/api/v2/google/shopping/product/stores',
        '/api/v2/google/flights',
        '/api/v2/google/hotels',
        '/api/v2/google/hotels/detail',
        '/api/v2/google/news',
        '/api/v2/google/trends',
        '/api/v2/google/trending',
      ].sort(),
    );
    // /api/v1/google was retired 2026-08-04 and answers 410.
    expect(endpointsFor(googleToolSpecs)).not.toContain('/api/v1/google');
  });

  it('covers every live YouTube endpoint and skips the deprecated metadata alias', () => {
    expect(youtubeToolSpecs).toHaveLength(15);
    expect(endpointsFor(youtubeToolSpecs)).toEqual(
      [
        '/api/v1/youtube/search',
        '/api/v1/youtube/shorts',
        '/api/v1/youtube/suggestions',
        '/api/v1/youtube/video',
        '/api/v1/youtube/comments',
        '/api/v1/youtube/comments/replies',
        '/api/v1/youtube/transcript',
        '/api/v1/youtube/related',
        '/api/v1/youtube/channel/search',
        '/api/v1/youtube/channel',
        '/api/v1/youtube/channel/videos',
        '/api/v1/youtube/channel/shorts',
        '/api/v1/youtube/channel/community',
        '/api/v1/youtube/channel/resolve',
        '/api/v1/youtube/streams',
      ].sort(),
    );
    // /youtube/metadata is a byte-identical alias of /youtube/video.
    expect(endpointsFor(youtubeToolSpecs)).not.toContain('/api/v1/youtube/metadata');
  });

  it('covers all 12 Reddit endpoints', () => {
    expect(redditToolSpecs).toHaveLength(12);
    expect(endpointsFor(redditToolSpecs)).toEqual(
      [
        '/api/v1/reddit/search',
        '/api/v1/reddit/search/suggestions',
        '/api/v1/reddit/post',
        '/api/v1/reddit/post/comments',
        '/api/v1/reddit/post/comments/replies',
        '/api/v1/reddit/subreddit',
        '/api/v1/reddit/subreddit/posts',
        '/api/v1/reddit/user',
        '/api/v1/reddit/user/posts',
        '/api/v1/reddit/user/comments',
        '/api/v1/reddit/popular',
        '/api/v1/reddit/trending',
      ].sort(),
    );
  });

  it('covers all 11 TikTok endpoints', () => {
    expect(tiktokToolSpecs).toHaveLength(11);
    expect(endpointsFor(tiktokToolSpecs)).toEqual(
      [
        '/api/v1/tiktok/profile',
        '/api/v1/tiktok/user/posts',
        '/api/v1/tiktok/video',
        '/api/v1/tiktok/video/comments',
        '/api/v1/tiktok/video/comments/replies',
        '/api/v1/tiktok/search/videos',
        '/api/v1/tiktok/search/users',
        '/api/v1/tiktok/hashtag',
        '/api/v1/tiktok/hashtag/videos',
        '/api/v1/tiktok/user/followers',
        '/api/v1/tiktok/user/followings',
      ].sort(),
    );
  });

  it('covers all 12 Instagram endpoints', () => {
    expect(instagramToolSpecs).toHaveLength(12);
    expect(endpointsFor(instagramToolSpecs)).toEqual(
      [
        '/api/v1/instagram/profile',
        '/api/v1/instagram/user/posts',
        '/api/v1/instagram/user/reels',
        '/api/v1/instagram/user/tagged',
        '/api/v1/instagram/user/stories',
        '/api/v1/instagram/post',
        '/api/v1/instagram/post/comments',
        '/api/v1/instagram/post/comments/replies',
        '/api/v1/instagram/search/users',
        '/api/v1/instagram/search/hashtags',
        '/api/v1/instagram/user/followers',
        '/api/v1/instagram/user/followings',
      ].sort(),
    );
  });

  it('covers all 11 X endpoints', () => {
    expect(xToolSpecs).toHaveLength(11);
    expect(endpointsFor(xToolSpecs)).toEqual(
      [
        '/api/v1/x/search',
        '/api/v1/x/tweet',
        '/api/v1/x/tweet/comments',
        '/api/v1/x/tweet/retweeters',
        '/api/v1/x/user',
        '/api/v1/x/user/tweets',
        '/api/v1/x/user/replies',
        '/api/v1/x/user/media',
        '/api/v1/x/user/followers',
        '/api/v1/x/user/followings',
        '/api/v1/x/trending',
      ].sort(),
    );
  });

  it('covers all 8 TikTok Shop endpoints', () => {
    expect(tiktokShopToolSpecs).toHaveLength(8);
    expect(endpointsFor(tiktokShopToolSpecs)).toEqual(
      [
        '/api/v1/tiktok-shop/search',
        '/api/v1/tiktok-shop/search/suggestions',
        '/api/v1/tiktok-shop/product',
        '/api/v1/tiktok-shop/product/reviews',
        '/api/v1/tiktok-shop/categories',
        '/api/v1/tiktok-shop/category/products',
        '/api/v1/tiktok-shop/shop/products',
        '/api/v1/tiktok-shop/resolve',
      ].sort(),
    );
  });

  it('covers the 9 live LinkedIn endpoints and none of the 5 retired ones', () => {
    expect(linkedinToolSpecs).toHaveLength(9);
    expect(endpointsFor(linkedinToolSpecs)).toEqual(
      [
        '/api/v1/linkedin/person',
        '/api/v1/linkedin/person/about',
        '/api/v1/linkedin/person/posts',
        '/api/v1/linkedin/company',
        '/api/v1/linkedin/company/posts',
        '/api/v1/linkedin/search/jobs',
        '/api/v1/linkedin/job',
        '/api/v1/linkedin/post',
        '/api/v1/linkedin/post/comments',
      ].sort(),
    );
    // These five answer 410 unbilled. A tool that can only fail is worse than none.
    for (const retired of [
      '/api/v1/linkedin/person/contact',
      '/api/v1/linkedin/company/people',
      '/api/v1/linkedin/company/jobs',
      '/api/v1/linkedin/search/people',
      '/api/v1/linkedin/search/posts',
    ]) {
      expect(endpointsFor(linkedinToolSpecs)).not.toContain(retired);
    }
  });
});

describe('credit costs', () => {
  const creditsByEndpoint = Object.fromEntries(
    allSpecs.map(spec => [spec.endpoint, spec.credits]),
  );

  it('prices the YouTube endpoints that are not 1 credit', () => {
    expect(creditsByEndpoint['/api/v1/youtube/search']).toBe(2);
    expect(creditsByEndpoint['/api/v1/youtube/shorts']).toBe(2);
    expect(creditsByEndpoint['/api/v1/youtube/streams']).toBe(3);
    expect(creditsByEndpoint['/api/v1/youtube/transcript']).toBe(8);
    expect(creditsByEndpoint['/api/v1/youtube/video']).toBe(1);
    expect(creditsByEndpoint['/api/v1/youtube/suggestions']).toBe(1);
  });

  it('prices LinkedIn on its three tiers, with job at 30', () => {
    expect(creditsByEndpoint['/api/v1/linkedin/person']).toBe(1);
    expect(creditsByEndpoint['/api/v1/linkedin/person/about']).toBe(1);
    expect(creditsByEndpoint['/api/v1/linkedin/company']).toBe(1);
    expect(creditsByEndpoint['/api/v1/linkedin/post']).toBe(1);
    expect(creditsByEndpoint['/api/v1/linkedin/person/posts']).toBe(10);
    expect(creditsByEndpoint['/api/v1/linkedin/company/posts']).toBe(10);
    expect(creditsByEndpoint['/api/v1/linkedin/search/jobs']).toBe(10);
    expect(creditsByEndpoint['/api/v1/linkedin/post/comments']).toBe(10);
    expect(creditsByEndpoint['/api/v1/linkedin/job']).toBe(30);
  });

  // Instagram is per-endpoint, never flat: 10 where both upstream legs are
  // billed, 8 where there is no fallback leg to hedge, 2 for user posts.
  it('prices Instagram on its three tiers, never flat', () => {
    expect(creditsByEndpoint['/api/v1/instagram/user/posts']).toBe(2);
    expect(creditsByEndpoint['/api/v1/instagram/post']).toBe(8);
    expect(creditsByEndpoint['/api/v1/instagram/post/comments/replies']).toBe(8);
    for (const tenCredit of [
      '/api/v1/instagram/profile',
      '/api/v1/instagram/user/reels',
      '/api/v1/instagram/user/tagged',
      '/api/v1/instagram/user/stories',
      '/api/v1/instagram/post/comments',
      '/api/v1/instagram/search/users',
      '/api/v1/instagram/search/hashtags',
      '/api/v1/instagram/user/followers',
      '/api/v1/instagram/user/followings',
    ]) {
      expect(creditsByEndpoint[tenCredit]).toBe(10);
    }
    expect(new Set(instagramToolSpecs.map(spec => spec.credits))).toEqual(new Set([2, 8, 10]));
  });

  it('prices Google v2, Reddit, TikTok, TikTok Shop and X flat at 1 credit', () => {
    for (const specs of [
      googleToolSpecs,
      redditToolSpecs,
      tiktokToolSpecs,
      xToolSpecs,
      tiktokShopToolSpecs,
    ]) {
      expect(specs.every(spec => spec.credits === 1)).toBe(true);
    }
  });
});

describe('createScavioGoogleSearchTool', () => {
  const response = {
    organic_results: [
      { title: 'r1', link: 'https://example.com', snippet: 'first result' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGoogleSearch.mockResolvedValue(response);
  });

  it('has the correct id, description, and schemas', () => {
    const tool = createScavioGoogleSearchTool({ apiKey: 'test-key' });
    expect(tool.id).toBe('scavio-google-search');
    expect(tool.description!.length).toBeGreaterThan(0);
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
  });

  // /api/v1/google was retired 2026-08-04. v2 params are exposed natively rather
  // than mapped from the v1 names: start is a 0-based result offset, not a
  // 1-based page, so a silent remap of `page` would fetch the wrong page.
  it('sends v2 params natively and returns organic_results', async () => {
    const tool = createScavioGoogleSearchTool({ apiKey: 'test-key' });
    const result = await tool.execute!(
      { query: 'pydantic ai', gl: 'us', hl: 'en', start: 10, device: 'mobile', nfpr: true },
      {} as any,
    );
    expect(mockGoogleSearch).toHaveBeenCalledWith({
      query: 'pydantic ai',
      gl: 'us',
      hl: 'en',
      start: 10,
      device: 'mobile',
      nfpr: true,
    });
    expect(result).toEqual(response);
    expect((result as any).organic_results[0]).toMatchObject({
      title: 'r1',
      link: 'https://example.com',
      snippet: 'first result',
    });
  });

  it('never sends v1 param names', async () => {
    const tool = createScavioGoogleSearchTool({ apiKey: 'test-key' });
    await tool.execute!({ query: 'q', gl: 'gb' }, {} as any);
    const sent = mockGoogleSearch.mock.calls[0][0];
    expect(sent).toEqual({ query: 'q', gl: 'gb' });
    expect(sent).not.toHaveProperty('page');
    expect(sent).not.toHaveProperty('language');
    expect(sent).not.toHaveProperty('country_code');
    expect(sent).not.toHaveProperty('search_type');
    expect(sent).not.toHaveProperty('light_request');
  });
});

describe('createScavioRedditSearchTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedditSearch.mockResolvedValue({
      data: { results: [{ post_id: 't3_1v6ngaf', title: 'p1' }], next_cursor: 'abc', has_more: true },
      response_time: 900,
      credits_used: 1,
      credits_remaining: 4999,
    });
  });

  // /reddit/search takes only query + cursor; the backend strips anything else,
  // so a sort/type control would be dead while looking like a working filter.
  it('sends query and cursor only, and returns data.results', async () => {
    const tool = createScavioRedditSearchTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ query: 'serpapi alternative', cursor: 'abc' }, {} as any);
    const sent = mockRedditSearch.mock.calls[0][0];
    expect(sent).toEqual({ query: 'serpapi alternative', cursor: 'abc' });
    expect(sent).not.toHaveProperty('sort');
    expect(sent).not.toHaveProperty('type');
    expect((result as any).data.results).toHaveLength(1);
    expect((result as any).data.next_cursor).toBe('abc');
    expect((result as any).credits_used).toBe(1);
  });
});

describe('createScavioRedditPostTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // /reddit/post returns a flat post object under data, with no comments.
    mockRedditPost.mockResolvedValue({
      data: { post_id: 't3_1v6ngaf', title: 'p1', text: 'body', subreddit: 'python', num_comments: 12 },
      response_time: 900,
      credits_used: 1,
      credits_remaining: 4998,
    });
  });

  it('accepts a post id or a url and returns the flat post object', async () => {
    const tool = createScavioRedditPostTool({ apiKey: 'test-key' });
    const result = await tool.execute!({ post_id: 't3_1v6ngaf' }, {} as any);
    expect(mockRedditPost).toHaveBeenCalledWith({ post_id: 't3_1v6ngaf' });
    expect((result as any).data.post_id).toBe('t3_1v6ngaf');
    expect((result as any).data).not.toHaveProperty('comments');
  });
});

describe('Reddit feed and thread tools', () => {
  const specFor = (key: string) => redditToolSpecs.find(spec => spec.key === key)!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Search answers with data.results; the feeds answer with data.posts. Reading
  // the wrong key is the most common Reddit mistake, so both are pinned here.
  it('subreddit posts returns data.posts and accepts RISING', async () => {
    mockRedditSubredditPosts.mockResolvedValue({
      data: { posts: [{ post_id: 't3_1' }], next_cursor: 't3_1', has_more: true },
      credits_used: 1,
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    const result = await tools.scavioRedditSubredditPosts.execute!(
      { subreddit: 'python', sort: 'RISING' },
      {} as any,
    );
    expect(mockRedditSubredditPosts).toHaveBeenCalledWith({ subreddit: 'python', sort: 'RISING' });
    expect((result as any).data.posts).toHaveLength(1);
    expect((result as any).data).not.toHaveProperty('results');
  });

  // RISING exists only on the subreddit feed - the comment/user sorts reject it.
  it('rejects RISING on the sorts that do not accept it', () => {
    expect(specFor('scavioRedditSubredditPosts').inputSchema.safeParse({
      subreddit: 'python',
      sort: 'RISING',
    }).success).toBe(true);
    expect(specFor('scavioRedditUserPosts').inputSchema.safeParse({
      username: 'spez',
      sort: 'RISING',
    }).success).toBe(false);
  });

  // cursor is optional everywhere else and REQUIRED here, and it has to be a
  // reply_cursor from a comment, not a next_cursor.
  it('comment replies requires a cursor', async () => {
    expect(specFor('scavioRedditCommentReplies').inputSchema.safeParse({ post_id: 't3_1' }).success).toBe(
      false,
    );
    mockRedditCommentReplies.mockResolvedValue({ data: { replies: [], has_more: false } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioRedditCommentReplies.execute!(
      { post_id: 't3_1v6ngaf', cursor: 'reply-cursor-1' },
      {} as any,
    );
    expect(mockRedditCommentReplies).toHaveBeenCalledWith({
      post_id: 't3_1v6ngaf',
      cursor: 'reply-cursor-1',
    });
  });

  it('trending takes no parameters', async () => {
    mockRedditTrending.mockResolvedValue({ data: { trending: [], total_count: 0 } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioRedditTrending.execute!({}, {} as any);
    expect(mockRedditTrending).toHaveBeenCalledWith();
  });
});

describe('TikTok tools', () => {
  const specFor = (key: string) => tiktokToolSpecs.find(spec => spec.key === key)!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The keyword field is `keyword`, and cursor is a STRING - a numeric cursor
  // is a 400 upstream, so the schema refuses it here rather than at the API.
  it('search sends `keyword` and a string cursor', async () => {
    mockTiktokSearchVideos.mockResolvedValue({
      data: { aweme_list: [{ aweme_id: '1' }], cursor: 20, has_more: true },
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioTiktokSearchVideos.execute!(
      { keyword: 'cooking recipe', cursor: '20', count: 30, sort_type: '1' },
      {} as any,
    );
    const sent = mockTiktokSearchVideos.mock.calls[0][0];
    expect(sent).toEqual({ keyword: 'cooking recipe', cursor: '20', count: 30, sort_type: '1' });
    expect(sent).not.toHaveProperty('query');
    expect(sent).not.toHaveProperty('search');
    expect(specFor('scavioTiktokSearchVideos').inputSchema.safeParse({
      keyword: 'k',
      cursor: 0,
    }).success).toBe(false);
  });

  // Only /profile takes a username. The account tools are sec_user_id-only, so
  // a handle must be resolved through profile first.
  it('account tools take sec_user_id, never a username', () => {
    for (const key of [
      'scavioTiktokUserPosts',
      'scavioTiktokUserFollowers',
      'scavioTiktokUserFollowings',
    ]) {
      const schema = specFor(key).inputSchema;
      expect(schema.safeParse({ username: 'tiktok' }).success).toBe(false);
      expect(schema.parse({ sec_user_id: 'MS4wLjAB', username: 'tiktok' })).not.toHaveProperty(
        'username',
      );
    }
    expect(specFor('scavioTiktokProfile').inputSchema.safeParse({ username: 'tiktok' }).success).toBe(
      true,
    );
  });

  it('user posts pages by max_cursor fed back as a string cursor', async () => {
    mockTiktokUserPosts.mockResolvedValue({
      data: { aweme_list: [], max_cursor: 1690000000000, has_more: true },
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioTiktokUserPosts.execute!(
      { sec_user_id: 'MS4wLjAB', cursor: '1690000000000' },
      {} as any,
    );
    expect(mockTiktokUserPosts).toHaveBeenCalledWith({
      sec_user_id: 'MS4wLjAB',
      cursor: '1690000000000',
    });
  });

  // /hashtag/videos takes an id only; the name has to go through /hashtag.
  it('hashtag videos takes hashtag_id, not hashtag_name', async () => {
    expect(specFor('scavioTiktokHashtagVideos').inputSchema.safeParse({
      hashtag_name: 'fyp',
    }).success).toBe(false);
    mockTiktokHashtagVideos.mockResolvedValue({ data: { aweme_list: [], has_more: false } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioTiktokHashtagVideos.execute!({ hashtag_id: '123456' }, {} as any);
    expect(mockTiktokHashtagVideos).toHaveBeenCalledWith({ hashtag_id: '123456' });
  });

  // Followers and followings are the one pair with no cursor at all.
  it('followers page with page_token and a numeric min_time, not a cursor', async () => {
    expect(specFor('scavioTiktokUserFollowers').inputSchema.parse({
      sec_user_id: 'MS4wLjAB',
      cursor: '0',
    })).not.toHaveProperty('cursor');
    mockTiktokUserFollowers.mockResolvedValue({
      data: { followers: [], next_page_token: 'p2', min_time: 1690000000, has_more: true },
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioTiktokUserFollowers.execute!(
      { sec_user_id: 'MS4wLjAB', count: 20, page_token: 'p1', min_time: 1690000000 },
      {} as any,
    );
    expect(mockTiktokUserFollowers).toHaveBeenCalledWith({
      sec_user_id: 'MS4wLjAB',
      count: 20,
      page_token: 'p1',
      min_time: 1690000000,
    });
  });
});

describe('Instagram tools', () => {
  const specFor = (key: string) => instagramToolSpecs.find(spec => spec.key === key)!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('search sends `keyword`, never `query`', async () => {
    mockInstagramSearchUsers.mockResolvedValue({
      data: { users: [{ pk: '1' }], rank_token: 'rt' },
      credits_used: 10,
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    const result = await tools.scavioInstagramSearchUsers.execute!(
      { keyword: 'fashion' },
      {} as any,
    );
    const sent = mockInstagramSearchUsers.mock.calls[0][0];
    expect(sent).toEqual({ keyword: 'fashion' });
    expect(sent).not.toHaveProperty('query');
    expect((result as any).credits_used).toBe(10);
  });

  // The three post tools take three different identifiers. Offering media_id on
  // post comments, or a shortcode on replies, would look like a working chain
  // and 400 every time.
  it('gives each post tool only the identifiers its endpoint accepts', () => {
    const post = specFor('scavioInstagramPost').inputSchema;
    expect(post.safeParse({ media_id: '385' }).success).toBe(true);
    expect(post.safeParse({ shortcode: 'DUajw4YkorV' }).success).toBe(true);

    const comments = specFor('scavioInstagramPostComments').inputSchema;
    expect(comments.parse({ shortcode: 'DUajw4YkorV', media_id: '385' })).not.toHaveProperty(
      'media_id',
    );

    const replies = specFor('scavioInstagramCommentReplies').inputSchema;
    expect(replies.safeParse({ shortcode: 'DUajw4YkorV' }).success).toBe(false);
    expect(replies.safeParse({ media_id: '385', comment_id: '180' }).success).toBe(true);
  });

  it('comment replies sends media_id and comment_id', async () => {
    mockInstagramCommentReplies.mockResolvedValue({ data: { child_comments: [], status: 'ok' } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioInstagramCommentReplies.execute!(
      { media_id: '3829530490739515971', comment_id: '18065937092249736' },
      {} as any,
    );
    expect(mockInstagramCommentReplies).toHaveBeenCalledWith({
      media_id: '3829530490739515971',
      comment_id: '18065937092249736',
    });
  });

  it('post comments passes sort_order through', async () => {
    mockInstagramPostComments.mockResolvedValue({
      data: { comments: [], has_more_comments: false, next_min_id: null },
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioInstagramPostComments.execute!(
      { shortcode: 'DUajw4YkorV', sort_order: 'newest' },
      {} as any,
    );
    expect(mockInstagramPostComments).toHaveBeenCalledWith({
      shortcode: 'DUajw4YkorV',
      sort_order: 'newest',
    });
  });

  // The cheap leg is primary here, so items arrive double-nested at data.data.
  it('user posts costs 2 credits and can answer at data.data', async () => {
    mockInstagramUserPosts.mockResolvedValue({
      data: { data: [{ id: '1' }], pagination_token: 'pt' },
      credits_used: 2,
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    const result = await tools.scavioInstagramUserPosts.execute!(
      { username: 'instagram', count: 12 },
      {} as any,
    );
    expect(mockInstagramUserPosts).toHaveBeenCalledWith({ username: 'instagram', count: 12 });
    expect((result as any).data.data).toHaveLength(1);
    expect((result as any).credits_used).toBe(2);
  });
});

describe('YouTube wire quirks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // /channel/resolve is the one channel endpoint whose field is `channel`.
  it('channel resolve sends `channel`, not `channel_id`', async () => {
    mockYoutubeChannelResolve.mockResolvedValue({ data: { channel_id: 'UC123' } });
    const tool = createScavioYoutubeChannelResolveTool({ apiKey: 'test-key' });
    await tool.execute!({ channel: '@MrBeast' }, {} as any);
    const sent = mockYoutubeChannelResolve.mock.calls[0][0];
    expect(sent).toEqual({ channel: '@MrBeast' });
    expect(sent).not.toHaveProperty('channel_id');
  });

  it('transcript passes language and format straight through', async () => {
    mockYoutubeTranscript.mockResolvedValue({ data: { content: 'hello' } });
    const tool = createScavioYoutubeTranscriptTool({ apiKey: 'test-key' });
    await tool.execute!({ video_id: 'dQw4w9WgXcQ', language: 'en', format: 'srt' }, {} as any);
    expect(mockYoutubeTranscript).toHaveBeenCalledWith({
      video_id: 'dQw4w9WgXcQ',
      language: 'en',
      format: 'srt',
    });
  });
});

describe('X tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // /x/search takes a field literally named `search`. Accepting `query` and
  // remapping it would hide the quirk from every caller downstream.
  it('search sends `search`, never `query`', async () => {
    mockXSearch.mockResolvedValue({
      data: { timeline: [{ tweet_id: '1' }], next_cursor: 'c1', has_more: true },
      credits_used: 1,
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    const result = await tools.scavioXSearch.execute!(
      { search: 'scavio api', search_type: 'Latest', cursor: 'c0' },
      {} as any,
    );
    const sent = mockXSearch.mock.calls[0][0];
    expect(sent).toEqual({ search: 'scavio api', search_type: 'Latest', cursor: 'c0' });
    expect(sent).not.toHaveProperty('query');
    expect((result as any).data.timeline).toHaveLength(1);
  });

  it('trending sends a country name, not an ISO code', async () => {
    mockXTrending.mockResolvedValue({ data: { trends: [{ name: '#ai' }] } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioXTrending.execute!({ country: 'UnitedStates' }, {} as any);
    expect(mockXTrending).toHaveBeenCalledWith({ country: 'UnitedStates' });
  });

  it('followings answers with data.following, not data.followings', async () => {
    mockXUserFollowings.mockResolvedValue({
      data: { following: [{ user_id: '1' }], next_cursor: null, has_more: false },
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    const result = await tools.scavioXUserFollowings.execute!(
      { screen_name: 'elonmusk' },
      {} as any,
    );
    expect((result as any).data.following).toHaveLength(1);
    expect((result as any).data).not.toHaveProperty('followings');
  });
});

describe('LinkedIn tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // /linkedin/search/jobs takes `search`, not `query`/`keywords`.
  it('job search sends `search`, never `query`', async () => {
    mockLinkedinSearchJobs.mockResolvedValue({ data: { data: [], count: 0, has_more: false } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioLinkedinSearchJobs.execute!(
      { search: 'software engineer', location: 'Berlin' },
      {} as any,
    );
    const sent = mockLinkedinSearchJobs.mock.calls[0][0];
    expect(sent).toEqual({ search: 'software engineer', location: 'Berlin' });
    expect(sent).not.toHaveProperty('query');
    expect(sent).not.toHaveProperty('keywords');
  });

  // Post comments is the only LinkedIn endpoint paginating by an integer page.
  it('post comments sends an integer page, not a cursor', async () => {
    mockLinkedinPostComments.mockResolvedValue({ data: { data: [], page: 2, has_more: true } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioLinkedinPostComments.execute!(
      { post_id: '7488618410256523265', page: 2 },
      {} as any,
    );
    const sent = mockLinkedinPostComments.mock.calls[0][0];
    expect(sent).toEqual({ post_id: '7488618410256523265', page: 2 });
    expect(sent).not.toHaveProperty('cursor');
  });

  it('exposes no tool for the retired 410 endpoints', () => {
    const tools = createScavioTools({ apiKey: 'test-key' });
    for (const absent of [
      'scavioLinkedinPersonContact',
      'scavioLinkedinCompanyPeople',
      'scavioLinkedinCompanyJobs',
      'scavioLinkedinSearchPeople',
      'scavioLinkedinSearchPosts',
    ]) {
      expect(tools).not.toHaveProperty(absent);
    }
  });
});

describe('TikTok Shop tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // The keyword field is `search`; `query` only comes BACK, as an echo.
  it('search sends `search` and takes no region', async () => {
    mockTiktokShopSearch.mockResolvedValue({
      data: { query: 'phone case', products: [], next_cursor: null, has_more: false },
    });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioTiktokShopSearch.execute!({ search: 'phone case' }, {} as any);
    const sent = mockTiktokShopSearch.mock.calls[0][0];
    expect(sent).toEqual({ search: 'phone case' });
    expect(sent).not.toHaveProperty('query');
    expect(sent).not.toHaveProperty('region');
  });

  it('categories takes no parameters', async () => {
    mockTiktokShopCategories.mockResolvedValue({ data: { categories: [], total_categories: 240 } });
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioTiktokShopCategories.execute!({}, {} as any);
    expect(mockTiktokShopCategories).toHaveBeenCalledWith();
  });
});
