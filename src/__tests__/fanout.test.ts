import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Guards for the 92-endpoint platform fanout plus the core extract endpoint.
 *
 * The recording client below is the point of this file. Every spec is
 * hand-written over the SDK, so a copy-paste that lands on a neighbouring
 * method still returns a plausible object and passes every other test here.
 * CALL_PATHS pins tool key -> SDK call for all 93.
 */

const calls: Array<{ path: string; input: unknown }> = [];

// A Proxy, not a hand-listed mock: a mock that forgets a method answers
// `undefined` and the tool throws on call, which reads as a broken SDK rather
// than a missing entry in the test's own fixture.
const recorder = (path: string[]): unknown =>
  new Proxy(function () {} as unknown as object, {
    get: (_target, property: string) => recorder([...path, property]),
    apply: (_target, _this, args: unknown[]) => {
      calls.push({ path: path.join('.'), input: args[0] });
      return Promise.resolve({ data: { ok: true }, credits_used: 1 });
    },
  });

vi.mock('scavio', () => ({
  Scavio: vi.fn(() => recorder([])),
}));

import { extractToolSpecs } from '../extract.js';
import { walmartToolSpecs } from '../walmart.js';
import { threadsToolSpecs } from '../threads.js';
import { kuaishouToolSpecs } from '../kuaishou.js';
import { ebayToolSpecs } from '../ebay.js';
import { targetToolSpecs } from '../target.js';
import { homeDepotToolSpecs } from '../home-depot.js';
import { zillowToolSpecs } from '../zillow.js';
import { bookingToolSpecs } from '../booking.js';
import { tripadvisorToolSpecs } from '../tripadvisor.js';
import { indeedToolSpecs } from '../indeed.js';
import { airbnbToolSpecs } from '../airbnb.js';
import { glassdoorToolSpecs } from '../glassdoor.js';
import { yelpToolSpecs } from '../yelp.js';
import { appStoreToolSpecs } from '../app-store.js';
import { googlePlayToolSpecs } from '../google-play.js';
import { secToolSpecs } from '../sec.js';
import { redfinToolSpecs } from '../redfin.js';
import { companiesHouseToolSpecs } from '../companies-house.js';
import { g2ToolSpecs } from '../g2.js';
import { capterraToolSpecs } from '../capterra.js';
import { googleAdsToolSpecs } from '../google-ads.js';
import { metaAdsToolSpecs } from '../meta-ads.js';
import { createScavioTools } from '../tools.js';
import { SCAVIO_PLATFORMS } from '../tool.js';
import type { AnyScavioToolSpec } from '../tool.js';

