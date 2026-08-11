# mastra-scavio

[Scavio](https://scavio.dev) real-time data tools for [Mastra](https://mastra.ai) agents — **188 tools across 31 platforms** on one API key. Retail (Amazon, Walmart, eBay, Target, Home Depot), real estate (Zillow, Redfin), travel (Booking.com, Airbnb, Tripadvisor), local (Yelp, Google Maps), jobs (Indeed, Glassdoor, LinkedIn), software reviews (G2, Capterra), app stores (App Store, Google Play), company filings (SEC EDGAR, Companies House), ad libraries (Google Ads Transparency, Meta Ad Library), search (Google) and social (YouTube, TikTok, Instagram, X, Reddit, Threads, Kuaishou) — plus `scavioExtract`, which reads any URL as clean Markdown.

> **Amazon changed (breaking).** The upstream provider moved in 2026-07:
> `domain` is replaced by `country`, a two-letter marketplace code (`us`, `gb`
> -- the UK is `gb`, not `uk` -- `de`, `jp`, ...), and `sort_by`, `pages`,
> `category_id`, `merchant_id`, `language`, `currency`, `device`, `zip_code`
> and `autoselect_variant` are gone. The marketplace ignores all of them
> (`sort_by` returns the identical unordered set for every value), so they are
> removed rather than kept as silent no-ops. Rank and filter results yourself.

## Installation

```bash
npm install mastra-scavio @mastra/core zod
```

## Setup

Get a Scavio API key from the [Scavio Dashboard](https://dashboard.scavio.dev) (new accounts get 50 free credits, no credit card). Set `SCAVIO_API_KEY` or pass `{ apiKey }`.

## Usage

```typescript
import { Agent } from '@mastra/core/agent';
import { createScavioTools } from 'mastra-scavio';

const agent = new Agent({
  id: 'web-search-agent',
  name: 'Web Search Agent',
  model: 'anthropic/claude-sonnet-4-6',
  instructions: 'Search the web, shopping sites, and social platforms with Scavio.',
  tools: createScavioTools(), // reads SCAVIO_API_KEY
});
```

Use a single tool instead of the full set:

```typescript
import { createScavioGoogleSearchTool, createScavioLinkedinSearchJobsTool } from 'mastra-scavio';

const agent = new Agent({
  id: 'search-agent',
  model: 'anthropic/claude-sonnet-4-6',
  instructions: 'Search Google and LinkedIn jobs with Scavio.',
  tools: {
    googleSearch: createScavioGoogleSearchTool({ apiKey: process.env.SCAVIO_API_KEY }),
    jobSearch: createScavioLinkedinSearchJobsTool({ apiKey: process.env.SCAVIO_API_KEY }),
  },
});
```

## Tools

`createScavioTools()` returns **188 tools** across 31 platforms plus `extract` — one per billable Scavio endpoint. Requires `scavio@^0.15.0`.

| Platform | Tools | Names |
|---|---|---|
| [Extract (any URL)](https://scavio.dev/docs/extract) | 1 | `scavioExtract` |
| Google | 14 | `scavioGoogleSearch`, `scavioGoogleAiMode`, `scavioGoogleMapsSearch`, `scavioGoogleMapsPlace`, `scavioGoogleMapsReviews`, `scavioGoogleShopping`, `scavioGoogleShoppingProduct`, `scavioGoogleShoppingStores`, `scavioGoogleFlights`, `scavioGoogleHotels`, `scavioGoogleHotelsDetail`, `scavioGoogleNews`, `scavioGoogleTrends`, `scavioGoogleTrending` |
| Amazon | 3 | `scavioAmazonSearch`, `scavioAmazonProduct`, `scavioAmazonOffers` |
| [Walmart](https://scavio.dev/docs/walmart-api) | 7 | `scavioWalmartSearch`, `scavioWalmartProduct`, `scavioWalmartReviews`, `scavioWalmartCategory`, `scavioWalmartOffers`, `scavioWalmartSeller`, `scavioWalmartSellerProducts` |
| YouTube | 15 | `scavioYoutubeSearch`, `scavioYoutubeShorts`, `scavioYoutubeSuggestions`, `scavioYoutubeVideo`, `scavioYoutubeComments`, `scavioYoutubeCommentReplies`, `scavioYoutubeTranscript`, `scavioYoutubeRelated`, `scavioYoutubeChannelSearch`, `scavioYoutubeChannel`, `scavioYoutubeChannelVideos`, `scavioYoutubeChannelShorts`, `scavioYoutubeChannelCommunity`, `scavioYoutubeChannelResolve`, `scavioYoutubeStreams` |
| Reddit | 12 | `scavioRedditSearch`, `scavioRedditSearchSuggestions`, `scavioRedditPost`, `scavioRedditPostComments`, `scavioRedditCommentReplies`, `scavioRedditSubreddit`, `scavioRedditSubredditPosts`, `scavioRedditUser`, `scavioRedditUserPosts`, `scavioRedditUserComments`, `scavioRedditPopular`, `scavioRedditTrending` |
| TikTok | 11 | `scavioTiktokProfile`, `scavioTiktokUserPosts`, `scavioTiktokVideo`, `scavioTiktokVideoComments`, `scavioTiktokCommentReplies`, `scavioTiktokSearchVideos`, `scavioTiktokSearchUsers`, `scavioTiktokHashtag`, `scavioTiktokHashtagVideos`, `scavioTiktokUserFollowers`, `scavioTiktokUserFollowings` |
| TikTok Shop | 8 | `scavioTiktokShopSearch`, `scavioTiktokShopSearchSuggestions`, `scavioTiktokShopProduct`, `scavioTiktokShopProductReviews`, `scavioTiktokShopCategories`, `scavioTiktokShopCategoryProducts`, `scavioTiktokShopShopProducts`, `scavioTiktokShopResolve` |
| Instagram | 12 | `scavioInstagramProfile`, `scavioInstagramUserPosts`, `scavioInstagramUserReels`, `scavioInstagramUserTagged`, `scavioInstagramUserStories`, `scavioInstagramPost`, `scavioInstagramPostComments`, `scavioInstagramCommentReplies`, `scavioInstagramSearchUsers`, `scavioInstagramSearchHashtags`, `scavioInstagramUserFollowers`, `scavioInstagramUserFollowings` |
| X (Twitter) | 11 | `scavioXSearch`, `scavioXTweet`, `scavioXTweetComments`, `scavioXTweetRetweeters`, `scavioXUser`, `scavioXUserTweets`, `scavioXUserReplies`, `scavioXUserMedia`, `scavioXUserFollowers`, `scavioXUserFollowings`, `scavioXTrending` |
| LinkedIn | 9 | `scavioLinkedinPerson`, `scavioLinkedinPersonAbout`, `scavioLinkedinPersonPosts`, `scavioLinkedinCompany`, `scavioLinkedinCompanyPosts`, `scavioLinkedinSearchJobs`, `scavioLinkedinJob`, `scavioLinkedinPost`, `scavioLinkedinPostComments` |
| [Threads](https://scavio.dev/docs/threads-profile) | 6 | `scavioThreadsProfile`, `scavioThreadsUserPosts`, `scavioThreadsUserReplies`, `scavioThreadsPost`, `scavioThreadsPostComments`, `scavioThreadsSearchUsers` |
| [Kuaishou](https://scavio.dev/docs/kuaishou-profile) | 14 | `scavioKuaishouProfile`, `scavioKuaishouUserPosts`, `scavioKuaishouUserLive`, `scavioKuaishouUserResolve`, `scavioKuaishouVideo`, `scavioKuaishouVideoComments`, `scavioKuaishouCommentReplies`, `scavioKuaishouVideosBatch`, `scavioKuaishouSearch`, `scavioKuaishouSearchVideos`, `scavioKuaishouSearchUsers`, `scavioKuaishouSearchLive`, `scavioKuaishouTagFeed`, `scavioKuaishouTrending` |
| [eBay](https://scavio.dev/docs/ebay-search) | 3 | `scavioEbaySearch`, `scavioEbayProduct`, `scavioEbaySeller` |
| [Target](https://scavio.dev/docs/target-search) | 4 | `scavioTargetSearch`, `scavioTargetCategory`, `scavioTargetProduct`, `scavioTargetReviews` |
| [Home Depot](https://scavio.dev/docs/home-depot-search) | 3 | `scavioHomeDepotSearch`, `scavioHomeDepotProduct`, `scavioHomeDepotReviews` |
| [Zillow](https://scavio.dev/docs/zillow-search) | 3 | `scavioZillowSearch`, `scavioZillowProperty`, `scavioZillowAgentReviews` |
| [Booking.com](https://scavio.dev/docs/booking-search) | 3 | `scavioBookingSearch`, `scavioBookingHotel`, `scavioBookingReviews` |
| [Tripadvisor](https://scavio.dev/docs/tripadvisor-locations) | 4 | `scavioTripadvisorLocations`, `scavioTripadvisorSearch`, `scavioTripadvisorLocation`, `scavioTripadvisorReviews` |
| [Indeed](https://scavio.dev/docs/indeed-search) | 4 | `scavioIndeedSearch`, `scavioIndeedJob`, `scavioIndeedCompany`, `scavioIndeedCompanyReviews` |
| [Airbnb](https://scavio.dev/docs/airbnb-search) | 3 | `scavioAirbnbSearch`, `scavioAirbnbListing`, `scavioAirbnbReviews` |
| [Glassdoor](https://scavio.dev/docs/glassdoor-companies) | 4 | `scavioGlassdoorCompanies`, `scavioGlassdoorCompany`, `scavioGlassdoorReviews`, `scavioGlassdoorSalaries` |
| [Yelp](https://scavio.dev/docs/yelp-search) | 3 | `scavioYelpSearch`, `scavioYelpBusiness`, `scavioYelpReviews` |
| [App Store](https://scavio.dev/docs/app-store-search) | 3 | `scavioAppStoreSearch`, `scavioAppStoreApp`, `scavioAppStoreReviews` |
| [Google Play](https://scavio.dev/docs/google-play-search) | 3 | `scavioGooglePlaySearch`, `scavioGooglePlayApp`, `scavioGooglePlayReviews` |
| [SEC EDGAR](https://scavio.dev/docs/sec-edgar-lookup) | 6 | `scavioSecLookup`, `scavioSecCompany`, `scavioSecFilings`, `scavioSecConcept`, `scavioSecFacts`, `scavioSecSearch` |
| [Redfin](https://scavio.dev/docs/redfin-search) | 3 | `scavioRedfinSearch`, `scavioRedfinProperty`, `scavioRedfinMarket` |
| [Companies House](https://scavio.dev/docs/companies-house-search) | 4 | `scavioCompaniesHouseSearch`, `scavioCompaniesHouseCompany`, `scavioCompaniesHouseOfficers`, `scavioCompaniesHouseFilingHistory` |
| [G2](https://scavio.dev/docs/g2-search) | 3 | `scavioG2Search`, `scavioG2Product`, `scavioG2Reviews` |
| [Capterra Software Reviews](https://scavio.dev/docs/capterra-search) | 3 | `scavioCapterraSearch`, `scavioCapterraProduct`, `scavioCapterraReviews` |
| [Google Ads Transparency](https://scavio.dev/docs/google-ads-advertisers) | 3 | `scavioGoogleAdsAdvertisers`, `scavioGoogleAdsSearch`, `scavioGoogleAdsCreative` |
| [Meta Ad Library](https://scavio.dev/docs/meta-ads-search) | 3 | `scavioMetaAdsSearch`, `scavioMetaAdsAdvertiser`, `scavioMetaAdsAd` |

Every tool is also exported individually as `createScavio<Name>Tool`.

Each tool returns the structured Scavio JSON response: `{ data, response_time, credits_used, credits_remaining }`, with the payload under `data` on every platform except Google, whose body is flat (read `organic_results` at the top level).

### Endpoints deliberately not exposed

- `/api/v1/youtube/metadata` is a byte-identical deprecated alias of `/api/v1/youtube/video`. Only `scavioYoutubeVideo` ships, so an agent is not asked to pick between two tools that do the same thing. (`scavioYoutubeMetadata` was removed in 0.4.0.)
- LinkedIn `person/contact`, `company/people`, `company/jobs`, `search/people` and `search/posts` were retired upstream and answer HTTP 410 unbilled. `scavioLinkedinCompany` returns `featured_employees` (a 4-6 person sample) in place of `company/people`, and `scavioLinkedinSearchJobs` with the company name replaces `company/jobs`.
- `/api/v1/google` (Google v1) was retired on 2026-08-04 and answers 410. The Google tools speak v2 natively — `gl`, `hl`, `start`, `google_domain`, `device`. `start` is a 0-based result offset (0 is page 1, 10 is page 2), not a page number, so no `page` parameter is offered.

- Google Play `search` and App Store `search` do not paginate: raise `limit` (App Store, up to 200) or take the one shelf Play serves. No `page` parameter is offered because neither store honours one.
- Glassdoor `reviews` caps at three reviews per response — that is Glassdoor's login wall, not a parameter — so no `page` is offered there either. Move the window with `category` and `employment_status`.

Everything else the Scavio API bills for has a tool here. The same endpoints are also available directly via the [`scavio`](https://www.npmjs.com/package/scavio) SDK or the [MCP server](https://scavio.dev/docs).

### Renamed in 0.5.0

Reddit, TikTok and Instagram shipped two tools each before 0.5.0; the rest of their endpoints are new in this release. Two of the four old names were ambiguous once their siblings landed and were renamed:

| Before 0.5.0 | Now |
|---|---|
| `scavioTiktokSearch` / `createScavioTiktokSearchTool` | `scavioTiktokSearchVideos` / `createScavioTiktokSearchVideosTool` (there is now a `scavioTiktokSearchUsers` too) |
| `scavioInstagramSearch` / `createScavioInstagramSearchTool` | `scavioInstagramSearchUsers` / `createScavioInstagramSearchUsersTool` (there is now a `scavioInstagramSearchHashtags` too) |

`scavioRedditSearch`, `scavioRedditPost`, `scavioTiktokProfile` and `scavioInstagramProfile` are unchanged.

### New in 0.6.0

91 tools: 21 new platforms, five more Walmart endpoints, and `scavioExtract`. Nothing was renamed or removed. Three things worth knowing:

- **Requires `scavio@^0.15.0`.** An older SDK has none of the new namespaces, and every new tool fails at build.
- **`scavioExtract` is the fallback for everything else.** It reads any URL and returns clean Markdown (or plain text, or raw HTML), so an agent that lands on a page no platform endpoint covers still has a move. It leads `createScavioTools()` for that reason, and it is a top-level SDK method — `scavio.extract({ url })`, never `scavio.extract.extract()`.
- **Walmart moved from 2 tools to 7** and its two original tools were migrated to the spec pattern the rest of the package uses. `createScavioWalmartSearchTool` and `createScavioWalmartProductTool` keep their names and tool ids. One input tightened: `sort_by` on the search tool was an open string and is now the closed enum the API actually accepts (`best_match`, `price_low`, `price_high`, `best_seller`, `rating_high`, `new`) — a value outside it was never honoured upstream, it was just billed.

## Credits

Most calls cost 1 credit. Every tool states its own cost in its description, so an agent can budget before it fans out.

| Tool | Credits |
|---|---|
| All Google, Amazon, Reddit, TikTok, TikTok Shop and X tools | 1 |
| All eBay, Target, Zillow, Redfin, Booking.com, Airbnb, App Store, SEC EDGAR, Companies House, Google Ads Transparency and Meta Ad Library tools | 1 |
| All Home Depot, Tripadvisor, Indeed, Yelp, Google Play and Capterra tools | 2 |
| All G2 tools | 5 |
| `scavioKuaishouVideo` | 2 |
| `scavioKuaishouProfile`, `scavioKuaishouSearch`, `scavioKuaishouSearchVideos`, `scavioKuaishouSearchUsers`, `scavioKuaishouSearchLive` | 10 |
| `scavioKuaishouVideosBatch` | 40 |
| All other Kuaishou tools | 1 |
| `scavioYoutubeSearch`, `scavioYoutubeShorts` | 2 |
| `scavioYoutubeStreams` | 3 |
| `scavioYoutubeTranscript` | 8 |
| All other YouTube tools | 1 |
| `scavioLinkedinPerson`, `scavioLinkedinPersonAbout`, `scavioLinkedinCompany`, `scavioLinkedinPost` | 1 |
| `scavioLinkedinPersonPosts`, `scavioLinkedinCompanyPosts`, `scavioLinkedinSearchJobs`, `scavioLinkedinPostComments` | 10 |
| `scavioLinkedinJob` | 30 |
| `scavioInstagramUserPosts` | 2 |
| `scavioInstagramPost`, `scavioInstagramCommentReplies` | 8 |
| All other Instagram tools | 10 |

Instagram is priced per endpoint rather than flat, on three tiers: 10 where both upstream legs are billed, 8 for the two calls with no fallback leg to hedge (`scavioInstagramPost`, `scavioInstagramCommentReplies`), and 2 for `scavioInstagramUserPosts`, whose cheap leg is the primary one. Prefer `scavioInstagramUserPosts` over `scavioInstagramUserReels` when the timeline will do — same shape of data, one fifth of the cost. Paginated tools bill per page. See [scavio.dev/docs](https://scavio.dev/docs).

### Four surfaces are priced by the request body

No single number is true for these, so each tool states its own price and none of them says a flat cost:

| Surface | Price |
|---|---|
| `scavioWalmartSearch`, `scavioWalmartCategory` | 1 credit on `domain` `com` or `ca`, **2 on `com.mx`**. The other five Walmart tools take no `domain` and are always 1. |
| `scavioThreadsProfile`, `scavioThreadsUserPosts`, `scavioThreadsUserReplies` | **2 credits addressed by `user_id`, 4 by `username`** — a handle buys a second upstream call, because the upstream handle lookup is dead. Pass `user_id` whenever you have it. The other three Threads tools have no username form and are always 2. |
| Kuaishou | **Per endpoint, 1 to 40.** See the table above; one platform-wide figure would be wrong by up to 40x. |
| `scavioExtract` | 1 credit on `mode` `normal` or `advanced`, **2 on `ultra`**. Only a successful extraction is billed — a dead link, bot wall or timeout costs nothing. |

### Lookup-first platforms

Five platforms are keyed by ids that exist only inside their own URLs, so a caller holding a *name* has to resolve it before anything else will answer:

| Platform | Start with |
|---|---|
| Tripadvisor | `scavioTripadvisorLocations` |
| Glassdoor | `scavioGlassdoorCompanies` |
| SEC EDGAR | `scavioSecLookup` |
| Companies House | `scavioCompaniesHouseSearch` |
| Google Ads Transparency | `scavioGoogleAdsAdvertisers` |
