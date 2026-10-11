import { z } from 'zod';

import type { ScavioClient } from './client.js';
import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Website map, crawl and batch: the multi-page members of the Extract family - 5 tools, opt-in
// via createScavioTools({ enableCrawl: true }) because a crawl bills per page.
//
// Map answers in one call. Crawl and batch are background jobs: the start tools post the job,
// then wait up to wait_seconds (default 45, max 300) for it to finish, polling progress without
// page content, and return the job's status with its first page of results either way. A job
// still running when the wait ends keeps going server-side; read the rest with the matching
// status tool. Cancellation, webhooks and idempotency keys exist in the scavio SDK and the REST
// API but are deliberately not tools.

export const JOB_POLL_INTERVAL_MS = 3_000;
const JOB_WAIT_DEFAULT_SECONDS = 45;
const JOB_WAIT_MAX_SECONDS = 300;
const JOB_RESULTS_DEFAULT_LIMIT = 10;
const JOB_TERMINAL = new Set(['completed', 'failed', 'cancelled']);

type JobQuery = {
  cursor?: string;
  limit?: number;
  status?: 'succeeded' | 'failed' | 'skipped';
  include_content?: boolean;
};
type JobPayload = { data?: { id?: string; status?: string } } & Record<string, unknown>;
type JobStatusFn = (id: string, query: JobQuery) => Promise<unknown>;

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Poll a job (content-free) until it finishes or the wait runs out, then read one results page. */
async function waitForJob(
  status: JobStatusFn,
  id: string,
  waitSeconds: number,
  query: JobQuery,
): Promise<Record<string, unknown>> {
  const deadline = Date.now() + Math.max(0, Math.min(waitSeconds, JOB_WAIT_MAX_SECONDS)) * 1000;
  for (;;) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await sleep(Math.min(JOB_POLL_INTERVAL_MS, remaining));
    const probe = (await status(id, { limit: 1, include_content: false })) as JobPayload;
    if (JOB_TERMINAL.has(String(probe?.data?.status))) break;
  }
  return (await status(id, query)) as Record<string, unknown>;
}

/** Start a job, then wait for it (bounded). wait_seconds 0 returns the 202 payload. */
async function startAndWait(
  start: (body: Record<string, unknown>) => Promise<unknown>,
  status: JobStatusFn,
  input: Record<string, unknown> & { wait_seconds?: number; limit?: number; include_content?: boolean },
): Promise<Record<string, unknown>> {
  const { wait_seconds, limit, include_content, ...body } = input;
  const created = (await start(body)) as JobPayload;
  const id = created?.data?.id;
  const wait = wait_seconds ?? JOB_WAIT_DEFAULT_SECONDS;
  if (!id || wait <= 0) return created;
  const query: JobQuery = { limit: limit ?? JOB_RESULTS_DEFAULT_LIMIT };
  if (include_content !== undefined) query.include_content = include_content;
  return waitForJob(status, id, wait, query);
}

const MODE_DESCRIPTION =
  'Fetch tier, and the price-bearing parameter: \'normal\' is the standard fetch, \'advanced\' ' +
  'renders JavaScript-built pages, \'ultra\' reaches the hardest pages. Server default \'normal\'.';
const PATHS_DESCRIPTION =
  'Path globs (max 20). \'*\' matches within one path segment, \'**\' across segments; a pattern ' +
  'without wildcards matches that path and everything under it. Example: [\'/blog/**\'].';
const JOB_PRICE =
  'Billed per SUCCESSFUL page at Extract\'s price for the mode: normal and advanced 1 credit, ' +
  'ultra 2 credits. Failed and skipped pages are free, and if the balance runs out the job stops ' +
  'cleanly.';

const mode = z.enum(['normal', 'advanced', 'ultra']).optional().describe(MODE_DESCRIPTION);
const format = z.enum(['html', 'markdown', 'text']).optional()
  .describe('Format for each page, as on extract: html, markdown or text (server default markdown).');
const waitSeconds = z.number().int().min(0).max(JOB_WAIT_MAX_SECONDS).optional()
  .describe(
    'Seconds to wait for the job to finish before returning, 0-300 (default 45). 0 returns the ' +
    'job id at once. A job still running when the wait ends keeps going; read it later with its ' +
    'status tool.',
  );
