import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// SEC EDGAR - 6 endpoints. 1 credit flat on all six endpoints - SEC EDGAR is an official free
// JSON API. include_history can buy up to ten upstream fetches and is still 1 credit.
//
// LOOKUP FIRST: scavio-sec-lookup is the entry point. Every other SEC EDGAR endpoint is keyed by
// an id that only exists inside SEC EDGAR's own URLs, so a caller holding a name resolves it
// here before anything else will answer.

export const secToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioSecLookup',
    id: 'scavio-sec-lookup',
    platform: 'sec',
    endpoint: '/api/v1/sec/lookup',
    credits: 1,
    description:
      'START HERE. Resolve a company name or ticker (AAPL) to the CIK (0000320193) every other ' +
      'SEC EDGAR endpoint is keyed by. Up to 100 rows, tiered by match quality. Costs 1 credit.',
    inputSchema: z.object({
      query: z.string()
        .describe(
          'Ticker (\'AAPL\', \'BRK.B\'), company name, or a fragment of one (1-200 characters); ' +
          'each row carries its match tier as \'match\'.',
        ),
      limit: z.number().int().optional()
        .describe(
          'Rows to return, 1-100. Defaults to 10. Sizes the response; it is not a page param.',
        ),
      exchange: z.enum(['NASDAQ', 'NYSE', 'OTC', 'CBOE']).optional()
        .describe(
          'Restrict to one listing venue; matched case-insensitively, so \'Nasdaq\' also works. ' +
          'Filers the SEC lists with no exchange at all are excluded by any value.',
        ),
    }),
    call: (client, input) => client.sec.lookup(input),
  }),
  defineScavioTool({
    key: 'scavioSecCompany',
    id: 'scavio-sec-company',
    platform: 'sec',
    endpoint: '/api/v1/sec/company',
    credits: 1,
    description:
      'SEC filer profile: legal and former names, SIC industry, filer category, EIN, LEI, state ' +
      'of incorporation, fiscal year end, addresses, every ticker with its exchange, and a ' +
      'preview of its 10 most recent filings. Provide cik or ticker. Costs 1 credit.',
    inputSchema: z.object({
      cik: z.string().optional()
        .describe(
          'Filer CIK in any spelling (1-20 characters): 320193, 0000320193 or CIK0000320193. A ' +
          'ticker is accepted here too.',
        ),
      ticker: z.string().optional()
        .describe(
          'Ticker symbol (1-20 characters), dotted or dashed (BRK.B / BRK-B). Wins over cik when ' +
          'both are given.',
        ),
    }),
    call: (client, input) => client.sec.company(input),
  }),
  defineScavioTool({
    key: 'scavioSecFilings',
    id: 'scavio-sec-filings',
    platform: 'sec',
    endpoint: '/api/v1/sec/filings',
    credits: 1,
    description:
      'A page of one filer\'s filings: accession number, form and root form, filing and period ' +
      'dates, 8-K item codes, direct links to the primary document, filing index and attachment ' +
      'directory. Up to 500 per page. Provide cik or ticker. Costs 1 credit.',
    inputSchema: z.object({
      cik: z.string().optional()
        .describe(
          'Filer CIK, zero-padded or bare (1-20 characters). A ticker is accepted here too.',
        ),
      ticker: z.string().optional()
        .describe(
          'Ticker symbol (1-20 characters), as an alternative to cik.',
        ),
      form: z.union([z.string(), z.array(z.string())]).optional()
        .describe(
          'Form types to keep: \'10-K\', [\'10-K\', \'10-Q\'] or the comma-joined \'10-K,8-K\'; ' +
          'each value 1-50 characters, at most 25 values. Matched against the form AND its root ' +
          'form, so 10-K also returns 10-K/A amendments; ask for \'10-K/A\' to get only ' +
          'amendments.',
        ),
      date_from: z.string().optional().describe('Earliest filing date, inclusive (YYYY-MM-DD).'),
      date_to: z.string().optional().describe('Latest filing date, inclusive (YYYY-MM-DD).'),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based; page size is whatever limit is set to. No upper bound.',
        ),
      limit: z.number().int().optional().describe('Filings per page, 1-500. Defaults to 50.'),
      include_history: z.boolean().optional()
        .describe(
          'Also fetch the archived filing history beyond EDGAR\'s \'recent\' block, which is not ' +
          'a fixed window (a decade for a quiet filer, about a year for a prolific one). Off by ' +
          'default; at most 10 archived shards are fetched, history_truncated says when a filer ' +
          'had more, and it is still 1 credit.',
        ),
    }),
    call: (client, input) => client.sec.filings(input),
  }),
  defineScavioTool({
    key: 'scavioSecConcept',
    id: 'scavio-sec-concept',
    platform: 'sec',
    endpoint: '/api/v1/sec/concept',
    credits: 1,
    description:
      'Every value a filer reported for one XBRL concept, newest period first, with the form and ' +
      'filing each number came from. Restatements are kept, not collapsed. Up to 2000 rows. ' +
      'Provide cik or ticker. Costs 1 credit.',
    inputSchema: z.object({
      concept: z.string()
        .describe(
          'XBRL concept tag, CASE-SENSITIVE (1-120 characters, ^[A-Za-z][A-Za-z0-9]*$): ' +
          '\'NetIncomeLoss\' matches, \'netincomeloss\' is a 404 upstream. Use facts() to list ' +
          'what a filer actually reports.',
        ),
      cik: z.string().optional()
        .describe(
          'Filer CIK, zero-padded or bare (1-20 characters). A ticker is accepted here too.',
        ),
      ticker: z.string().optional()
        .describe(
          'Ticker symbol (1-20 characters), as an alternative to cik.',
        ),
      taxonomy: z.string().optional()
        .describe(
          'Reporting taxonomy (1-40 characters, ^[A-Za-z][A-Za-z0-9-]*$): us-gaap, dei, ' +
          'ifrs-full or srt. Defaults to \'us-gaap\'.',
        ),
      unit: z.string().optional()
        .describe(
          'Unit of measure to keep (1-40 characters), e.g. \'USD\' vs \'USD/shares\'.',
        ),
      form: z.string().optional()
        .describe(
          'Form to keep (1-50 characters). EXACT match here, unlike filings(), so \'10-K\' ' +
          'excludes 10-K/A.',
        ),
      limit: z.number().int().optional()
        .describe(
          'Rows to return, 1-2000. Defaults to 250. Sizes the response; it is not a page param.',
        ),
    }),
    call: (client, input) => client.sec.concept(input),
  }),
  defineScavioTool({
    key: 'scavioSecFacts',
    id: 'scavio-sec-facts',
    platform: 'sec',
    endpoint: '/api/v1/sec/facts',
    credits: 1,
    description:
      'The index of every XBRL concept a filer reports - tag, label, description, units and most ' +
      'recent value - across us-gaap, dei and any other taxonomy it uses. This is how you find ' +
      'what to ask concept() for. Up to 2000 rows. Provide cik or ticker. Costs 1 credit.',
    inputSchema: z.object({
      cik: z.string().optional()
        .describe(
          'Filer CIK, zero-padded or bare (1-20 characters). A ticker is accepted here too.',
        ),
      ticker: z.string().optional()
        .describe(
          'Ticker symbol (1-20 characters), as an alternative to cik.',
        ),
      taxonomy: z.string().optional()
        .describe(
          'Restrict to one taxonomy (1-40 characters), e.g. \'us-gaap\' or \'dei\'.',
        ),
      query: z.string().optional()
        .describe(
          'Case-insensitive substring matched against the tag name and label (1-200 characters).',
        ),
      limit: z.number().int().optional()
        .describe(
          'Rows to return, 1-2000. Defaults to 250. Sizes the response; it is not a page param.',
        ),
    }),
    call: (client, input) => client.sec.facts(input),
  }),
  defineScavioTool({
    key: 'scavioSecSearch',
    id: 'scavio-sec-search',
    platform: 'sec',
    endpoint: '/api/v1/sec/search',
    credits: 1,
    description:
      'EDGAR full-text search, coverage starting 2001: each hit is the matching DOCUMENT with ' +
      'its URL, form, filing date and filer identity, plus facets by company, form, industry and ' +
      'state. 100 documents per page, last page is 100. Costs 1 credit.',
    inputSchema: z.object({
      query: z.string().optional()
        .describe(
          'Full-text query over filing documents (1-500 characters); a quoted phrase is matched ' +
          'exactly, bare words as a bag of terms. Optional - a cik, ticker, form or date filter ' +
          'on its own is a valid search.',
        ),
      cik: z.union([z.string(), z.array(z.string())]).optional()
        .describe(
          'Restrict to one or more filers by CIK: a single value, a list, or a comma-joined ' +
          'string; each 1-20 characters, at most 25 values. Tickers are accepted here too.',
        ),
      ticker: z.union([z.string(), z.array(z.string())]).optional()
        .describe(
          'Restrict to one or more filers by ticker symbol: a single value, a list, or a ' +
          'comma-joined string; each 1-20 characters, at most 25 values.',
        ),
      form: z.union([z.string(), z.array(z.string())]).optional()
        .describe(
          'Form types to keep: \'8-K\', [\'10-K\', \'10-Q\'] or the comma-joined \'10-K,10-Q\'; ' +
          'each 1-50 characters, at most 25 values.',
        ),
      date_from: z.string().optional()
        .describe(
          'Earliest filing date, inclusive (YYYY-MM-DD). Full-text coverage starts in 2001.',
        ),
      date_to: z.string().optional().describe('Latest filing date, inclusive (YYYY-MM-DD).'),
      location: z.union([z.string(), z.array(z.string())]).optional()
        .describe(
          'Filer business-address locations as EDGAR\'s own 2-character codes (CA, NY, and its ' +
          'alphanumeric codes for foreign jurisdictions): a single value, a list, or a ' +
          'comma-joined string; at most 25 values.',
        ),
      sort: z.enum(['relevance', 'newest', 'oldest']).optional()
        .describe(
          'Result ordering. Defaults to the index\'s own relevance ranking.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based, 1-100, 100 documents per page. The SEC\'s index refuses a ' +
          'result window past 10,000, so 100 is the last page for any query.',
        ),
    }),
    call: (client, input) => client.sec.search(input),
  }),
];

export const createScavioSecLookupTool = toolFactory(secToolSpecs, 'scavioSecLookup');
export const createScavioSecCompanyTool = toolFactory(secToolSpecs, 'scavioSecCompany');
export const createScavioSecFilingsTool = toolFactory(secToolSpecs, 'scavioSecFilings');
export const createScavioSecConceptTool = toolFactory(secToolSpecs, 'scavioSecConcept');
export const createScavioSecFactsTool = toolFactory(secToolSpecs, 'scavioSecFacts');
export const createScavioSecSearchTool = toolFactory(secToolSpecs, 'scavioSecSearch');
