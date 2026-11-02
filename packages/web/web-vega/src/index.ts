/**
 * Register the VEGA account-managed search and fetch providers in `ctx.web`. Both
 * dispatch auxiliary `chat/completions` calls with the `openrouter:web_search` /
 * `openrouter:web_fetch` server tools on the `api-vega` route; they answer ready
 * only while the initiating model request runs on that route and a managed key
 * resolves — the server tools exist only inside the VEGA account.
 * @module @deepseek-ai/dsh-web-vega
 */
import type { Context, Volatile } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type {} from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-deepseek-account'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-web'
import {
  resolveVegaAnonymize,
  VegaFetchProvider,
  VegaSearchProvider,
  VEGA_DEFAULT_BASE_URL,
  VEGA_DEFAULT_MAX_TOKENS,
  VEGA_DEFAULT_MODEL,
  VEGA_PROVIDER_ID,
} from './provider.ts'
import type { VegaProviderOptions } from './provider.ts'

export {
  VegaFetchProvider,
  VegaSearchProvider,
  VEGA_DEFAULT_BASE_URL,
  VEGA_DEFAULT_MAX_TOKENS,
  VEGA_DEFAULT_MODEL,
  VEGA_PROVIDER_ID,
} from './provider.ts'
export type {
  VegaCompletion,
  VegaFetchLlmRequest,
  VegaProviderOptions,
  VegaSearchLlmRequest,
} from './provider.ts'

/** Cordis plugin name used by loader diagnostics. */
export const name = 'web-vega'

/** The web seam these providers register into. */
export const inject = ['web']

/** Plugin config (all optional — `apply` fills constant defaults). */
export interface Config {
  /** VEGA endpoint base; `/chat/completions` is appended. Defaults to `https://api.vega.chat/api/v1`. */
  baseURL: Volatile<string | undefined>
  /** Fallback auxiliary model used when the initiating request names none. Must be whitelisted. */
  model: Volatile<string>
  /** Upper bound on generated tokens for the auxiliary request. Defaults to 4096. */
  maxTokens: Volatile<number>
}

export const Config = z.object({
  baseURL: z.string().volatile(),
  model: z.string().default(VEGA_DEFAULT_MODEL).volatile(),
  maxTokens: z.number().step(1).min(1).default(VEGA_DEFAULT_MAX_TOKENS).volatile(),
})

/**
 * Project one resolved section into the options the providers serve their next
 * operation with. The managed key comes from `ctx.deepseekAccount` (the VEGA
 * account service keeps the seam's name); the session id and current request
 * model come from the initiating session's request context.
 * @param ctx - plugin context supplying the account and agent planes.
 * @param config - the currently authoritative section.
 * @returns options for one search or fetch.
 */
function resolveOptions(
  ctx: Context, config: { [K in keyof Config]: ReturnType<Config[K]['get']> },
): VegaProviderOptions & { readonly resolveAccountToken: (endpoint: string) => Promise<string | undefined> } {
  return {
    baseURL: config.baseURL ?? VEGA_DEFAULT_BASE_URL,
    model: config.model,
    maxTokens: config.maxTokens,
    anonymize: resolveVegaAnonymize(ctx),
    resolveModel: () => {
      const session = ctx.get('agents')?.currentInitiator()?.session
      if (session === undefined) return undefined
      return session.requestContext()?.provider === VEGA_PROVIDER_ID
        ? session.requestContext()?.model
        : undefined
    },
    resolveSession: () => ctx.get('agents')?.currentInitiator()?.session.id,
    resolveAccountToken: async (endpoint) => {
      const provider = ctx.get('agents')?.currentInitiator()?.session.requestContext()?.provider
      if (provider !== VEGA_PROVIDER_ID) return undefined
      return await ctx.get('deepseekAccount')?.resolveToken(endpoint)
    },
    rejectToken: async (token) => {
      await ctx.get('deepseekAccount')?.rejectToken(token)
    },
  }
}

/**
 * Whether an auxiliary request for a model request on `route` has the managed
 * credential: the route must be the account route and a token must resolve. A
 * failed read answers false — the operation fails on that read either way.
 * @param ctx - plugin context supplying the account plane.
 * @param options - options the next operation would use.
 * @param route - provider route of the model request being assembled.
 * @returns whether the managed key is available to that operation.
 */
async function vegaReady(
  ctx: Context,
  options: ReturnType<typeof resolveOptions>,
  route: string | undefined,
): Promise<boolean> {
  if (route !== VEGA_PROVIDER_ID) return false
  const account = ctx.get('deepseekAccount')
  if (account === undefined) return false
  try {
    const token = await account.resolveToken(`${options.baseURL}/chat/completions`)
    return token !== undefined && token.length > 0
  } catch (_unreadableGrant) {
    return false
  }
}

/**
 * Register the VEGA search and fetch providers with `ctx.web`. Their `ready()`
 * answers whether an auxiliary request for a model request on the given route
 * would carry the managed account credential.
 */
export function apply(ctx: Context, config: Config): void {
  const options = () => resolveOptions(ctx, {
    baseURL: config.baseURL.get(), model: config.model.get(), maxTokens: config.maxTokens.get(),
  })
  const search = new VegaSearchProvider(
    options,
    (request) => { ctx.get('agents')?.currentInitiator()?.session.append('web/vega-search-llm-request', request) },
  )
  const fetchProvider = new VegaFetchProvider(
    options,
    (request) => { ctx.get('agents')?.currentInitiator()?.session.append('web/vega-fetch-llm-request', request) },
  )
  ctx.web.registerSearchProvider({
    id: search.id,
    available: () => search.available(),
    ready: llmProvider => vegaReady(ctx, options(), llmProvider),
    search: (request, signal) => search.search(request, signal),
  })
  ctx.web.registerFetchProvider({
    id: fetchProvider.id,
    available: () => fetchProvider.available(),
    ready: llmProvider => vegaReady(ctx, options(), llmProvider),
    fetch: (request, signal) => fetchProvider.fetch(request, signal),
  })
}
