import { z } from 'zod';

import { defineScavioTool, toolFactory } from './tool.js';
import type { ScavioToolSpec } from './tool.js';

// Google runs on /api/v2/google. v1 (/api/v1/google) was retired on 2026-08-04
// and now answers 410, so none of its vocabulary survives here: no
// light_request, no country_code/language/page, no search_type. v2 speaks
// gl/hl/start/google_domain/device, and its bodies are FLAT - the payload is
// spread at the top level next to response_time and credits_used, with no
// `data` wrapper. Every Google endpoint costs 1 credit.

const gl = z
  .string()
  .optional()
  .describe("Country of the search (ISO 3166-1 alpha-2, e.g. 'us', 'gb', 'de').");
const hl = z.string().optional().describe("UI language (ISO 639-1, e.g. 'en').");
const googleDomain = z
  .string()
  .optional()
  .describe("Regional Google domain, e.g. 'google.co.uk'.");
const location = z
  .string()
  .optional()
  .describe("Canonical location name, e.g. 'Austin, Texas, United States'. Encoded server-side.");
const device = z.enum(['desktop', 'mobile']).optional().describe('Device to emulate.');
const currency = z.string().optional().describe("Currency code (ISO 4217, e.g. 'USD').");
const checkInDate = z.string().describe('Check-in date (YYYY-MM-DD).');
const checkOutDate = z.string().describe('Check-out date (YYYY-MM-DD).');

