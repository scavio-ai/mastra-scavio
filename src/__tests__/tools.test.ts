import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGoogleSearch = vi.fn();
const mockAmazonProduct = vi.fn();
const mockRedditSearch = vi.fn();
const mockRedditPost = vi.fn();

vi.mock('scavio', () => ({
  Scavio: vi.fn(() => ({
    google: { search: mockGoogleSearch },
    amazon: { search: vi.fn(), product: mockAmazonProduct, offers: vi.fn() },
    walmart: { search: vi.fn(), product: vi.fn() },
    youtube: {
      search: vi.fn(),
      video: vi.fn(),
      metadata: vi.fn(),
      comments: vi.fn(),
      channel: vi.fn(),
      transcript: vi.fn(),
      streams: vi.fn(),
    },
    reddit: { search: mockRedditSearch, post: mockRedditPost },
    tiktok: { searchVideos: vi.fn(), profile: vi.fn() },
    instagram: { searchUsers: vi.fn(), profile: vi.fn() },
  })),
}));

import { createScavioGoogleSearchTool } from '../google.js';
import { createScavioRedditPostTool, createScavioRedditSearchTool } from '../reddit.js';
import { createScavioTools } from '../tools.js';

describe('createScavioTools', () => {
  it('returns all Scavio tools keyed by name', () => {
    const tools = createScavioTools({ apiKey: 'test-key' });
    expect(Object.keys(tools)).toEqual([
      'scavioGoogleSearch',
      'scavioAmazonSearch',
      'scavioAmazonProduct',
      'scavioAmazonOffers',
      'scavioWalmartSearch',
      'scavioWalmartProduct',
      'scavioYoutubeSearch',
      'scavioYoutubeVideo',
      'scavioYoutubeMetadata',
      'scavioYoutubeComments',
      'scavioYoutubeChannel',
      'scavioYoutubeTranscript',
      'scavioYoutubeStreams',
      'scavioRedditSearch',
      'scavioRedditPost',
      'scavioTiktokSearch',
      'scavioTiktokProfile',
      'scavioInstagramSearch',
      'scavioInstagramProfile',
    ]);
    expect(tools.scavioGoogleSearch.id).toBe('scavio-google-search');
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
