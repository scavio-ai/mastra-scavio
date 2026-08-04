import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// LinkedIn - 9 LIVE endpoints on three credit tiers: 1, 10, and 30 for
// /linkedin/job, the most expensive call in the whole Scavio API. The tiers are
// stated in every description so an agent can budget before it fans out.
//
// Five further paths (person/contact, company/people, company/jobs,
// search/people, search/posts) were retired upstream and answer 410 unbilled.
// They are deliberately NOT exposed as tools: an agent-facing tool that can only
// fail is worse than no tool. company() returns featured_employees (a 4-6 person
// sample) in place of company/people, and searchJobs() with the company name in
// place of company/jobs.
//
// The upstream is URL-native: every tool accepts `url` as a direct alternative
// to the id-ish param, and the member urn is not an accepted input anywhere.

const cursor = z
  .string()
  .optional()
  .describe('Opaque pagination cursor: the next_cursor from a prior response.');
const personUsername = z
  .string()
  .optional()
  .describe("Public identifier / vanity handle, e.g. 'williamhgates'.");
const personUrl = z
  .string()
  .optional()
  .describe('Full LinkedIn profile URL, as an alternative to username.');
const companyName = z
  .string()
  .optional()
  .describe("Company universal name (slug), e.g. 'microsoft'.");
const companyUrl = z
  .string()
  .optional()
  .describe('Full LinkedIn company URL, as an alternative to company.');
const postId = z
  .string()
  .optional()
  .describe("Post id or activity urn, e.g. '7488618410256523265'.");
const postUrl = z
  .string()
  .optional()
  .describe('Full LinkedIn post URL, as an alternative to post_id.');