/** tool key -> the SDK call it must reach. extract is TOP-LEVEL, never a namespace. */
const CALL_PATHS: Record<string, string> = {
  scavioExtract: 'extract',
  scavioWalmartSearch: 'walmart.search',
  scavioWalmartProduct: 'walmart.product',
  scavioWalmartReviews: 'walmart.reviews',
  scavioWalmartCategory: 'walmart.category',
  scavioWalmartOffers: 'walmart.offers',
  scavioWalmartSeller: 'walmart.seller',
  scavioWalmartSellerProducts: 'walmart.sellerProducts',
  scavioThreadsProfile: 'threads.profile',
  scavioThreadsUserPosts: 'threads.userPosts',
  scavioThreadsUserReplies: 'threads.userReplies',
  scavioThreadsPost: 'threads.post',
  scavioThreadsPostComments: 'threads.postComments',
  scavioThreadsSearchUsers: 'threads.searchUsers',
  scavioKuaishouProfile: 'kuaishou.profile',
  scavioKuaishouUserPosts: 'kuaishou.userPosts',
  scavioKuaishouUserLive: 'kuaishou.userLive',
  scavioKuaishouUserResolve: 'kuaishou.userResolve',
  scavioKuaishouVideo: 'kuaishou.video',
  scavioKuaishouVideoComments: 'kuaishou.videoComments',
  scavioKuaishouCommentReplies: 'kuaishou.commentReplies',
  scavioKuaishouVideosBatch: 'kuaishou.videosBatch',
  scavioKuaishouSearch: 'kuaishou.search',
  scavioKuaishouSearchVideos: 'kuaishou.searchVideos',
  scavioKuaishouSearchUsers: 'kuaishou.searchUsers',
  scavioKuaishouSearchLive: 'kuaishou.searchLive',
  scavioKuaishouTagFeed: 'kuaishou.tagFeed',
  scavioKuaishouTrending: 'kuaishou.trending',
  scavioEbaySearch: 'ebay.search',
  scavioEbayProduct: 'ebay.product',
  scavioEbaySeller: 'ebay.seller',
  scavioTargetSearch: 'target.search',
  scavioTargetCategory: 'target.category',
  scavioTargetProduct: 'target.product',
  scavioTargetReviews: 'target.reviews',
  scavioHomeDepotSearch: 'homeDepot.search',
  scavioHomeDepotProduct: 'homeDepot.product',
  scavioHomeDepotReviews: 'homeDepot.reviews',
  scavioZillowSearch: 'zillow.search',
  scavioZillowProperty: 'zillow.property',
  scavioZillowAgentReviews: 'zillow.agentReviews',
  scavioBookingSearch: 'booking.search',
  scavioBookingHotel: 'booking.hotel',
  scavioBookingReviews: 'booking.reviews',
  scavioTripadvisorLocations: 'tripadvisor.locations',
  scavioTripadvisorSearch: 'tripadvisor.search',
  scavioTripadvisorLocation: 'tripadvisor.location',
  scavioTripadvisorReviews: 'tripadvisor.reviews',
  scavioIndeedSearch: 'indeed.search',
  scavioIndeedJob: 'indeed.job',
  scavioIndeedCompany: 'indeed.company',
  scavioIndeedCompanyReviews: 'indeed.companyReviews',
  scavioAirbnbSearch: 'airbnb.search',
  scavioAirbnbListing: 'airbnb.listing',
  scavioAirbnbReviews: 'airbnb.reviews',
  scavioGlassdoorCompanies: 'glassdoor.companies',
  scavioGlassdoorCompany: 'glassdoor.company',
  scavioGlassdoorReviews: 'glassdoor.reviews',
  scavioGlassdoorSalaries: 'glassdoor.salaries',
  scavioYelpSearch: 'yelp.search',
  scavioYelpBusiness: 'yelp.business',
  scavioYelpReviews: 'yelp.reviews',
  scavioAppStoreSearch: 'appStore.search',
  scavioAppStoreApp: 'appStore.app',
  scavioAppStoreReviews: 'appStore.reviews',
  scavioGooglePlaySearch: 'googlePlay.search',
  scavioGooglePlayApp: 'googlePlay.app',
  scavioGooglePlayReviews: 'googlePlay.reviews',
  scavioSecLookup: 'sec.lookup',
  scavioSecCompany: 'sec.company',
  scavioSecFilings: 'sec.filings',
  scavioSecConcept: 'sec.concept',
  scavioSecFacts: 'sec.facts',
  scavioSecSearch: 'sec.search',
  scavioRedfinSearch: 'redfin.search',
  scavioRedfinProperty: 'redfin.property',
  scavioRedfinMarket: 'redfin.market',
  scavioCompaniesHouseSearch: 'companiesHouse.search',
  scavioCompaniesHouseCompany: 'companiesHouse.company',
  scavioCompaniesHouseOfficers: 'companiesHouse.officers',
  scavioCompaniesHouseFilingHistory: 'companiesHouse.filingHistory',
  scavioG2Search: 'g2.search',
  scavioG2Product: 'g2.product',
  scavioG2Reviews: 'g2.reviews',
  scavioCapterraSearch: 'capterra.search',
  scavioCapterraProduct: 'capterra.product',
  scavioCapterraReviews: 'capterra.reviews',
  scavioGoogleAdsAdvertisers: 'googleAds.advertisers',
  scavioGoogleAdsSearch: 'googleAds.search',
  scavioGoogleAdsCreative: 'googleAds.creative',
  scavioMetaAdsSearch: 'metaAds.search',
  scavioMetaAdsAdvertiser: 'metaAds.advertiser',
  scavioMetaAdsAd: 'metaAds.ad',
};

