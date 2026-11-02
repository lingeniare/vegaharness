/**
 * VEGA web search and fetch through auxiliary `chat/completions` calls carrying
 * the `openrouter:web_search` / `openrouter:web_fetch` server tools. Each
 * operation costs one model turn on the account-managed `api-vega` route and
 * authenticates with the managed key the account service stores. The wire
 * format and native `fetch` client are provider-private and do not use `ctx.llm`.
 * @module @deepseek-ai/dsh-web-vega/provider
 */

import type { Context, Volatile } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import { WebError } from '@deepseek-ai/dsh-web'
import type {
  WebFetchProvider,
  WebFetchRequest,
  WebFetchResult,
  WebSearchProvider,
  WebSearchRequest,
  WebSearchResult,
  WebSearchSource,
} from '@deepseek-ai/dsh-web'
import { attributionHeaders } from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-session'

/** Stable provider ids this package registers under. */
export const VEGA_PROVIDER_ID = 'api-vega'

/** Default VEGA Messages-compatible endpoint; `/chat/completions` is appended. */
export const VEGA_DEFAULT_BASE_URL = 'https://api.vega.chat/api/v1'

/** Default auxiliary model; deployments override with a whitelisted id. */
export const VEGA_DEFAULT_MODEL = 'openai/gpt-4o-mini'

/** Default upper bound on generated tokens for the auxiliary request. */
export const VEGA_DEFAULT_MAX_TOKENS = 4096

/** One citeable URL from a completion `annotations` entry. */
interface UrlCitation {
  readonly type: 'url_citation'
  readonly url_citation: {
    readonly url: string
    readonly title?: string
    readonly start_index?: number
    readonly end_index?: number
  }
}

/** Decoded completion the auxiliary request returns (OpenRouter response). */
export interface VegaCompletion {
  readonly choices?: readonly [{
    readonly message?: {
      readonly content?: string | readonly { readonly type: string; readonly text?: string }[]
      readonly annotations?: readonly (UrlCitation | { readonly type: string })[]
    }
    readonly finish_reason?: string
  }]
  readonly error?: { readonly code?: string | number; readonly message?: string }
}

/**
 * Exact secret-free VEGA search request recorded immediately before one
 * auxiliary search dispatch.
 */
export interface VegaSearchLlmRequest {
  /** Fully resolved chat/completions endpoint. */
  readonly endpoint: string
  /** Exact JSON body sent to the provider. */
  readonly body: {
    readonly model: string
    readonly stream: false
    readonly messages: readonly [{
      readonly role: 'user'
      readonly content: string
    }]
    readonly tools: readonly [{
      readonly type: 'openrouter:web_search'
      readonly parameters?: { readonly max_results: number }
    }]
  }
}

/**
 * Exact secret-free VEGA fetch request recorded immediately before one
 * auxiliary fetch dispatch.
 */
export interface VegaFetchLlmRequest {
  /** Fully resolved chat/completions endpoint. */
  readonly endpoint: string
  /** Exact JSON body sent to the provider. */
  readonly body: {
    readonly model: string
    readonly stream: false
    readonly messages: readonly [{
      readonly role: 'user'
      readonly content: string
    }]
    readonly tools: readonly [{
      readonly type: 'openrouter:web_fetch'
    }]
  }
}

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Secret-free auxiliary VEGA search request recorded before dispatch. */
    'web/vega-search-llm-request': VegaSearchLlmRequest
    /** Secret-free auxiliary VEGA fetch request recorded before dispatch. */
    'web/vega-fetch-llm-request': VegaFetchLlmRequest
  }
}

/**
 * Read the `llm-vega-account` route's volatile `anonymize` field from its
 * running entry's effective config: the user-facing PII-shield toggle writes
 * there, and auxiliary requests follow the same shield as the chat path.
 * Absent the route the flag reads as off — the header is opt-in.
 * @param ctx - plugin context reaching the Loader's entry table.
 * @returns whether auxiliary requests carry `X-Vega-Anonymize: true`.
 */
export function resolveVegaAnonymize(ctx: Context): boolean {
  const entry = [...(ctx.get('loader')?.entries() ?? [])]
    .find(row => row.options.id === 'llm-vega-account' && row.options.name === '@deepseek-ai/dsh-llm-vega-account')
  const field = (entry?.fiber?.effectiveConfig as { anonymize?: Volatile<boolean> } | undefined)?.anonymize
  return field?.get() ?? false
}

