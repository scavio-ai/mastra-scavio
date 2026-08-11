import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Capterra Software Reviews - 3 endpoints. 2 credits flat on all three endpoints.

export const capterraToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioCapterraSearch',
    id: 'scavio-capterra-search',
    platform: 'capterra',
    endpoint: '/api/v1/capterra/search',
    credits: 2,
    description:
      'Search Capterra, the B2B software review site: 20 ranked products with name, vendor ' +
      'description, rating, review count, logo and paid-placement flag, each row carrying ' +
      'product_id and slug. The result set is fixed at 20 and does NOT paginate -- Capterra ' +
      'serves identical rows for page 2, so there is deliberately no page parameter. Provide ' +
      'query or url. Costs 2 credits.',
    inputSchema: z.object({
      query: z.string().optional()
        .describe(
          'Search term (1-200 characters). Required in practice: a term-less Capterra search ' +
          'serves a fixed popular-products list unrelated to the caller.',
        ),
      url: z.string().optional()
        .describe(
          'Full capterra.com search URL, as an alternative to query (1-1000 characters; the ' +
          'transport also accepts capterra.co.uk and capterra.com.br hosts).',
        ),
    }),
    call: (client, input) => client.capterra.search(input),
  }),
  defineScavioTool({
    key: 'scavioCapterraProduct',
    id: 'scavio-capterra-product',
    platform: 'capterra',
    endpoint: '/api/v1/capterra/product',
    credits: 2,
    description:
      'Full Capterra profile: rating with per-star histogram and the four scored criteria, ' +
      'likelihood to recommend, review sentiment and topics, the complete pricing table with ' +
      'every plan and its features, every rated feature and integration, AI-derived pros and ' +
      'cons with the quoted review, FAQs, screenshots, badges and awards, competitor comparisons ' +
      'and alternatives, and the buyer profile by company size, industry and job function -- ' +
      'PLUS the 25 most recent reviews at no extra cost. vendor is always null here: Capterra ' +
      'does not publish it as structured data on the product page. Provide product_id or url. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      product_id: z.string().optional()
        .describe(
          'The number in a Capterra product path such as /p/186596/Notion/ (1-50 characters). ' +
          'Must be a STRING -- a JSON number is rejected.',
        ),
      slug: z.string().optional()
        .describe(
          'Product slug (1-200 characters). Cosmetic on this endpoint -- a wrong slug still ' +
          'returns the right profile -- but load-bearing on reviews().',
        ),
      url: z.string().optional()
        .describe(
          'Full Capterra product URL, as an alternative to product_id (1-1000 characters).',
        ),
    }),
    call: (client, input) => client.capterra.product(input),
  }),
  defineScavioTool({
    key: 'scavioCapterraReviews',
    id: 'scavio-capterra-reviews',
    platform: 'capterra',
    endpoint: '/api/v1/capterra/reviews',
    credits: 2,
    description:
      'A page of Capterra reviews: overall score plus five per-criterion scores, title, pros, ' +
      'cons, advice, usage duration, incentivized flag, alternatives considered and what they ' +
      'switched from, reviewer job title, industry and company size, and the vendor response -- ' +
      'plus a competitor list richer than the profile\'s, each alternative with its own rating ' +
      'histogram and starting price. 25 reviews per page, capped at page 100. Page 1 already ' +
      'rides along inside product(), so use this to page past it. Provide product_id or url. ' +
      'Costs 2 credits.',
    inputSchema: z.object({
      product_id: z.string().optional()
        .describe(
          'Capterra product id as a string (1-50 characters).',
        ),
      slug: z.string().optional()
        .describe(
          'Product slug (1-200 characters). LOAD-BEARING here: it is case-sensitive upstream and ' +
          'a wrong one silently serves page one under a billed 200. Pass back the slug from ' +
          'search() or product().',
        ),
      url: z.string().optional()
        .describe(
          'Full Capterra reviews URL, as an alternative to product_id (1-1000 characters). ' +
          'Passing back reviews_url from product() is the reliable way to page.',
        ),
      page: z.number().int().optional()
        .describe(
          '1-based page number (1-100); 25 reviews per page. 100 is a hard cap whatever the ' +
          'review count says -- past it Capterra answers 200 with page one.',
        ),
    }),
    call: (client, input) => client.capterra.reviews(input),
  }),
];

export const createScavioCapterraSearchTool = toolFactory(
  capterraToolSpecs,
  'scavioCapterraSearch',
);
export const createScavioCapterraProductTool = toolFactory(
  capterraToolSpecs,
  'scavioCapterraProduct',
);
export const createScavioCapterraReviewsTool = toolFactory(
  capterraToolSpecs,
  'scavioCapterraReviews',
);