const fanoutSpecs: AnyScavioToolSpec[] = [
  ...extractToolSpecs,
  ...walmartToolSpecs,
  ...threadsToolSpecs,
  ...kuaishouToolSpecs,
  ...ebayToolSpecs,
  ...targetToolSpecs,
  ...homeDepotToolSpecs,
  ...zillowToolSpecs,
  ...bookingToolSpecs,
  ...tripadvisorToolSpecs,
  ...indeedToolSpecs,
  ...airbnbToolSpecs,
  ...glassdoorToolSpecs,
  ...yelpToolSpecs,
  ...appStoreToolSpecs,
  ...googlePlayToolSpecs,
  ...secToolSpecs,
  ...redfinToolSpecs,
  ...companiesHouseToolSpecs,
  ...g2ToolSpecs,
  ...capterraToolSpecs,
  ...googleAdsToolSpecs,
  ...metaAdsToolSpecs,
];

/** One valid value per zod field, read off the schema rather than hand-written. */
const sampleFor = (schema: any): unknown => {
  const definition = schema._def;
  switch (definition.typeName) {
    case 'ZodOptional':
    case 'ZodNullable':
      return sampleFor(definition.innerType);
    case 'ZodEnum':
      return definition.values[0];
    case 'ZodLiteral':
      return definition.value;
    case 'ZodUnion':
      return sampleFor(definition.options[0]);
    case 'ZodArray':
      return [sampleFor(definition.type)];
    case 'ZodNumber':
      return 1;
    case 'ZodBoolean':
      return true;
    default:
      return 'x';
  }
};

const requiredInput = (spec: AnyScavioToolSpec): Record<string, unknown> => {
  const shape = (spec.inputSchema as any).shape as Record<string, any>;
  const input: Record<string, unknown> = {};
  for (const [name, field] of Object.entries(shape)) {
    if (!field.isOptional()) {
      input[name] = sampleFor(field);
    }
  }
  return input;
};

describe('fanout routing', () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it('registers one tool per fanout endpoint', () => {
    expect(fanoutSpecs).toHaveLength(93);
    const registered = new Set(Object.keys(createScavioTools({ apiKey: 'test-key' })));
    const missing = Object.keys(CALL_PATHS).filter(key => !registered.has(key));
    expect(missing).toEqual([]);
  });

  it.each(Object.keys(CALL_PATHS))('%s calls the endpoint it documents', async key => {
    const spec = fanoutSpecs.find(candidate => candidate.key === key)!;
    const tools = createScavioTools({ apiKey: 'test-key' }) as Record<string, any>;
    const input = requiredInput(spec);

    const result = await tools[key].execute(input, {} as any);

    expect(calls.map(entry => entry.path)).toEqual([CALL_PATHS[key]]);
    expect(calls[0].input).toEqual(input);
    expect(result).toEqual({ data: { ok: true }, credits_used: 1 });
  });

  // scavio.extract({ url }), never scavio.extract.extract({ url }). It is a
  // core endpoint surfaced as a top-level method, not a namespace.
  it('reaches extract as a top-level method, not a namespace', async () => {
    const tools = createScavioTools({ apiKey: 'test-key' });
    await tools.scavioExtract.execute!({ url: 'https://example.com' }, {} as any);
    expect(calls[0].path).toBe('extract');
    expect(calls[0].path).not.toBe('extract.extract');
  });

  // The route is /api/v1/meta-ads/* while the namespace is metaAds; three more
  // paths diverge from their method name. Every one is copied, never derived.
  it('copies the paths that do not match their method name', () => {
    const endpointFor = (key: string) =>
      fanoutSpecs.find(spec => spec.key === key)!.endpoint;
    expect(endpointFor('scavioMetaAdsSearch')).toBe('/api/v1/meta-ads/search');
    expect(endpointFor('scavioMetaAdsAdvertiser')).toBe('/api/v1/meta-ads/advertiser');
    expect(endpointFor('scavioMetaAdsAd')).toBe('/api/v1/meta-ads/ad');
    expect(endpointFor('scavioWalmartSellerProducts')).toBe('/api/v1/walmart/seller-products');
    expect(endpointFor('scavioCompaniesHouseFilingHistory')).toBe(
      '/api/v1/companieshouse/filing-history',
    );
    expect(endpointFor('scavioKuaishouCommentReplies')).toBe(
      '/api/v1/kuaishou/video/sub-comments',
    );
  });

  it('gives every fanout tool a platform that SCAVIO_PLATFORMS declares', () => {
    const declared = new Set<string>(SCAVIO_PLATFORMS);
    const undeclared = fanoutSpecs.filter(spec => !declared.has(spec.platform));
    expect(undeclared.map(spec => spec.platform)).toEqual([]);
  });

  it('describes every parameter - the schema is all the model sees', () => {
    const undescribed: string[] = [];
    for (const spec of fanoutSpecs) {
      const shape = (spec.inputSchema as any).shape as Record<string, any>;
      for (const [name, field] of Object.entries(shape)) {
        if (!field.description) {
          undescribed.push(`${spec.key}.${name}`);
        }
      }
    }
    expect(undescribed).toEqual([]);
  });
});

