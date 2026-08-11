import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Glassdoor - 4 endpoints. 1 credit flat on all four endpoints. Addressing reviews or salaries
// by employer_id costs us two upstream fetches where the url form costs one; the price to you is
// 1 either way, but passing back reviews_url / salaries_url is the faster path.
//
// LOOKUP FIRST: scavio-glassdoor-companies is the entry point. Every other Glassdoor endpoint is
// keyed by an id that only exists inside Glassdoor's own URLs, so a caller holding a name
// resolves it here before anything else will answer.

export const glassdoorToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioGlassdoorCompanies',
    id: 'scavio-glassdoor-companies',
    platform: 'glassdoor',
    endpoint: '/api/v1/glassdoor/companies',
    credits: 1,
    description:
      'START HERE. Resolve a company NAME to the employer_id every other Glassdoor method is ' +
      'keyed by, ranked by Glassdoor and de-duplicated. Costs 1 credit.',
    inputSchema: z.object({
      query: z.string().describe('Company name to resolve (1-120 characters).'),
    }),
    call: (client, input) => client.glassdoor.companies(input),
  }),
  defineScavioTool({
    key: 'scavioGlassdoorCompany',
    id: 'scavio-glassdoor-company',
    platform: 'glassdoor',
    endpoint: '/api/v1/glassdoor/company',
    credits: 1,
    description:
      'Glassdoor employer profile: description, mission, industry, sector, HQ, size and revenue ' +
      'bands, stock symbol, year founded, overall and per-category ratings, star distribution, ' +
      'CEO approval, awards, FAQ and the five server-rendered reviews. Also returns reviews_url ' +
      'and salaries_url, which reviews() and salaries() accept as url to save a fetch. Provide ' +
      'employer_id or url. Costs 1 credit.',
    inputSchema: z.object({
      employer_id: z.string().optional()
        .describe(
          'Glassdoor employer id (1-50 characters) in any form Glassdoor writes it: \'1699\', ' +
          '\'E1699\' or \'IE1699\'. Must be a STRING - a JSON number is rejected.',
        ),
      company: z.string().optional()
        .describe(
          'Employer name as it appears in a Glassdoor slug (1-200 characters). COSMETIC: the ' +
          'profile resolves on employer_id alone, it is ignored entirely when url is set, and it ' +
          'does not satisfy the employer_id-or-url requirement.',
        ),
      url: z.string().optional()
        .describe(
          'Any glassdoor.com employer URL (1-500 characters): /Overview/, /Reviews/ or /Salary/. ' +
          'A non-glassdoor.com host is rejected.',
        ),
    }),
    call: (client, input) => client.glassdoor.company(input),
  }),
  defineScavioTool({
    key: 'scavioGlassdoorReviews',
    id: 'scavio-glassdoor-reviews',
    platform: 'glassdoor',
    endpoint: '/api/v1/glassdoor/reviews',
    credits: 1,
    description:
      'Up to THREE full Glassdoor reviews - the cap is Glassdoor\'s login wall - with per-axis ' +
      'scores, pros, cons, advice, job title, location, employment status and employer response, ' +
      'plus complete rating statistics, star distribution, aggregate pro/con highlight terms and ' +
      'per-job-title review counts. There is no page param: move the window with category and ' +
      'employment_status. Provide employer_id or url. Costs 1 credit.',
    inputSchema: z.object({
      employer_id: z.string().optional()
        .describe(
          'Glassdoor employer id (1-50 characters): \'1699\', \'E1699\' or \'IE1699\'. Must be a ' +
          'STRING - a JSON number is rejected. Addressing by id costs two upstream fetches; the ' +
          'customer price is unchanged.',
        ),
      company: z.string().optional()
        .describe(
          'Employer name as it appears in a Glassdoor slug (1-200 characters). COSMETIC: ignored ' +
          'when url is set, and it does not satisfy the employer_id-or-url requirement.',
        ),
      url: z.string().optional()
        .describe(
          'Any glassdoor.com employer URL (1-500 characters). Pass back reviews_url from ' +
          'company() to skip the resolve fetch. A non-glassdoor.com host is rejected.',
        ),
      category: z.enum([
        'career_development',
        'compensation',
        'culture',
        'diversity_and_inclusion',
        'management',
        'work_life_balance',
      ]).optional()
        .describe(
          'Restrict to reviews Glassdoor files under one topic. Closed enum: Glassdoor IGNORES ' +
          'an unknown value and serves the unfiltered set under a 200. Read ' +
          'filtered_review_count on the response to see how many match.',
        ),
      employment_status: z.enum(['full_time', 'part_time', 'contract', 'intern']).optional()
        .describe(
          'Restrict to one kind of employment. Closed enum for the same reason as category; ' +
          'FREELANCE is deliberately absent because it was never confirmed to change the result ' +
          'set.',
        ),
    }),
    call: (client, input) => client.glassdoor.reviews(input),
  }),
  defineScavioTool({
    key: 'scavioGlassdoorSalaries',
    id: 'scavio-glassdoor-salaries',
    platform: 'glassdoor',
    endpoint: '/api/v1/glassdoor/salaries',
    credits: 1,
    description:
      'Glassdoor salaries by job title, 10 titles per page: base-pay and total-pay percentiles ' +
      'P10-P90 with medians called out, sample counts, currency, pay period and last-reported ' +
      'date. The figures are Glassdoor\'s ESTIMATES for the title, not individual reported ' +
      'salaries. Provide employer_id or url. Costs 1 credit.',
    inputSchema: z.object({
      employer_id: z.string().optional()
        .describe(
          'Glassdoor employer id (1-50 characters): \'1699\', \'E1699\' or \'IE1699\'. Must be a ' +
          'STRING - a JSON number is rejected. Addressing by id costs two upstream fetches; the ' +
          'customer price is unchanged.',
        ),
      company: z.string().optional()
        .describe(
          'Employer name as it appears in a Glassdoor slug (1-200 characters). COSMETIC: ignored ' +
          'when url is set, and it does not satisfy the employer_id-or-url requirement.',
        ),
      url: z.string().optional()
        .describe(
          'Any glassdoor.com employer URL (1-500 characters). Pass back salaries_url from ' +
          'company() to skip the resolve fetch. A non-glassdoor.com host is rejected.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. Ten job titles per page; page_count on the response is how ' +
          'many pages exist.',
        ),
    }),
    call: (client, input) => client.glassdoor.salaries(input),
  }),
];

export const createScavioGlassdoorCompaniesTool = toolFactory(
  glassdoorToolSpecs,
  'scavioGlassdoorCompanies',
);
export const createScavioGlassdoorCompanyTool = toolFactory(
  glassdoorToolSpecs,
  'scavioGlassdoorCompany',
);
export const createScavioGlassdoorReviewsTool = toolFactory(
  glassdoorToolSpecs,
  'scavioGlassdoorReviews',
);
export const createScavioGlassdoorSalariesTool = toolFactory(
  glassdoorToolSpecs,
  'scavioGlassdoorSalaries',
);
