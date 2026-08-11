import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// Companies House - 4 endpoints. 1 credit flat on all four endpoints - the official UK registry.
//
// LOOKUP FIRST: scavio-companies-house-search is the entry point. Every other Companies House
// endpoint is keyed by an id that only exists inside Companies House's own URLs, so a caller
// holding a name resolves it here before anything else will answer.

export const companiesHouseToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioCompaniesHouseSearch',
    id: 'scavio-companies-house-search',
    platform: 'companies-house',
    endpoint: '/api/v1/companieshouse/search',
    credits: 1,
    description:
      'START HERE. Search the UK register by name and get the company_number every other ' +
      'Companies House endpoint is keyed by, plus status, incorporation or dissolution date, ' +
      'registered office and matched former names. 20 per page, last page is 50. Costs 1 credit.',
    inputSchema: z.object({
      query: z.string()
        .describe(
          'Company name or fragment (1-200 characters, non-blank). Matches CURRENT AND FORMER ' +
          'names.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based, 1-50, 20 results per page. Defaults to 1. The register serves ' +
          'only a 1000-result window per term whatever hit count it prints, and answers page 51 ' +
          'with HTTP 416.',
        ),
    }),
    call: (client, input) => client.companiesHouse.search(input),
  }),
  defineScavioTool({
    key: 'scavioCompaniesHouseCompany',
    id: 'scavio-companies-house-company',
    platform: 'companies-house',
    endpoint: '/api/v1/companieshouse/company',
    credits: 1,
    description:
      'Full UK register entry: status, type, incorporation and dissolution dates, registered ' +
      'office, SIC codes, previous names, accounts and confirmation-statement due dates with ' +
      'overdue flags, and whether it has charges, insolvency history, officers or UK ' +
      'establishments. Costs 1 credit.',
    inputSchema: z.object({
      company_number: z.string()
        .describe(
          'UK company number (1-20 characters), zero-padded and upper-cased for you, so ' +
          '\'445790\' and \'sc090312\' both work. Registry prefixes supported: SC, NI, OC, SO, ' +
          'NC, FC, BR, CE.',
        ),
    }),
    call: (client, input) => client.companiesHouse.company(input),
  }),
  defineScavioTool({
    key: 'scavioCompaniesHouseOfficers',
    id: 'scavio-companies-house-officers',
    platform: 'companies-house',
    endpoint: '/api/v1/companieshouse/officers',
    credits: 1,
    description:
      'UK company officers, current and resigned, 35 per page: name, role, appointment and ' +
      'resignation dates, correspondence address, nationality, country of residence, ' +
      'month-and-year date of birth and identity-verification status. Costs 1 credit.',
    inputSchema: z.object({
      company_number: z.string()
        .describe(
          'UK company number (1-20 characters), zero-padded and upper-cased for you.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based, 35 per page. Defaults to 1. No upper bound: past the last page ' +
          'the register answers an ordinary 200 with an empty list, identical to a company with ' +
          'no officers.',
        ),
    }),
    call: (client, input) => client.companiesHouse.officers(input),
  }),
  defineScavioTool({
    key: 'scavioCompaniesHouseFilingHistory',
    id: 'scavio-companies-house-filing-history',
    platform: 'companies-house',
    endpoint: '/api/v1/companieshouse/filing-history',
    credits: 1,
    description:
      'UK filings, most recent first: date, filing type code (AA, CS01, SH03), description, ' +
      'register annotations and child documents, and a link to the filed PDF with its page ' +
      'count. A filing the register has not finished processing carries a processing_note ' +
      'instead of a document. Costs 1 credit.',
    inputSchema: z.object({
      company_number: z.string()
        .describe(
          'UK company number (1-20 characters), zero-padded and upper-cased for you.',
        ),
      page: z.number().int().optional()
        .describe(
          'Results page, 1-based. Defaults to 1. No upper bound: past the last page the register ' +
          'answers an ordinary 200 with an empty list.',
        ),
    }),
    call: (client, input) => client.companiesHouse.filingHistory(input),
  }),
];

export const createScavioCompaniesHouseSearchTool = toolFactory(
  companiesHouseToolSpecs,
  'scavioCompaniesHouseSearch',
);
export const createScavioCompaniesHouseCompanyTool = toolFactory(
  companiesHouseToolSpecs,
  'scavioCompaniesHouseCompany',
);
export const createScavioCompaniesHouseOfficersTool = toolFactory(
  companiesHouseToolSpecs,
  'scavioCompaniesHouseOfficers',
);
export const createScavioCompaniesHouseFilingHistoryTool = toolFactory(
  companiesHouseToolSpecs,
  'scavioCompaniesHouseFilingHistory',
);
