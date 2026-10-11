import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const extract = Object.assign(vi.fn(), {
  map: vi.fn(),
  crawl: vi.fn(),
  crawlStatus: vi.fn(),
  batch: vi.fn(),
  batchStatus: vi.fn(),
});

vi.mock('scavio', () => ({
  // extract is a CALLABLE namespace (scavio >= 0.23): extract({ url }) reads one
  // page; map/crawl/batch hang off it.
  Scavio: vi.fn(() => ({ extract })),
}));

import { createScavioTools } from '../tools.js';
import { extractWebToolSpecs } from '../extract-web.js';

const JOB = 'crawl_01a12d21';
const created = (id = JOB) => ({ data: { id, status: 'queued' }, credits_used: 0 });
const status = (s: string, id = JOB) => ({
  data: { id, status: s, results: [{ url: 'https://hono.dev/docs' }], next_cursor: null },
});
const tools = () => createScavioTools({ apiKey: 'test-key', enableCrawl: true }) as Record<string, any>;
const run = (key: string, input: Record<string, unknown>) => tools()[key].execute(input, {} as any);

describe('website map, crawl and batch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('map forwards its body to extract.map', async () => {
    extract.map.mockResolvedValue({ data: { links: [] }, credits_used: 1 });
    await run('scavioMapWebsite', { url: 'scavio.dev', limit: 5, include_paths: ['/blog/**'] });
    expect(extract.map).toHaveBeenCalledWith({ url: 'scavio.dev', limit: 5, include_paths: ['/blog/**'] });
  });

  it('crawl with wait_seconds 0 returns the 202 without polling', async () => {
    extract.crawl.mockResolvedValue(created());
    const out = await run('scavioCrawlWebsite', { url: 'https://hono.dev/docs', wait_seconds: 0 });
    expect(out.data.id).toBe(JOB);
    expect(extract.crawl).toHaveBeenCalledWith({ url: 'https://hono.dev/docs' });
    expect(extract.crawlStatus).not.toHaveBeenCalled();
  });

  it('crawl waits until completed, then reads the caller\'s results page', async () => {
    extract.crawl.mockResolvedValue(created());
    extract.crawlStatus
      .mockResolvedValueOnce(status('running'))
      .mockResolvedValueOnce(status('completed'))
      .mockResolvedValueOnce(status('completed'));
    const pending = run('scavioCrawlWebsite', { url: 'https://hono.dev/docs', max_pages: 3, limit: 7 });
    await vi.advanceTimersByTimeAsync(7_000);
    const out = await pending;
    expect(out.data.status).toBe('completed');
    expect(extract.crawl).toHaveBeenCalledWith({ url: 'https://hono.dev/docs', max_pages: 3 });
    expect(extract.crawlStatus.mock.calls).toEqual([
      [JOB, { limit: 1, include_content: false }],
      [JOB, { limit: 1, include_content: false }],
      [JOB, { limit: 7 }],
    ]);
  });

  it('crawl still running when the wait ends returns its id', async () => {
    extract.crawl.mockResolvedValue(created());
    extract.crawlStatus.mockResolvedValue(status('running'));
    const pending = run('scavioCrawlWebsite', { url: 'https://hono.dev/docs', wait_seconds: 10 });
    await vi.advanceTimersByTimeAsync(11_000);
    const out = await pending;
    expect(out.data.status).toBe('running');
    // Probes at 3, 6, 9 and 10 s, then the final read with the default limit.
    expect(extract.crawlStatus).toHaveBeenCalledTimes(5);
    expect(extract.crawlStatus).toHaveBeenLastCalledWith(JOB, { limit: 10 });
  });

  it('crawl status passes the query through with a default limit', async () => {
    extract.crawlStatus.mockResolvedValue(status('completed'));
    await run('scavioCrawlStatus', { id: JOB, cursor: '25', include_content: false });
    expect(extract.crawlStatus).toHaveBeenCalledWith(JOB, { cursor: '25', include_content: false, limit: 10 });
  });

  it('batch posts urls and polls the batch job', async () => {
    extract.batch.mockResolvedValue(created('batch_1'));
    extract.batchStatus.mockResolvedValue(status('completed', 'batch_1'));
    const pending = run('scavioBatchExtract', { urls: ['https://example.com/'], mode: 'normal' });
    await vi.advanceTimersByTimeAsync(4_000);
    const out = await pending;
    expect(extract.batch).toHaveBeenCalledWith({ urls: ['https://example.com/'], mode: 'normal' });
    expect(extract.batchStatus).toHaveBeenLastCalledWith('batch_1', { limit: 10 });
    expect(out.data.id).toBe('batch_1');
  });

  it('batch status reads the batch job', async () => {
    extract.batchStatus.mockResolvedValue(status('running', 'batch_1'));
    await run('scavioBatchStatus', { id: 'batch_1' });
    expect(extract.batchStatus).toHaveBeenCalledWith('batch_1', { limit: 10 });
  });

  it('descriptions state the price and never the fetch method', () => {
    for (const spec of extractWebToolSpecs) {
      const text = (spec.description + JSON.stringify((spec.inputSchema as any).shape)).toLowerCase();
      expect(text, spec.key).toMatch(/credit/);
      for (const word of ['proxy', 'proxies', 'residential', 'datacenter', 'headless', 'browser']) {
        expect(text.includes(word), `${spec.key}: ${word}`).toBe(false);
      }
    }
  });
});