export const googleToolSpecs: ScavioToolSpec[] = [
  defineScavioTool({
    key: 'scavioGoogleSearch',
    id: 'scavio-google-search',
    platform: 'google',
    endpoint: '/api/v2/google',
    credits: 1,
    description:
      'Search Google in real time via Scavio (1 credit). Returns organic_results (each with title, link and snippet) plus knowledge_graph, related_questions, ads and the AI overview when Google shows one. The body is flat - read organic_results at the top level, not under data.',
    inputSchema: z.object({
      query: z.string().describe('The search query (1-500 characters).'),
      gl,
      hl,
      google_domain: googleDomain,
      location,
      device,
      start: z
        .number()
        .optional()
        .describe('Result offset, not a page number: 0 is page 1, 10 is page 2, up to 990.'),
      time_period: z
        .enum(['last_hour', 'last_day', 'last_week', 'last_month', 'last_year'])
        .optional()
        .describe('Restrict results to a recent time window.'),
      safe: z.literal('active').optional().describe("Turn SafeSearch on with 'active'."),
      nfpr: z.boolean().optional().describe('Disable spelling correction and auto-fixes.'),
    }),
    call: (client, input) => client.google.search(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleAiMode',
    id: 'scavio-google-ai-mode',
    platform: 'google',
    endpoint: '/api/v2/google/ai-mode',
    credits: 1,
    description:
      "Ask Google AI Mode a question via Scavio (1 credit). Returns Google's generated answer with its cited sources - use it for a synthesized answer, and scavio-google-search for a ranked result list.",
    inputSchema: z.object({
      query: z.string().describe('Question or prompt (1-500 characters).'),
      gl,
      hl,
      google_domain: googleDomain,
      location,
      device,
      safe: z.literal('active').optional().describe("Turn SafeSearch on with 'active'."),
    }),
    call: (client, input) => client.google.aiMode(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleMapsSearch',
    id: 'scavio-google-maps-search',
    platform: 'google',
    endpoint: '/api/v2/google/maps/search',
    credits: 1,
    description:
      'Search Google Maps for local businesses and places via Scavio (1 credit). Returns local results with ratings, review counts, addresses, phone numbers and place ids. Feed a place_id into scavio-google-maps-place or scavio-google-maps-reviews.',
    inputSchema: z.object({
      query: z.string().describe("Search query, e.g. 'coffee shops in Austin' (1-500 characters)."),
      ll: z
        .string()
        .optional()
        .describe("Map centre as '@lat,lng,zoomz'; controls which area results come from."),
      start: z
        .number()
        .optional()
        .describe('Result offset; must be a multiple of 20 (0, 20, 40, ...).'),
      gl,
      hl,
      google_domain: googleDomain,
    }),
    call: (client, input) => client.google.mapsSearch(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleMapsPlace',
    id: 'scavio-google-maps-place',
    platform: 'google',
    endpoint: '/api/v2/google/maps/place',
    credits: 1,
    description:
      'Fetch one Google Maps place in full via Scavio (1 credit): hours, address, phone, website, rating, price level and photos. Provide place_id or data_cid.',
    inputSchema: z.object({
      place_id: z.string().optional().describe('Place ID (starts with ChIJ).'),
      data_cid: z.string().optional().describe('Numeric CID, as an alternative to place_id.'),
    }),
    call: (client, input) => client.google.mapsPlace(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleMapsReviews',
    id: 'scavio-google-maps-reviews',
    platform: 'google',
    endpoint: '/api/v2/google/maps/reviews',
    credits: 1,
    description:
      'List Google Maps reviews for a place via Scavio (1 credit). Provide data_id or place_id. Page with next_page_token; each page costs another credit.',
    inputSchema: z.object({
      place_id: z.string().optional().describe('Place ID (starts with ChIJ).'),
      data_id: z.string().optional().describe('Data ID in 0xHEX:0xHEX form.'),
      num: z.number().optional().describe('Reviews per page (1-20).'),
      sort_by: z
        .enum(['relevance', 'newest', 'highest_rating', 'lowest_rating'])
        .optional()
        .describe('Review sort order.'),
      next_page_token: z.string().optional().describe('Pagination cursor from a prior response.'),
      gl,
      hl,
      google_domain: googleDomain,
    }),
    call: (client, input) => client.google.mapsReviews(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleShopping',
    id: 'scavio-google-shopping',
    platform: 'google',
    endpoint: '/api/v2/google/shopping',
    credits: 1,
    description:
      'Search Google Shopping via Scavio (1 credit). Returns product cards with prices, merchants, ratings and catalog ids across retailers - use it for cross-retailer price comparison, and scavio-amazon-search or scavio-walmart-search for a single marketplace.',
    inputSchema: z.object({
      query: z.string().describe('Product search query (1-500 characters).'),
      min_price: z.number().optional().describe('Minimum price filter.'),
      max_price: z.number().optional().describe('Maximum price filter.'),
      sort_by: z
        .number()
        .optional()
        .describe('0 = relevance, 1 = price ascending, 2 = price descending.'),
      free_shipping: z.boolean().optional().describe('Only items with free shipping.'),
      on_sale: z.boolean().optional().describe('Only items on sale.'),
      start: z.number().optional().describe('Result offset.'),
      gl,
      hl,
      google_domain: googleDomain,
      location,
      device,
    }),
    call: (client, input) => client.google.shopping(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleShoppingProduct',
    id: 'scavio-google-shopping-product',
    platform: 'google',
    endpoint: '/api/v2/google/shopping/product',
    credits: 1,
    description:
      'Fetch one Google Shopping product via Scavio (1 credit): specs, reviews, and the sellers carrying it. Pass catalog_id together with query for full detail and the seller list.',
    inputSchema: z.object({
      catalog_id: z.string().optional().describe('Durable product catalog id from a shopping search.'),
      query: z.string().optional().describe('Product query. Required when catalog_id is set.'),
      product_id: z.string().optional().describe('Product id, as an alternative to catalog_id.'),
      page_token: z.string().optional().describe('Immersive product page token.'),
      sort_by: z
        .enum(['base_price', 'total_price', 'promotion', 'seller_rating'])
        .optional()
        .describe('Seller sort order.'),
      load_all_stores: z.boolean().optional().describe('Load every available store.'),
      more_stores: z.boolean().optional().describe('Fetch additional stores.'),
      gl,
      hl,
      google_domain: googleDomain,
      location,
      device: z.enum(['desktop', 'mobile', 'tablet']).optional().describe('Device to emulate.'),
    }),
    call: (client, input) => client.google.shoppingProduct(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleShoppingStores',
    id: 'scavio-google-shopping-stores',
    platform: 'google',
    endpoint: '/api/v2/google/shopping/product/stores',
    credits: 1,
    description:
      'Fetch the next page of sellers for a Google Shopping product via Scavio (1 credit). Continuation of scavio-google-shopping-product: pass the same catalog_id plus that response next_page_token.',
    inputSchema: z.object({
      catalog_id: z.string().describe('Durable product catalog id.'),
      next_page_token: z.string().describe('Pagination cursor from scavio-google-shopping-product.'),
    }),
    call: (client, input) => client.google.shoppingStores(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleFlights',
    id: 'scavio-google-flights',
    platform: 'google',
    endpoint: '/api/v2/google/flights',
    credits: 1,
    description:
      'Search Google Flights via Scavio (1 credit). Returns itineraries with prices, airlines, stops, durations and carbon emissions. Airports are IATA codes; dates are YYYY-MM-DD.',
    inputSchema: z.object({
      departure_id: z.string().describe("Departure IATA code(s), comma-separated allowed, e.g. 'JFK'."),
      arrival_id: z.string().describe("Arrival IATA code(s), comma-separated allowed, e.g. 'LHR'."),
      outbound_date: z.string().describe('Outbound date (YYYY-MM-DD).'),
      return_date: z.string().optional().describe('Return date (YYYY-MM-DD). Required when type is 1.'),
      type: z.number().optional().describe('1 = round trip (default), 2 = one way, 3 = multi-city.'),
      adults: z.number().optional().describe('Number of adults (1-9).'),
      children: z.number().optional().describe('Number of children (0-9).'),
      travel_class: z
        .number()
        .optional()
        .describe('1 = economy, 2 = premium economy, 3 = business, 4 = first.'),
      stops: z.number().optional().describe('0 = any, 1 = nonstop, 2 = one stop or fewer, 3 = two or fewer.'),
      sort_by: z
        .number()
        .optional()
        .describe('1 = top, 2 = price, 3 = departure, 4 = arrival, 5 = duration, 6 = emissions.'),
      include_airlines: z.string().optional().describe('Comma-separated airline or alliance codes to include.'),
      exclude_airlines: z.string().optional().describe('Comma-separated airline or alliance codes to exclude.'),
      currency,
      gl,
      hl,
    }),
    call: (client, input) => client.google.flights(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleHotels',
    id: 'scavio-google-hotels',
    platform: 'google',
    endpoint: '/api/v2/google/hotels',
    credits: 1,
    description:
      "Search Google Hotels via Scavio (1 credit). Returns properties with nightly prices, ratings, amenities and a detail_token for scavio-google-hotels-detail. Phrase the query as '<City> hotels'.",
    inputSchema: z.object({
      query: z.string().describe("Search query; use a '<City> hotels' form."),
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      sort_by: z.number().optional().describe('3 = lowest price, 8 = highest rating, 13 = most reviewed.'),
      min_price: z.number().optional().describe('Minimum nightly price.'),
      max_price: z.number().optional().describe('Maximum nightly price.'),
      rating: z.number().optional().describe('7 = 3.5+, 8 = 4.0+, 9 = 4.5+.'),
      hotel_class: z.string().optional().describe('Comma-separated star ratings (2-5).'),
      amenities: z.string().optional().describe('Comma-separated amenity ids.'),
      property_types: z.string().optional().describe("Comma-separated property-type ids, e.g. '12' for vacation rentals."),
      free_cancellation: z.boolean().optional().describe('Only properties with free cancellation.'),
      eco_certified: z.boolean().optional().describe('Only eco-certified properties.'),
      special_offers: z.boolean().optional().describe('Only properties with special offers.'),
      limit: z.number().optional().describe('Number of properties to return (1-20).'),
      next_page_token: z.string().optional().describe('Pagination cursor from a prior response.'),
      currency,
      gl,
      hl,
    }),
    call: (client, input) => client.google.hotels(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleHotelsDetail',
    id: 'scavio-google-hotels-detail',
    platform: 'google',
    endpoint: '/api/v2/google/hotels/detail',
    credits: 1,
    description:
      'Fetch one Google Hotels property in full via Scavio (1 credit): room types, per-night prices by provider, amenities, photos and reviews. Needs a detail_token from scavio-google-hotels and the same stay dates.',
    inputSchema: z.object({
      detail_token: z.string().describe('Property detail token from a hotels listing.'),
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      currency,
      gl,
      hl,
    }),
    call: (client, input) => client.google.hotelsDetail(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleNews',
    id: 'scavio-google-news',
    platform: 'google',
    endpoint: '/api/v2/google/news',
    credits: 1,
    description:
      'Fetch Google News via Scavio (1 credit). Pass query to search, or a topic_token / story_token / publication_token from an earlier response to browse a topic, a full story or one publisher.',
    inputSchema: z.object({
      query: z.string().optional().describe('Keyword search.'),
      topic_token: z.string().optional().describe('Browse a news topic.'),
      section_token: z.string().optional().describe('Browse a topic section.'),
      story_token: z.string().optional().describe('Fetch full coverage of one story.'),
      publication_token: z.string().optional().describe('Browse one publication.'),
      so: z.number().optional().describe('Sort: 0 = relevance, 1 = date. Only applies with query.'),
      gl,
      hl,
      google_domain: googleDomain,
    }),
    call: (client, input) => client.google.news(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleTrends',
    id: 'scavio-google-trends',
    platform: 'google',
    endpoint: '/api/v2/google/trends',
    credits: 1,
    description:
      'Fetch Google Trends interest data via Scavio (1 credit). Comma-separate the query to compare terms, and pick the dataset with data_type: TIMESERIES for interest over time, GEO_MAP for interest by region, RELATED_QUERIES or RELATED_TOPICS for rising searches.',
    inputSchema: z.object({
      query: z.string().describe('Search term(s); comma-separated to compare up to five.'),
      data_type: z
        .enum(['TIMESERIES', 'GEO_MAP', 'GEO_MAP_0', 'RELATED_QUERIES', 'RELATED_TOPICS'])
        .optional()
        .describe('Which trends dataset to return.'),
      geo: z.string().optional().describe("Location code, e.g. 'US', 'GB', 'US-CA'. Omit for worldwide."),
      date: z.string().optional().describe("Time range, e.g. 'today 12-m', 'now 7-d'."),
      cat: z.string().optional().describe('Category id.'),
      gprop: z
        .enum(['images', 'news', 'youtube', 'froogle'])
        .optional()
        .describe('Restrict to a Google property.'),
      region: z
        .enum(['COUNTRY', 'REGION', 'DMA', 'CITY'])
        .optional()
        .describe('Resolution for GEO_MAP data.'),
      tz: z.string().optional().describe('Timezone offset in minutes.'),
      hl,
    }),
    call: (client, input) => client.google.trends(input),
  }),
  defineScavioTool({
    key: 'scavioGoogleTrending',
    id: 'scavio-google-trending',
    platform: 'google',
    endpoint: '/api/v2/google/trending',
    credits: 1,
    description:
      'List what is trending on Google right now for one country via Scavio (1 credit). geo is required. Use scavio-google-trends instead when you already know the term you care about.',
    inputSchema: z.object({
      geo: z.string().describe("Country code, e.g. 'US'."),
      hours: z.number().optional().describe('Trending window in hours: 4, 24, 48 or 168.'),
      cat: z.number().optional().describe('Category id (0-20).'),
      sort: z
        .enum(['relevance', 'search_volume', 'recency', 'title'])
        .optional()
        .describe('Sort order.'),
      status: z.enum(['all', 'active']).optional().describe('Filter by trend status.'),
      hl,
    }),
    call: (client, input) => client.google.trending(input),
  }),
];

export const createScavioGoogleSearchTool = toolFactory(googleToolSpecs, 'scavioGoogleSearch');