const limit = z.number().int().min(1).max(100).optional()
  .describe(
    'Results per response, 1-100 (default 10, to keep page content inside the context window); ' +
    'page on with next_cursor.',
  );
const includeContent = z.boolean().optional()
  .describe('Set false to list results without their page content (default true).');

const statusSchema = z.object({
  id: z.string().describe('Job id returned when the job was started (data.id).'),
  cursor: z.string().optional().describe('next_cursor from the previous response, to read the next page.'),
  limit,
  status: z.enum(['succeeded', 'failed', 'skipped']).optional().describe('Only results with this status.'),
  include_content: includeContent,
});

const readStatus = (
  fn: (client: ScavioClient) => JobStatusFn,
) => (client: ScavioClient, { id, limit: max, ...query }: z.infer<typeof statusSchema>) =>
  fn(client)(id, { ...query, limit: max ?? JOB_RESULTS_DEFAULT_LIMIT }) as Promise<Record<string, unknown>>;

export const extractWebToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioMapWebsite',
    id: 'scavio-map-website',
    platform: 'extract',
    endpoint: '/api/v1/extract/map',
    credits: 1,
    description:
      'List a website\'s page URLs, gathered from its sitemaps and its start page, deduplicated, ' +
      'filtered by path or search words and limited: { url, links: [{ url, source, lastmod }], ' +
      'total_found, returned, truncated }. Pages the site\'s robots.txt disallows are left out. ' +
      'Use it to find the right pages before extracting or crawling. Costs 1 credit in normal ' +
      'mode; advanced costs up to 2 credits and ultra up to 10, priced by what the call needed.',
    inputSchema: z.object({
      url: z.string().describe('The site to map. A bare host is upgraded to https.'),
      search: z.string().optional()
        .describe('Only return URLs containing every word of this text (case-insensitive).'),
      limit: z.number().int().min(1).max(5000).optional()
        .describe(
          'Maximum links to return, 1-5000. Default 1000 (or the plan\'s limit if lower: Free 500, ' +
          'PAYG 1,000, paid plans 5,000).',
        ),
      sitemap: z.enum(['include', 'only', 'skip']).optional()
        .describe(
          '\'include\' combines the site\'s sitemaps with the start page\'s links (default); ' +
          '\'only\' uses sitemaps alone; \'skip\' uses page links alone.',
        ),
      include_subdomains: z.boolean().optional()
        .describe('Also return URLs on subdomains of the site (default false).'),
      include_paths: z.array(z.string()).optional().describe(`Keep only URLs matching these. ${PATHS_DESCRIPTION}`),
      exclude_paths: z.array(z.string()).optional().describe(`Drop URLs matching these. ${PATHS_DESCRIPTION}`),
      ignore_query_parameters: z.boolean().optional()
        .describe('Treat URLs that differ only by query string as one URL (default true).'),
      mode,
    }),
    call: async (client, input) =>
      (await client.extract.map(input)) as unknown as Record<string, unknown>,
  }),
  defineScavioTool({
    key: 'scavioCrawlWebsite',
    id: 'scavio-crawl-website',
    platform: 'extract',
    endpoint: '/api/v1/extract/crawl',
    credits: 1,
    description:
      'Crawl a website from one start URL: same-site pages are discovered and extracted ' +
      'breadth-first within the page, depth and path limits, each returned as Markdown, text or ' +
      'HTML. Pages the site\'s robots.txt disallows are skipped. Waits up to wait_seconds ' +
      '(default 45) and returns { id, status, pages, credits_used, results, next_cursor }; if ' +
      'status is still queued or running, call scavio-crawl-status with the id later. ' +
      JOB_PRICE,
    inputSchema: z.object({
      url: z.string().describe('Where the crawl starts. Only pages on the same site are crawled.'),
      max_pages: z.number().int().min(1).max(10000).optional()
        .describe(
          'Maximum pages to fetch. Default 100. Plan limits: Free 10, PAYG 100, Project 500, ' +
          'Bootstrap 2,000, Startup 5,000, Growth 10,000.',
        ),
      max_depth: z.number().int().min(0).max(10).optional()
        .describe('How many links away from the start page to follow, 0-10 (default 3). 0 fetches only the start page.'),
      include_paths: z.array(z.string()).optional().describe(`Crawl only paths matching these. ${PATHS_DESCRIPTION}`),
      exclude_paths: z.array(z.string()).optional().describe(`Skip paths matching these. ${PATHS_DESCRIPTION}`),
      allow_subdomains: z.boolean().optional().describe('Also crawl subdomains of the site (default false).'),
      ignore_query_parameters: z.boolean().optional()
        .describe('Treat URLs that differ only by query string as one page (default true).'),
      sitemap: z.enum(['include', 'skip', 'only']).optional()
        .describe(
          '\'include\' also starts from the site\'s sitemap (default); \'skip\' follows links only; ' +
          '\'only\' fetches sitemap pages without following links.',
        ),
      format,
      mode,
      wait_seconds: waitSeconds,
      limit,
      include_content: includeContent,
    }),
    call: (client, input) =>
      startAndWait(
        body => client.extract.crawl(body as Parameters<ScavioClient['extract']['crawl']>[0]),
        (id, query) => client.extract.crawlStatus(id, query),
        input,
      ),
  }),
  defineScavioTool({
    key: 'scavioCrawlStatus',
    id: 'scavio-crawl-status',
    platform: 'extract',
    endpoint: '/api/v1/extract/crawl/{id}',
    credits: 0,
    description:
      'Read a crawl\'s progress and its page results by job id, paged by cursor: { status, ' +
      'stopped_reason, pages, credits_used, results: [{ url, status, content }], next_cursor }. ' +
      'Results are kept for 3 days after the crawl finishes. Free: reading a job costs 0 credits.',
    inputSchema: statusSchema,
    call: readStatus(client => (id, query) => client.extract.crawlStatus(id, query)),
  }),
  defineScavioTool({
    key: 'scavioBatchExtract',
    id: 'scavio-batch-extract',
    platform: 'extract',
    endpoint: '/api/v1/extract/batch',
    credits: 1,
    description:
      'Extract a list of URLs (up to 1,000, plan-limited) in one job, each returned as Markdown, ' +
      'text or HTML exactly like scavio-extract. Waits up to wait_seconds (default 45) and returns ' +
      '{ id, status, pages, credits_used, results, next_cursor }; if status is still queued or ' +
      'running, call scavio-batch-status with the id later. ' +
      JOB_PRICE,
    inputSchema: z.object({
      urls: z.array(z.string()).min(1).max(1000)
        .describe(
          'The pages to extract (duplicates removed). Plan limits: Free 10, PAYG 50, Project 100, ' +
          'Bootstrap 500, Startup and Growth 1,000.',
        ),
      format,
      mode,
      wait_seconds: waitSeconds,
      limit,
      include_content: includeContent,
    }),
    call: (client, input) =>
      startAndWait(
        body => client.extract.batch(body as Parameters<ScavioClient['extract']['batch']>[0]),
        (id, query) => client.extract.batchStatus(id, query),
        input,
      ),
  }),
  defineScavioTool({
    key: 'scavioBatchStatus',
    id: 'scavio-batch-status',
    platform: 'extract',
    endpoint: '/api/v1/extract/batch/{id}',
    credits: 0,
    description:
      'Read a batch extract\'s progress and its page results by job id, paged by cursor: { status, ' +
      'pages, credits_used, results: [{ url, status, content }], next_cursor }. Results are kept ' +
      'for 3 days after the batch finishes. Free: reading a job costs 0 credits.',
    inputSchema: statusSchema,
    call: readStatus(client => (id, query) => client.extract.batchStatus(id, query)),
  }),
];

export const createScavioMapWebsiteTool = toolFactory(extractWebToolSpecs, 'scavioMapWebsite');
export const createScavioCrawlWebsiteTool = toolFactory(extractWebToolSpecs, 'scavioCrawlWebsite');
export const createScavioCrawlStatusTool = toolFactory(extractWebToolSpecs, 'scavioCrawlStatus');
export const createScavioBatchExtractTool = toolFactory(extractWebToolSpecs, 'scavioBatchExtract');
export const createScavioBatchStatusTool = toolFactory(extractWebToolSpecs, 'scavioBatchStatus');