/** Resolved provider options (the plugin's `apply` supplies credential and constant defaults). */
export interface VegaProviderOptions {
  /** Base endpoint (`<baseURL>/chat/completions` is dispatched to). */
  readonly baseURL: string
  /** Model used when the initiating request names none; must be whitelisted. */
  readonly model: string
  /** Upper bound on generated tokens for the auxiliary request. */
  readonly maxTokens: number
  /** Send `X-Vega-Anonymize: true` (PII shield opt-in) on every request. */
  readonly anonymize: boolean
  /**
   * Resolve the model for this auxiliary turn; the initiating request's own
   * model is always whitelisted for the account key, so it is preferred.
   */
  readonly resolveModel?: () => string | undefined
  /** Resolve the account session id for `X-Vega-Session`. */
  readonly resolveSession?: () => string | undefined
  /** Resolve the managed key for one endpoint; undefined while signed out. */
  readonly resolveAccountToken?: (endpoint: string) => Promise<string | undefined>
  /** Remove a server-rejected managed key while it still matches the stored login. */
  readonly rejectToken?: (token: string) => Promise<void>
}

/**
 * Dispatch one non-streamed chat completion against the account endpoint.
 * @param options - this operation's resolved options.
 * @param body - exact request body (already recorded by the caller).
 * @param signal - caller cancellation; `redirect: 'error'` keeps credentials off foreign origins.
 * @returns the decoded completion.
 */
