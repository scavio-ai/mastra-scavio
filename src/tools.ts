import type { ScavioClientOptions } from './client.js';
import {
  createScavioAmazonOffersTool,
  createScavioAmazonProductTool,
  createScavioAmazonSearchTool,
} from './amazon.js';
import { createScavioGoogleSearchTool } from './google.js';
import { createScavioInstagramProfileTool, createScavioInstagramSearchTool } from './instagram.js';
import { createScavioRedditPostTool, createScavioRedditSearchTool } from './reddit.js';
import { createScavioTiktokProfileTool, createScavioTiktokSearchTool } from './tiktok.js';
import { createScavioWalmartProductTool, createScavioWalmartSearchTool } from './walmart.js';
import {
  createScavioYoutubeChannelTool,
  createScavioYoutubeCommentsTool,
  createScavioYoutubeMetadataTool,
  createScavioYoutubeSearchTool,
  createScavioYoutubeStreamsTool,
  createScavioYoutubeTranscriptTool,
  createScavioYoutubeVideoTool,
} from './youtube.js';

export function createScavioTools(config?: ScavioClientOptions) {
  return {
    scavioGoogleSearch: createScavioGoogleSearchTool(config),
    scavioAmazonSearch: createScavioAmazonSearchTool(config),
    scavioAmazonProduct: createScavioAmazonProductTool(config),
    scavioAmazonOffers: createScavioAmazonOffersTool(config),
    scavioWalmartSearch: createScavioWalmartSearchTool(config),
    scavioWalmartProduct: createScavioWalmartProductTool(config),
    scavioYoutubeSearch: createScavioYoutubeSearchTool(config),
    scavioYoutubeVideo: createScavioYoutubeVideoTool(config),
    scavioYoutubeMetadata: createScavioYoutubeMetadataTool(config),
    scavioYoutubeComments: createScavioYoutubeCommentsTool(config),
    scavioYoutubeChannel: createScavioYoutubeChannelTool(config),
    scavioYoutubeTranscript: createScavioYoutubeTranscriptTool(config),
    scavioYoutubeStreams: createScavioYoutubeStreamsTool(config),
    scavioRedditSearch: createScavioRedditSearchTool(config),
    scavioRedditPost: createScavioRedditPostTool(config),
    scavioTiktokSearch: createScavioTiktokSearchTool(config),
    scavioTiktokProfile: createScavioTiktokProfileTool(config),
    scavioInstagramSearch: createScavioInstagramSearchTool(config),
    scavioInstagramProfile: createScavioInstagramProfileTool(config),
  };
}
