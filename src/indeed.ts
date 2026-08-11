import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Indeed - 4 endpoints. 2 credits flat on all four endpoints.

export const indeedToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioIndeedSearch',
    id: 'scavio-indeed-search',
    platform: 'indeed',
    endpoint: '/api/v1/indeed/search',
    credits: 2,
    description:
      'Indeed job postings: title, employer, rating, location, salary range, job type, benefits, ' +
      'posting age, apply route. 10 postings per page. Provide query or location - a ' +
      'location-only search (every posting in a metro) is valid. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().optional()
        .describe(
          'Job title, keywords or employer (1-500 characters). Required unless location is ' +
          'given.',
        ),
      location: z.string().optional()
        .describe(
          'City and state, postal code, state, country, or \'Remote\' (1-200 characters). Valid ' +
          'on its own with no query.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. 10 postings per page, 1 call each.',
        ),
      radius: z.union([
        z.literal(0),
        z.literal(5),
        z.literal(10),
        z.literal(15),
        z.literal(25),
        z.literal(35),
        z.literal(50),
        z.literal(100),
      ]).optional()
        .describe(
          'Search radius in miles around location. Closed set: Indeed IGNORES any other value ' +
          'and returns the unfiltered set. Upstream default 50.',
        ),
      max_age_days: z.union([z.literal(1), z.literal(3), z.literal(7), z.literal(14)]).optional()
        .describe(
          'Maximum posting age in days. Closed set: Indeed IGNORES any other value and returns ' +
          'postings of every age.',
        ),
      job_type: z.enum(['full_time', 'part_time', 'contract', 'temporary', 'internship']).optional()
        .describe(
          'Employment type filter.',
        ),
      min_salary: z.number().optional()
        .describe(
          'Minimum annual salary, >= 0. Filters on INDEED\'S OWN ESTIMATE for the role, not a ' +
          'posted figure, so postings publishing no salary still match.',
        ),
      remote: z.boolean().optional().describe('Remote postings only.'),
    }),
    call: (client, input) => client.indeed.search(input),
  }),
  defineScavioTool({
    key: 'scavioIndeedJob',
    id: 'scavio-indeed-job',
    platform: 'indeed',
    endpoint: '/api/v1/indeed/job',
    credits: 2,
    description:
      'One Indeed posting in full: description text and HTML, structured salary, employment ' +
      'types, benefits, geocoded address, employer rating, applicant count, original ATS link. ' +
      'An unknown job key is a real 404 that is still billed. Costs 2 credits.',
    inputSchema: z.object({
      job_id: z.string()
        .describe(
          '16-hex Indeed job key, or any indeed.com URL carrying jk= (/viewjob, /rc/clk, ' +
          '/pagead/clk).',
        ),
    }),
    call: (client, input) => client.indeed.job(input),
  }),
  defineScavioTool({
    key: 'scavioIndeedCompany',
    id: 'scavio-indeed-company',
    platform: 'indeed',
    endpoint: '/api/v1/indeed/company',
    credits: 2,
    description:
      'Indeed employer profile: description, industry, HQ, size, revenue, CEO approval, overall ' +
      'and per-category ratings, reported salaries, open roles, locations. An unknown slug is a ' +
      'real 404 that is still billed. Costs 2 credits.',
    inputSchema: z.object({
      company: z.string()
        .describe(
          'indeed.com/cmp/<slug> slug or a full profile URL (1-200 characters); slugs are ' +
          'untidy, e.g. \'Tata-Consultancy-Services-(tcs)\'.',
        ),
    }),
    call: (client, input) => client.indeed.company(input),
  }),
  defineScavioTool({
    key: 'scavioIndeedCompanyReviews',
    id: 'scavio-indeed-company-reviews',
    platform: 'indeed',
    endpoint: '/api/v1/indeed/company/reviews',
    credits: 2,
    description:
      'Indeed employee reviews, 20 per page, with per-category ratings, pros/cons, reviewer job ' +
      'title and location, plus aggregated sentiment and topic/location/job-title breakdowns. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      company: z.string()
        .describe(
          'indeed.com/cmp/<slug> slug or a full profile URL (1-200 characters).',
        ),
      page: z.number().int().optional().describe('Reviews page, 1-based. 20 reviews per page.'),
    }),
    call: (client, input) => client.indeed.companyReviews(input),
  }),
];

export const createScavioIndeedSearchTool = toolFactory(indeedToolSpecs, 'scavioIndeedSearch');
export const createScavioIndeedJobTool = toolFactory(indeedToolSpecs, 'scavioIndeedJob');
export const createScavioIndeedCompanyTool = toolFactory(indeedToolSpecs, 'scavioIndeedCompany');
export const createScavioIndeedCompanyReviewsTool = toolFactory(
  indeedToolSpecs,
  'scavioIndeedCompanyReviews',
);