describe('fanout endpoint coverage', () => {
  const endpointsFor = (specs: AnyScavioToolSpec[]) => specs.map(spec => spec.endpoint).sort();

  it('covers all 7 Walmart endpoints', () => {
    expect(walmartToolSpecs).toHaveLength(7);
    expect(endpointsFor(walmartToolSpecs)).toEqual(
      [
        '/api/v1/walmart/search',
        '/api/v1/walmart/product',
        '/api/v1/walmart/reviews',
        '/api/v1/walmart/category',
        '/api/v1/walmart/offers',
        '/api/v1/walmart/seller',
        '/api/v1/walmart/seller-products',
      ].sort(),
    );
  });

  it('covers all 6 Threads endpoints', () => {
    expect(threadsToolSpecs).toHaveLength(6);
    expect(endpointsFor(threadsToolSpecs)).toEqual(
      [
        '/api/v1/threads/profile',
        '/api/v1/threads/user/posts',
        '/api/v1/threads/user/replies',
        '/api/v1/threads/post',
        '/api/v1/threads/post/comments',
        '/api/v1/threads/search/users',
      ].sort(),
    );
  });

  it('covers all 14 Kuaishou (China) endpoints', () => {
    expect(kuaishouToolSpecs).toHaveLength(14);
    expect(endpointsFor(kuaishouToolSpecs)).toEqual(
      [
        '/api/v1/kuaishou/profile',
        '/api/v1/kuaishou/user/posts',
        '/api/v1/kuaishou/user/live',
        '/api/v1/kuaishou/user/resolve',
        '/api/v1/kuaishou/video',
        '/api/v1/kuaishou/video/comments',
        '/api/v1/kuaishou/video/sub-comments',
        '/api/v1/kuaishou/videos/batch',
        '/api/v1/kuaishou/search',
        '/api/v1/kuaishou/search/videos',
        '/api/v1/kuaishou/search/users',
        '/api/v1/kuaishou/search/live',
        '/api/v1/kuaishou/tag/feed',
        '/api/v1/kuaishou/trending',
      ].sort(),
    );
  });

  it('covers all 3 eBay endpoints', () => {
    expect(ebayToolSpecs).toHaveLength(3);
    expect(endpointsFor(ebayToolSpecs)).toEqual(
      [
        '/api/v1/ebay/search',
        '/api/v1/ebay/product',
        '/api/v1/ebay/seller',
      ].sort(),
    );
  });

  it('covers all 4 Target endpoints', () => {
    expect(targetToolSpecs).toHaveLength(4);
    expect(endpointsFor(targetToolSpecs)).toEqual(
      [
        '/api/v1/target/search',
        '/api/v1/target/category',
        '/api/v1/target/product',
        '/api/v1/target/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Home Depot endpoints', () => {
    expect(homeDepotToolSpecs).toHaveLength(3);
    expect(endpointsFor(homeDepotToolSpecs)).toEqual(
      [
        '/api/v1/homedepot/search',
        '/api/v1/homedepot/product',
        '/api/v1/homedepot/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Zillow endpoints', () => {
    expect(zillowToolSpecs).toHaveLength(3);
    expect(endpointsFor(zillowToolSpecs)).toEqual(
      [
        '/api/v1/zillow/search',
        '/api/v1/zillow/property',
        '/api/v1/zillow/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Booking.com endpoints', () => {
    expect(bookingToolSpecs).toHaveLength(3);
    expect(endpointsFor(bookingToolSpecs)).toEqual(
      [
        '/api/v1/booking/search',
        '/api/v1/booking/hotel',
        '/api/v1/booking/reviews',
      ].sort(),
    );
  });

  it('covers all 4 Tripadvisor endpoints', () => {
    expect(tripadvisorToolSpecs).toHaveLength(4);
    expect(endpointsFor(tripadvisorToolSpecs)).toEqual(
      [
        '/api/v1/tripadvisor/locations',
        '/api/v1/tripadvisor/search',
        '/api/v1/tripadvisor/location',
        '/api/v1/tripadvisor/reviews',
      ].sort(),
    );
  });

  it('covers all 4 Indeed endpoints', () => {
    expect(indeedToolSpecs).toHaveLength(4);
    expect(endpointsFor(indeedToolSpecs)).toEqual(
      [
        '/api/v1/indeed/search',
        '/api/v1/indeed/job',
        '/api/v1/indeed/company',
        '/api/v1/indeed/company/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Airbnb endpoints', () => {
    expect(airbnbToolSpecs).toHaveLength(3);
    expect(endpointsFor(airbnbToolSpecs)).toEqual(
      [
        '/api/v1/airbnb/search',
        '/api/v1/airbnb/listing',
        '/api/v1/airbnb/reviews',
      ].sort(),
    );
  });

  it('covers all 4 Glassdoor endpoints', () => {
    expect(glassdoorToolSpecs).toHaveLength(4);
    expect(endpointsFor(glassdoorToolSpecs)).toEqual(
      [
        '/api/v1/glassdoor/companies',
        '/api/v1/glassdoor/company',
        '/api/v1/glassdoor/reviews',
        '/api/v1/glassdoor/salaries',
      ].sort(),
    );
  });

  it('covers all 3 Yelp endpoints', () => {
    expect(yelpToolSpecs).toHaveLength(3);
    expect(endpointsFor(yelpToolSpecs)).toEqual(
      [
        '/api/v1/yelp/search',
        '/api/v1/yelp/business',
        '/api/v1/yelp/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Apple App Store endpoints', () => {
    expect(appStoreToolSpecs).toHaveLength(3);
    expect(endpointsFor(appStoreToolSpecs)).toEqual(
      [
        '/api/v1/appstore/search',
        '/api/v1/appstore/app',
        '/api/v1/appstore/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Google Play endpoints', () => {
    expect(googlePlayToolSpecs).toHaveLength(3);
    expect(endpointsFor(googlePlayToolSpecs)).toEqual(
      [
        '/api/v1/googleplay/search',
        '/api/v1/googleplay/app',
        '/api/v1/googleplay/reviews',
      ].sort(),
    );
  });

  it('covers all 6 SEC EDGAR endpoints', () => {
    expect(secToolSpecs).toHaveLength(6);
    expect(endpointsFor(secToolSpecs)).toEqual(
      [
        '/api/v1/sec/lookup',
        '/api/v1/sec/company',
        '/api/v1/sec/filings',
        '/api/v1/sec/concept',
        '/api/v1/sec/facts',
        '/api/v1/sec/search',
      ].sort(),
    );
  });

  it('covers all 3 Redfin endpoints', () => {
    expect(redfinToolSpecs).toHaveLength(3);
    expect(endpointsFor(redfinToolSpecs)).toEqual(
      [
        '/api/v1/redfin/search',
        '/api/v1/redfin/property',
        '/api/v1/redfin/market',
      ].sort(),
    );
  });

  it('covers all 4 Companies House endpoints', () => {
    expect(companiesHouseToolSpecs).toHaveLength(4);
    expect(endpointsFor(companiesHouseToolSpecs)).toEqual(
      [
        '/api/v1/companieshouse/search',
        '/api/v1/companieshouse/company',
        '/api/v1/companieshouse/officers',
        '/api/v1/companieshouse/filing-history',
      ].sort(),
    );
  });

  it('covers all 3 G2 Software Reviews endpoints', () => {
    expect(g2ToolSpecs).toHaveLength(3);
    expect(endpointsFor(g2ToolSpecs)).toEqual(
      [
        '/api/v1/g2/search',
        '/api/v1/g2/product',
        '/api/v1/g2/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Capterra Software Reviews endpoints', () => {
    expect(capterraToolSpecs).toHaveLength(3);
    expect(endpointsFor(capterraToolSpecs)).toEqual(
      [
        '/api/v1/capterra/search',
        '/api/v1/capterra/product',
        '/api/v1/capterra/reviews',
      ].sort(),
    );
  });

  it('covers all 3 Google Ads Transparency endpoints', () => {
    expect(googleAdsToolSpecs).toHaveLength(3);
    expect(endpointsFor(googleAdsToolSpecs)).toEqual(
      [
        '/api/v1/googleads/advertisers',
        '/api/v1/googleads/search',
        '/api/v1/googleads/creative',
      ].sort(),
    );
  });

  it('covers all 3 Meta Ad Library endpoints', () => {
    expect(metaAdsToolSpecs).toHaveLength(3);
    expect(endpointsFor(metaAdsToolSpecs)).toEqual(
      [
        '/api/v1/meta-ads/search',
        '/api/v1/meta-ads/advertiser',
        '/api/v1/meta-ads/ad',
      ].sort(),
    );
  });
});

describe('body-priced surfaces never state a flat cost', () => {
  const describedBy = (key: string) =>
    fanoutSpecs.find(spec => spec.key === key)!.description;

  // Walmart is priced by `domain`: com and ca are 1 credit, com.mx is 2. Only
  // search and category take a domain at all.
  it('walmart search and category state the domain rule', () => {
    for (const key of ['scavioWalmartSearch', 'scavioWalmartCategory']) {
      expect(describedBy(key)).toContain('1 credit');
      expect(describedBy(key)).toContain('2 credits');
      expect(describedBy(key)).toContain('com.mx');
    }
  });

  it('the walmart endpoints with no domain say why they are always 1', () => {
    for (const key of [
      'scavioWalmartProduct',
      'scavioWalmartReviews',
      'scavioWalmartOffers',
      'scavioWalmartSeller',
      'scavioWalmartSellerProducts',
    ]) {
      expect(describedBy(key)).toContain('1 credit');
    }
  });

  // 2 credits addressed by user_id, 4 by username - the handle costs a second
  // upstream call. Only these three endpoints have a username form.
  it('threads prices the handle lookup on the three username-keyed tools', () => {
    for (const key of [
      'scavioThreadsProfile',
      'scavioThreadsUserPosts',
      'scavioThreadsUserReplies',
    ]) {
      expect(describedBy(key)).toContain('2 credits');
      expect(describedBy(key)).toContain('4');
      expect(describedBy(key)).toContain('user_id');
    }
  });

  // 1, 2, 10 or 40 - a single platform figure would be wrong by up to 40x.
  it('kuaishou prices each endpoint on its own', () => {
    expect(describedBy('scavioKuaishouProfile')).toContain('10 credits');
    expect(describedBy('scavioKuaishouVideo')).toContain('2 credits');
    expect(describedBy('scavioKuaishouVideosBatch')).toContain('40 credits');
    expect(describedBy('scavioKuaishouUserPosts')).toContain('1 credit');
    for (const key of [
      'scavioKuaishouSearch',
      'scavioKuaishouSearchVideos',
      'scavioKuaishouSearchUsers',
      'scavioKuaishouSearchLive',
    ]) {
      expect(describedBy(key)).toContain('10 credits');
    }
  });

  it('extract prices by mode and says a failed fetch is free', () => {
    expect(describedBy('scavioExtract')).toContain('1 credit');
    expect(describedBy('scavioExtract')).toContain('ultra costs 2');
    expect(describedBy('scavioExtract')).toContain('costs nothing');
  });
});

describe('flat-priced platforms', () => {
  const creditsFor = (key: string) => fanoutSpecs.find(spec => spec.key === key)!.credits;

  it('prices G2 at 5, the dearest platform Scavio serves', () => {
    for (const key of ['scavioG2Search', 'scavioG2Product', 'scavioG2Reviews']) {
      expect(creditsFor(key)).toBe(5);
    }
  });

  it('prices the six 2-credit platforms at 2', () => {
    for (const key of [
      'scavioHomeDepotSearch',
      'scavioTripadvisorLocations',
      'scavioIndeedSearch',
      'scavioYelpSearch',
      'scavioGooglePlaySearch',
      'scavioCapterraSearch',
    ]) {
      expect(creditsFor(key)).toBe(2);
    }
  });

  it('prices the rest at 1', () => {
    for (const key of [
      'scavioEbaySearch',
      'scavioTargetSearch',
      'scavioZillowSearch',
      'scavioRedfinSearch',
      'scavioBookingSearch',
      'scavioAirbnbSearch',
      'scavioAppStoreSearch',
      'scavioSecLookup',
      'scavioCompaniesHouseSearch',
      'scavioGoogleAdsAdvertisers',
      'scavioMetaAdsSearch',
    ]) {
      expect(creditsFor(key)).toBe(1);
    }
  });
});
