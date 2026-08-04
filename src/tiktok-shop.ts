import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { AnyScavioToolSpec } from './tool.js';

// TikTok Shop - 8 endpoints, 1 credit each.
//
// Two things an agent has to be told or it will build the wrong pipeline:
// 1. The keyword field is `search`, not `query`. (`query` only comes BACK in
//    the response, as an echo.)
// 2. Product detail does NOT carry a price - upstream masks it - and it resolves
//    only about 44% of the product ids that search returns. Exact prices come
//    from search, category products and shop products. A 404 on detail is a
//    normal outcome, not an error to retry.
//
// Two region enums exist on purpose: 8 regions almost everywhere, but only
// US/GB for category listings, and /tiktok-shop/search takes no region at all.

const REGIONS_FULL = ['US', 'GB', 'SG', 'MY', 'PH', 'TH', 'VN', 'ID'] as const;

const region = z
  .enum(REGIONS_FULL)
  .optional()
  .describe('Marketplace region. Defaults to US.');
const cursor = z
  .string()
  .optional()
  .describe('Opaque pagination cursor: the next_cursor from a prior response.');
const productId = z.string().describe('TikTok Shop product id (6-25 digits).');

export const tiktokShopToolSpecs: AnyScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioTiktokShopSearch',
    id: 'scavio-tiktok-shop-search',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/search',
    credits: 1,
    description:
      'Search the TikTok Shop catalog by keyword via Scavio (1 credit). US catalog only - this endpoint takes no region. Returns up to 30 product cards per page with EXACT prices, ratings, sold_count and shop details, plus next_cursor. Dedupe by product_id across pages. data.degraded true means the page is short because the retry budget ran out, not because the niche is small.',
    inputSchema: z.object({
      search: z.string().describe('Product search keyword (1-200 characters).'),
      cursor,
    }),
    call: (client, input) => client.tiktokShop.search(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopSearchSuggestions',
    id: 'scavio-tiktok-shop-search-suggestions',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/search/suggestions',
    credits: 1,
    description:
      'Expand a partial TikTok Shop query into keyword suggestions via Scavio (1 credit). Returns bare strings in data.suggestions - no volume or CPC exists upstream, so none is reported. Suggestions are not guaranteed prefix matches: typos come back corrected, and brand or shop names can appear.',
    inputSchema: z.object({
      search: z.string().describe('Partial query to expand (1-100 characters).'),
      region,
    }),
    call: (client, input) => client.tiktokShop.searchSuggestions(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopProduct',
    id: 'scavio-tiktok-shop-product',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/product',
    credits: 1,
    description:
      'Fetch one TikTok Shop product in full via Scavio (1 credit): description, images, variants with stock, shipping, the shop profile, category path and top reviews. Two limits: prices are masked upstream and come back null (use scavio-tiktok-shop-search for exact prices), and only about 44% of search-derived ids resolve - a 404 means there is no detail record, so skip the item instead of retrying. The 404 is still billed.',
    inputSchema: z.object({ product_id: productId, region }),
    call: (client, input) => client.tiktokShop.product(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopProductReviews',
    id: 'scavio-tiktok-shop-product-reviews',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/product/reviews',
    credits: 1,
    description:
      'Fetch TikTok Shop product reviews via Scavio (1 credit), up to 200 per call, with text, images, star histogram and verified-purchase flags. It often works for ids that product detail cannot resolve, so it doubles as a fallback source. data.total_reviews drifts between calls and must NOT be used to compute a page count - page with has_more. has_media and verified_only share one upstream slot: when both are set, has_media wins.',
    inputSchema: z.object({
      product_id: productId,
      page: z.number().optional().describe('1-based page number (1-500, default 1).'),
      page_size: z.number().optional().describe('Reviews per page (1-200, default 20).'),
      sort: z
        .enum(['relevant', 'recent'])
        .optional()
        .describe('"relevant" (default) is text-complete and image-heavy, "recent" is fresher but text-sparse.'),
      rating: z.number().optional().describe('Only reviews with this star rating (1-5).'),
      has_media: z.boolean().optional().describe('Only reviews with a photo or video.'),
      verified_only: z.boolean().optional().describe('Only verified purchases.'),
      region,
    }),
    call: (client, input) => client.tiktokShop.productReviews(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopCategories',
    id: 'scavio-tiktok-shop-categories',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/categories',
    credits: 1,
    description:
      'Fetch the TikTok Shop category tree via Scavio (1 credit): 28 top-level categories, 240 nodes, two levels deep. Takes no parameters. Category ids are identical in every region and names are always English - fetch once and cache, then feed a category_id to scavio-tiktok-shop-category-products.',
    inputSchema: z.object({}),
    call: client => client.tiktokShop.categories(),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopCategoryProducts',
    id: 'scavio-tiktok-shop-category-products',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/category/products',
    credits: 1,
    description:
      'List TikTok Shop products under a category id via Scavio (1 credit), with EXACT prices. Region is US or GB only here, not the full 8. Page size is inconsistent upstream (15-20), so always follow next_cursor rather than assuming one. Listings are shallow: has_more turning false after a few pages is the end of the listing, not an error.',
    inputSchema: z.object({
      category_id: z
        .string()
        .describe('Category id from scavio-tiktok-shop-categories. Level 1 or 2 both work.'),
      cursor,
      region: z
        .enum(['US', 'GB'])
        .optional()
        .describe('Marketplace region, US or GB only (default US). GB coverage is intermittent.'),
    }),
    call: (client, input) => client.tiktokShop.categoryProducts(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopShopProducts',
    id: 'scavio-tiktok-shop-shop-products',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/shop/products',
    credits: 1,
    description:
      "List a TikTok Shop seller's catalog via Scavio (1 credit), 30 per page with EXACT prices. shop_id is the seller id used elsewhere on TikTok. Follower count, location and shop-level rating are not available here - call scavio-tiktok-shop-product for the full shop profile.",
    inputSchema: z.object({
      shop_id: z.string().describe('TikTok Shop seller id (6-25 digits).'),
      cursor,
      region,
    }),
    call: (client, input) => client.tiktokShop.shopProducts(input),
  }),
  defineScavioTool({
    key: 'scavioTiktokShopResolve',
    id: 'scavio-tiktok-shop-resolve',
    platform: 'tiktok-shop',
    endpoint: '/api/v1/tiktok-shop/resolve',
    credits: 1,
    description:
      'Resolve any TikTok Shop link to a product_id or shop_id via Scavio (1 credit). Accepts shop.tiktok.com product and store pages, tiktok.com/view links, affiliate share links, and vt.tiktok.com short links. Start here when a user hands you a URL, then pass the id to the product or shop tools.',
    inputSchema: z.object({
      url: z.string().describe('A TikTok Shop product or store URL, share link, or short link.'),
    }),
    call: (client, input) => client.tiktokShop.resolve(input),
  }),
];

export const createScavioTiktokShopSearchTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopSearch',
);
export const createScavioTiktokShopSearchSuggestionsTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopSearchSuggestions',
);
export const createScavioTiktokShopProductTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopProduct',
);
export const createScavioTiktokShopProductReviewsTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopProductReviews',
);
export const createScavioTiktokShopCategoriesTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopCategories',
);
export const createScavioTiktokShopCategoryProductsTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopCategoryProducts',
);
export const createScavioTiktokShopShopProductsTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopShopProducts',
);
export const createScavioTiktokShopResolveTool = toolFactory(
  tiktokShopToolSpecs,
  'scavioTiktokShopResolve',
);
