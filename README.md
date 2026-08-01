# mastra-scavio

[Scavio](https://scavio.dev) real-time search tools for [Mastra](https://mastra.ai) agents — Google, YouTube, Amazon, Walmart, Reddit, TikTok, and Instagram, with one API key.

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

Get a Scavio API key from the [Scavio Dashboard](https://dashboard.scavio.dev) (new accounts get free credits, no credit card). Set `SCAVIO_API_KEY` or pass `{ apiKey }`.

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
import { createScavioGoogleSearchTool } from 'mastra-scavio';

const agent = new Agent({
  id: 'search-agent',
  model: 'anthropic/claude-sonnet-4-6',
  instructions: 'Search Google with Scavio.',
  tools: { googleSearch: createScavioGoogleSearchTool({ apiKey: process.env.SCAVIO_API_KEY }) },
});
```

## Tools

`createScavioTools()` returns: `scavioGoogleSearch`, `scavioAmazonSearch`, `scavioAmazonProduct`, `scavioAmazonOffers`, `scavioWalmartSearch`, `scavioWalmartProduct`, `scavioYoutubeSearch`, `scavioYoutubeVideo`, `scavioYoutubeMetadata`, `scavioYoutubeComments`, `scavioYoutubeChannel`, `scavioYoutubeTranscript`, `scavioYoutubeStreams`, `scavioRedditSearch`, `scavioRedditPost`, `scavioTiktokSearch`, `scavioTiktokProfile`, `scavioInstagramSearch`, `scavioInstagramProfile`.

Each tool returns the structured Scavio JSON response. The full Scavio API (33 endpoints) is also available directly via the [`scavio`](https://www.npmjs.com/package/scavio) SDK or the [MCP server](https://scavio.dev/docs).

## Credits

Most calls cost 1 credit, including Google. Instagram costs 8-10 credits per call, except user posts which costs 2. See [scavio.dev/docs](https://scavio.dev/docs).