export const linkedinToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioLinkedinPerson',
    id: 'scavio-linkedin-person',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/person',
    credits: 1,
    description:
      'Fetch a full LinkedIn profile via Scavio (1 credit): headline, about, current_company, experiences, educations, follower_count and connection_count. Provide username or url.',
    inputSchema: z.object({ username: personUsername, url: personUrl }),
    call: (client, input) => client.linkedin.person(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinPersonAbout',
    id: 'scavio-linkedin-person-about',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/person/about',
    credits: 1,
    description:
      'Fetch just the about-and-history slice of a LinkedIn profile via Scavio (1 credit): about, headline, experiences, educations, honors and bio links. Same cost as scavio-linkedin-person, which returns strictly more - prefer this only when you want a smaller payload.',
    inputSchema: z.object({ username: personUsername, url: personUrl }),
    call: (client, input) => client.linkedin.personAbout(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinPersonPosts',
    id: 'scavio-linkedin-person-posts',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/person/posts',
    credits: 10,
    description:
      "Fetch a LinkedIn member's posts via Scavio (10 credits). type selects the feed: their own posts (default), posts they commented on, or posts they reacted to. 50 per page - advance with next_cursor, and remember each page costs another 10 credits.",
    inputSchema: z.object({
      username: personUsername,
      url: personUrl,
      type: z
        .enum(['posts', 'comments', 'reactions'])
        .optional()
        .describe('Which feed to read. Defaults to posts.'),
      cursor,
    }),
    call: (client, input) => client.linkedin.personPosts(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinCompany',
    id: 'scavio-linkedin-company',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/company',
    credits: 1,
    description:
      'Fetch a LinkedIn company profile via Scavio (1 credit): description, website, industries, specialties, employee_count, follower_count, headquarters and locations. data.featured_employees is a 4-6 person staff sample - it is the only employee list available, since the employee directory was retired upstream.',
    inputSchema: z.object({ company: companyName, url: companyUrl }),
    call: (client, input) => client.linkedin.company(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinCompanyPosts',
    id: 'scavio-linkedin-company-posts',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/company/posts',
    credits: 10,
    description:
      "Fetch a LinkedIn company page's posts via Scavio (10 credits). Returns data.data with text, reactions, num_comments and images, 50 per page; advance with next_cursor. There is no type selector here - that is person-only.",
    inputSchema: z.object({ company: companyName, url: companyUrl, cursor }),
    call: (client, input) => client.linkedin.companyPosts(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinSearchJobs',
    id: 'scavio-linkedin-search-jobs',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/search/jobs',
    credits: 10,
    description:
      'Search LinkedIn job listings via Scavio (10 credits). The keyword field is named `search`. Returns job briefs (title, company, location, workplace_type, salary), 25 per page. Upstream rotates its result set so pages overlap slightly - dedupe by job id. Use this with a company name in place of the retired per-company jobs endpoint.',
    inputSchema: z.object({
      search: z.string().describe("Job search keyword, e.g. 'software engineer'."),
      location: z.string().optional().describe('Geographic filter. Omit to search everywhere.'),
      cursor,
    }),
    call: (client, input) => client.linkedin.searchJobs(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinJob',
    id: 'scavio-linkedin-job',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/job',
    credits: 30,
    description:
      'Fetch one LinkedIn job listing in full via Scavio (30 credits - the most expensive call in the API; fetch detail only for listings you have already shortlisted). Returns description, employment_type, experience_level, skills, applicant_count, salary and the hiring company. Roughly one in five ids from job search has no detail record upstream and answers 404 unbilled - skip those rather than retrying.',
    inputSchema: z.object({
      job_id: z.string().optional().describe("Job listing id, e.g. '4415427228'."),
      url: z.string().optional().describe('Full LinkedIn job URL, as an alternative to job_id.'),
    }),
    call: (client, input) => client.linkedin.job(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinPost',
    id: 'scavio-linkedin-post',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/post',
    credits: 1,
    description:
      'Fetch one LinkedIn post via Scavio (1 credit): text, hashtags, images, videos, num_likes, num_comments, tagged companies and people, the author profile, and data.top_comments. Check top_comments before spending 10 credits on the full comment tool.',
    inputSchema: z.object({ post_id: postId, url: postUrl }),
    call: (client, input) => client.linkedin.post(input),
  }),
  defineScavioTool({
    key: 'scavioLinkedinPostComments',
    id: 'scavio-linkedin-post-comments',
    platform: 'linkedin',
    endpoint: '/api/v1/linkedin/post/comments',
    credits: 10,
    description:
      'Fetch the comments on a LinkedIn post, with their replies, via Scavio (10 credits). This is the only LinkedIn tool that pages by a 1-based integer `page` rather than a cursor. Page size varies upstream, so page until a page comes back empty.',
    inputSchema: z.object({
      post_id: postId,
      url: postUrl,
      page: z
        .number()
        .optional()
        .describe('1-based page number (default 1). Page size varies, so do not compute offsets.'),
    }),
    call: (client, input) => client.linkedin.postComments(input),
  }),
];

export const createScavioLinkedinPersonTool = toolFactory(linkedinToolSpecs, 'scavioLinkedinPerson');
export const createScavioLinkedinPersonAboutTool = toolFactory(
  linkedinToolSpecs,
  'scavioLinkedinPersonAbout',
);
export const createScavioLinkedinPersonPostsTool = toolFactory(
  linkedinToolSpecs,
  'scavioLinkedinPersonPosts',
);
export const createScavioLinkedinCompanyTool = toolFactory(
  linkedinToolSpecs,
  'scavioLinkedinCompany',
);
export const createScavioLinkedinCompanyPostsTool = toolFactory(
  linkedinToolSpecs,
  'scavioLinkedinCompanyPosts',
);
export const createScavioLinkedinSearchJobsTool = toolFactory(
  linkedinToolSpecs,
  'scavioLinkedinSearchJobs',
);
export const createScavioLinkedinJobTool = toolFactory(linkedinToolSpecs, 'scavioLinkedinJob');
export const createScavioLinkedinPostTool = toolFactory(linkedinToolSpecs, 'scavioLinkedinPost');
export const createScavioLinkedinPostCommentsTool = toolFactory(
  linkedinToolSpecs,
  'scavioLinkedinPostComments',
);
