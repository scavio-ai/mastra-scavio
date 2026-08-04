# mastra-scavio

[Scavio](https://scavio.dev) real-time search tools for [Mastra](https://mastra.ai) agents — Google, YouTube, Amazon, Walmart, Reddit, TikTok, TikTok Shop, Instagram, X and LinkedIn, with one API key.

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

`createScavioTools()` returns **97 tools** across ten platforms — one per billable Scavio endpoint.

| Platform | Tools | Names |
|---|---|---|
| Google | 14 | `scavioGoogleSearch`, `scavioGoogleAiMode`, `scavioGoogleMapsSearch`, `scavioGoogleMapsPlace`, `scavioGoogleMapsReviews`, `scavioGoogleShopping`, `scavioGoogleShoppingProduct`, `scavioGoogleShoppingStores`, `scavioGoogleFlights`, `scavioGoogleHotels`, `scavioGoogleHotelsDetail`, `scavioGoogleNews`, `scavioGoogleTrends`, `scavioGoogleTrending` |
| Amazon | 3 | `scavioAmazonSearch`, `scavioAmazonProduct`, `scavioAmazonOffers` |
| Walmart | 2 | `scavioWalmartSearch`, `scavioWalmartProduct` |
| YouTube | 15 | `scavioYoutubeSearch`, `scavioYoutubeShorts`, `scavioYoutubeSuggestions`, `scavioYoutubeVideo`, `scavioYoutubeComments`, `scavioYoutubeCommentReplies`, `scavioYoutubeTranscript`, `scavioYoutubeRelated`, `scavioYoutubeChannelSearch`, `scavioYoutubeChannel`, `scavioYoutubeChannelVideos`, `scavioYoutubeChannelShorts`, `scavioYoutubeChannelCommunity`, `scavioYoutubeChannelResolve`, `scavioYoutubeStreams` |
| Reddit | 12 | `scavioRedditSearch`, `scavioRedditSearchSuggestions`, `scavioRedditPost`, `scavioRedditPostComments`, `scavioRedditCommentReplies`, `scavioRedditSubreddit`, `scavioRedditSubredditPosts`, `scavioRedditUser`, `scavioRedditUserPosts`, `scavioRedditUserComments`, `scavioRedditPopular`, `scavioRedditTrending` |
| TikTok | 11 | `scavioTiktokProfile`, `scavioTiktokUserPosts`, `scavioTiktokVideo`, `scavioTiktokVideoComments`, `scavioTiktokCommentReplies`, `scavioTiktokSearchVideos`, `scavioTiktokSearchUsers`, `scavioTiktokHashtag`, `scavioTiktokHashtagVideos`, `scavioTiktokUserFollowers`, `scavioTiktokUserFollowings` |
| TikTok Shop | 8 | `scavioTiktokShopSearch`, `scavioTiktokShopSearchSuggestions`, `scavioTiktokShopProduct`, `scavioTiktokShopProductReviews`, `scavioTiktokShopCategories`, `scavioTiktokShopCategoryProducts`, `scavioTiktokShopShopProducts`, `scavioTiktokShopResolve` |
| Instagram | 12 | `scavioInstagramProfile`, `scavioInstagramUserPosts`, `scavioInstagramUserReels`, `scavioInstagramUserTagged`, `scavioInstagramUserStories`, `scavioInstagramPost`, `scavioInstagramPostComments`, `scavioInstagramCommentReplies`, `scavioInstagramSearchUsers`, `scavioInstagramSearchHashtags`, `scavioInstagramUserFollowers`, `scavioInstagramUserFollowings` |
| X (Twitter) | 11 | `scavioXSearch`, `scavioXTweet`, `scavioXTweetComments`, `scavioXTweetRetweeters`, `scavioXUser`, `scavioXUserTweets`, `scavioXUserReplies`, `scavioXUserMedia`, `scavioXUserFollowers`, `scavioXUserFollowings`, `scavioXTrending` |
| LinkedIn | 9 | `scavioLinkedinPerson`, `scavioLinkedinPersonAbout`, `scavioLinkedinPersonPosts`, `scavioLinkedinCompany`, `scavioLinkedinCompanyPosts`, `scavioLinkedinSearchJobs`, `scavioLinkedinJob`, `scavioLinkedinPost`, `scavioLinkedinPostComments` |

Every tool is also exported individually as `createScavio<Name>Tool`.

Each tool returns the structured Scavio JSON response: `{ data, response_time, credits_used, credits_remaining }`, with the payload under `data` on every platform except Google, whose body is flat (read `organic_results` at the top level).

### Endpoints deliberately not exposed

- `/api/v1/youtube/metadata` is a byte-identical deprecated alias of `/api/v1/youtube/video`. Only `scavioYoutubeVideo` ships, so an agent is not asked to pick between two tools that do the same thing. (`scavioYoutubeMetadata` was removed in 0.4.0.)
- LinkedIn `person/contact`, `company/people`, `company/jobs`, `search/people` and `search/posts` were retired upstream and answer HTTP 410 unbilled. `scavioLinkedinCompany` returns `featured_employees` (a 4-6 person sample) in place of `company/people`, and `scavioLinkedinSearchJobs` with the company name replaces `company/jobs`.
- `/api/v1/google` (Google v1) was retired on 2026-08-04 and answers 410. The Google tools speak v2 natively — `gl`, `hl`, `start`, `google_domain`, `device`. `start` is a 0-based result offset (0 is page 1, 10 is page 2), not a page number, so no `page` parameter is offered.

Everything else the Scavio API bills for has a tool here. The same endpoints are also available directly via the [`scavio`](https://www.npmjs.com/package/scavio) SDK or the [MCP server](https://scavio.dev/docs).

### Renamed in 0.5.0

Reddit, TikTok and Instagram shipped two tools each before 0.5.0; the rest of their endpoints are new in this release. Two of the four old names were ambiguous once their siblings landed and were renamed:

| Before 0.5.0 | Now |
|---|---|
| `scavioTiktokSearch` / `createScavioTiktokSearchTool` | `scavioTiktokSearchVideos` / `createScavioTiktokSearchVideosTool` (there is now a `scavioTiktokSearchUsers` too) |
| `scavioInstagramSearch` / `createScavioInstagramSearchTool` | `scavioInstagramSearchUsers` / `createScavioInstagramSearchUsersTool` (there is now a `scavioInstagramSearchHashtags` too) |

`scavioRedditSearch`, `scavioRedditPost`, `scavioTiktokProfile` and `scavioInstagramProfile` are unchanged.

## Credits

Most calls cost 1 credit. Every tool states its own cost in its description, so an agent can budget before it fans out.

| Tool | Credits |
|---|---|
| All Google, Amazon, Walmart, Reddit, TikTok, TikTok Shop and X tools | 1 |
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