async function chatCompletion(
  options: VegaProviderOptions & {
    readonly resolveAccountToken: (endpoint: string) => Promise<string | undefined>
    readonly rejectToken?: (token: string) => Promise<void>
  },
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<VegaCompletion> {
  const endpoint = `${options.baseURL}/chat/completions`
  const token = await options.resolveAccountToken(endpoint)
  if (token === undefined) {
    throw new WebError(
      'VEGA account sign-in is required for this web request; guide the user to sign in to API VEGA again',
      'WEB_PROVIDER_CREDENTIAL_MISSING',
    )
  }
  throwIfAborted(signal)
  const headers: Record<string, string> = {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    accept: 'application/json',
    ...attributionHeaders(),
  }
  if (options.anonymize) headers['x-vega-anonymize'] = 'true'
  const session = options.resolveSession?.()
  if (session !== undefined) headers['x-vega-session'] = session.slice(0, 200)
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      redirect: 'error',
      headers,
      body: JSON.stringify(body),
      ...signal !== undefined ? { signal } : {},
    })
  } catch (error: unknown) {
    if (signal?.aborted === true || isAbortError(error)) throw aborted(signal, error)
    throw new WebError(`VEGA web request failed: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
  }
  if (!response.ok) {
    const status = response.status
    let detail = ''
    try {
      const parsed = await response.json() as { error?: { message?: string } }
      if (typeof parsed.error?.message === 'string' && parsed.error.message.length > 0) detail = `: ${parsed.error.message}`
    } catch (error: unknown) {
      if (signal?.aborted === true || isAbortError(error)) throw aborted(signal, error)
    }
    const message = `VEGA API error (HTTP ${status})${detail}`
    if (status === 401 || status === 403) {
      await options.rejectToken?.(token)
      throw new WebError(
        `${message}\n\nVEGA rejected the account sign-in used for this web request; guide the user to sign in to API VEGA again`,
        'WEB_PROVIDER_ERROR',
      )
    }
    throw new WebError(message, 'WEB_PROVIDER_ERROR')
  }
  try {
    return await response.json() as VegaCompletion
  } catch (error: unknown) {
    if (signal?.aborted === true || isAbortError(error)) throw aborted(signal, error)
    throw new WebError(`VEGA returned an unprocessable response body: ${String(error)}`, 'WEB_PROVIDER_ERROR', { cause: error })
  }
}

/** Extract the assistant text of one completion, joining multi-part content. */
function completionText(payload: VegaCompletion): string {
  const content = payload.choices?.[0]?.message?.content
  if (typeof content === 'string') return content
  return content?.map(part => typeof part.text === 'string' ? part.text : '').join('') ?? ''
}

/** Extract citeable sources from completion `annotations` (OpenRouter `url_citation` entries). */
function completionSources(payload: VegaCompletion): WebSearchSource[] {
  const seen = new Set<string>()
  const sources: WebSearchSource[] = []
  for (const annotation of payload.choices?.[0]?.message?.annotations ?? []) {
    if (annotation.type !== 'url_citation' || !('url_citation' in annotation)) continue
    const cite = annotation.url_citation
    if (cite.url.length === 0 || seen.has(cite.url)) continue
    seen.add(cite.url)
    sources.push({
      url: cite.url,
      ...cite.title !== undefined && cite.title.length > 0 ? { title: cite.title } : {},
    })
  }
  return sources
}

/**
 * VEGA server-tool search provider. `ready()` answers whether the initiating
 * model request runs on the `api-vega` account route — the server tools only
 * exist there — and a managed key resolves for the endpoint.
 */
export class VegaSearchProvider implements WebSearchProvider {
  readonly id = VEGA_PROVIDER_ID

  /** @param resolveOptions - the options for the NEXT operation, snapshotted per search. */
  constructor(
    private readonly resolveOptions: () => VegaProviderOptions & {
      readonly resolveAccountToken: (endpoint: string) => Promise<string | undefined>
    },
    private readonly recordRequest?: (request: VegaSearchLlmRequest) => void,
  ) {}

  available(): boolean {
    const options = this.resolveOptions()
    return URL.canParse(options.baseURL) && Number.isInteger(options.maxTokens) && options.maxTokens > 0
  }

  async search(request: WebSearchRequest, signal?: AbortSignal): Promise<WebSearchResult> {
    const options = this.resolveOptions()
    const endpoint = `${options.baseURL}/chat/completions`
    const body: VegaSearchLlmRequest['body'] = {
      model: options.resolveModel?.() ?? options.model,
      stream: false,
      messages: [{
        role: 'user',
        content: `Perform a web search for the query: ${request.query}`,
      }],
      tools: [{
        type: 'openrouter:web_search',
        ...request.maxResults === undefined ? {} : { parameters: { max_results: request.maxResults } },
      }],
    }
    this.recordRequest?.({ endpoint, body })
    const payload = await chatCompletion(options, body, signal)
    if (payload.error !== undefined) {
      throw new WebError(`VEGA search failed: ${payload.error.message ?? String(payload.error.code)}`, 'WEB_PROVIDER_ERROR')
    }
    const sources = completionSources(payload)
    const text = completionText(payload)
    if (sources.length === 0 && text.length === 0) {
      throw new WebError('VEGA returned no search results or answer text', 'WEB_PROVIDER_ERROR')
    }
    return { sources, truncated: false, ...text.length > 0 ? { content: text } : {} }
  }
}

/**
 * VEGA server-tool fetch provider. The `openrouter:web_fetch` tool retrieves
 * the page inside the provider; the auxiliary turn returns its text.
 */
export class VegaFetchProvider implements WebFetchProvider {
  readonly id = VEGA_PROVIDER_ID

  /** @param resolveOptions - the options for the NEXT operation, snapshotted per fetch. */
  constructor(
    private readonly resolveOptions: () => VegaProviderOptions & {
      readonly resolveAccountToken: (endpoint: string) => Promise<string | undefined>
    },
    private readonly recordRequest?: (request: VegaFetchLlmRequest) => void,
  ) {}

  available(): boolean {
    const options = this.resolveOptions()
    return URL.canParse(options.baseURL) && Number.isInteger(options.maxTokens) && options.maxTokens > 0
  }

  async fetch(request: WebFetchRequest, signal?: AbortSignal): Promise<WebFetchResult> {
    const options = this.resolveOptions()
    const endpoint = `${options.baseURL}/chat/completions`
    const body: VegaFetchLlmRequest['body'] = {
      model: options.resolveModel?.() ?? options.model,
      stream: false,
      messages: [{
        role: 'user',
        content: `Fetch this URL and return its full text content verbatim, without commentary: ${request.url}`,
      }],
      tools: [{ type: 'openrouter:web_fetch' }],
    }
    this.recordRequest?.({ endpoint, body })
    const payload = await chatCompletion(options, body, signal)
    if (payload.error !== undefined) {
      throw new WebError(`VEGA fetch failed: ${payload.error.message ?? String(payload.error.code)}`, 'WEB_PROVIDER_ERROR')
    }
    const text = completionText(payload)
    if (text.length === 0) {
      throw new WebError(`VEGA returned no page content for ${request.url}`, 'WEB_PROVIDER_ERROR')
    }
    return { url: request.url, statusCode: 200, body: { kind: 'text', content: text }, truncated: false }
  }
}

/** Throw the provider's stable cancellation error when the caller already aborted. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted === true) throw aborted(signal)
}

/** Build the provider's stable cancellation error while retaining the caller's reason. */
function aborted(signal?: AbortSignal, fallback?: unknown): WebError {
  return new WebError('VEGA web request aborted', 'WEB_ABORTED', {
    cause: signal?.aborted === true ? signal.reason : fallback,
  })
}

/** True for a fetch/`AbortSignal` abort, surfaced as `WEB_ABORTED`. */
function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
