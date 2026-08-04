import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

import { getScavioClient } from './client.js';
import type { ScavioClient, ScavioClientOptions } from './client.js';

/** Every Scavio endpoint answers with JSON, so all tools share one output schema. */
export const outputSchema = z.record(z.string(), z.unknown());

/** Platforms the Scavio API covers, in the order createScavioTools() lists them. */
export const SCAVIO_PLATFORMS = [
  'google',
  'youtube',
  'amazon',
  'walmart',
  'reddit',
  'tiktok',
  'tiktok-shop',
  'instagram',
  'x',
  'linkedin',
] as const;

export type ScavioPlatform = (typeof SCAVIO_PLATFORMS)[number];

/**
 * One tool, declared once. createScavioTools(), the per-tool factories, the
 * README table and the tests all read these specs, so the tool list lives in
 * exactly one place instead of being copied between a builder and an assertion.
 */
export interface ScavioToolSpec<TInput extends z.ZodTypeAny = z.ZodTypeAny> {
  /** Key this tool is exposed under by createScavioTools(). */
  key: string;
  /** Tool id the agent sees. Kebab-case of `key`. */
  id: string;
  platform: ScavioPlatform;
  /** API path this tool calls, for docs and coverage tests. */
  endpoint: string;
  /** Credits one call costs. Also stated in `description` so the agent can budget. */
  credits: number;
  description: string;
  inputSchema: TInput;
  call: (client: ScavioClient, input: z.infer<TInput>) => Promise<Record<string, unknown>>;
}

/**
 * A spec with its input type erased. `call` is contravariant in `z.infer<TInput>`,
 * so a narrow `ScavioToolSpec<ZodObject<...>>` is not assignable to
 * `ScavioToolSpec<ZodTypeAny>` under strictFunctionTypes. Heterogeneous arrays of
 * specs use this instead.
 */
export type AnyScavioToolSpec = Omit<ScavioToolSpec, 'inputSchema' | 'call'> & {
  inputSchema: z.ZodTypeAny;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  call: (client: ScavioClient, input: any) => Promise<Record<string, unknown>>;
};

/** Identity helper that keeps each spec's input type inferred inside an array literal. */
export function defineScavioTool<TInput extends z.ZodTypeAny>(
  spec: ScavioToolSpec<TInput>,
): ScavioToolSpec<TInput> {
  return spec;
}

/**
 * Build a Mastra tool from a spec. The Scavio client is created on the first
 * call, not when the tool is built, so a missing API key only throws for tools
 * the agent actually reaches.
 */
export function createScavioTool(spec: AnyScavioToolSpec, config?: ScavioClientOptions) {
  let client: ScavioClient | null = null;
  const getClient = () => (client ??= getScavioClient(config));

  return createTool({
    id: spec.id,
    description: spec.description,
    inputSchema: spec.inputSchema,
    outputSchema,
    execute: async input => spec.call(getClient(), input),
  });
}

export type ScavioTool = ReturnType<typeof createScavioTool>;

/** Bind a named factory to one spec. Throws at import time if the key is a typo. */
export function toolFactory(specs: AnyScavioToolSpec[], key: string) {
  const spec = specs.find(candidate => candidate.key === key);
  if (!spec) {
    throw new Error(`Unknown Scavio tool spec: ${key}`);
  }
  return (config?: ScavioClientOptions) => createScavioTool(spec, config);
}
