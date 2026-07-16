import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGoogleSearch = vi.fn();
const mockAmazonProduct = vi.fn();

vi.mock('scavio', () => ({
  Scavio: vi.fn(() => ({
    google: { search: mockGoogleSearch },
    amazon: { search: vi.fn(), product: mockAmazonProduct },
    walmart: { search: vi.fn(), product: vi.fn() },
    youtube: { search: vi.fn(), metadata: vi.fn() },
    reddit: { search: vi.fn(), post: vi.fn() },
    tiktok: { searchVideos: vi.fn(), profile: vi.fn() },
    instagram: { searchUsers: vi.fn(), profile: vi.fn() },
  })),
}));

import { createScavioGoogleSearchTool } from '../google.js';
import { createScavioTools } from '../tools.js';

describe('createScavioTools', () => {
  it('returns all Scavio tools keyed by name', () => {
    const tools = createScavioTools({ apiKey: 'test-key' });
    expect(Object.keys(tools)).toEqual([
      'scavioGoogleSearch',
      'scavioAmazonSearch',
      'scavioAmazonProduct',
      'scavioWalmartSearch',
      'scavioWalmartProduct',
      'scavioYoutubeSearch',
      'scavioYoutubeMetadata',
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

  it('maps public params to v2 (gl/hl/start) and returns organic_results', async () => {
    const tool = createScavioGoogleSearchTool({ apiKey: 'test-key' });
    const result = await tool.execute!(
      { query: 'pydantic ai', country_code: 'us', language: 'en', page: 2, device: 'mobile', nfpr: true },
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

  it('omits start for page 1 and does not send v1 param names', async () => {
    const tool = createScavioGoogleSearchTool({ apiKey: 'test-key' });
    await tool.execute!({ query: 'q', country_code: 'gb', page: 1 }, {} as any);
    const sent = mockGoogleSearch.mock.calls[0][0];
    expect(sent).toEqual({ query: 'q', gl: 'gb' });
    expect(sent).not.toHaveProperty('start');
    expect(sent).not.toHaveProperty('country_code');
    expect(sent).not.toHaveProperty('search_type');
    expect(sent).not.toHaveProperty('light_request');
  });
});
