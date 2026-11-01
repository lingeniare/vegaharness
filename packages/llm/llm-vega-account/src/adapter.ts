/** VEGA account-route adapter: pi-ai transport plus listing readiness, VEGA headers, and account error translation. */
import { ACCOUNT_QUOTA_EXCEEDED_CODE, APP_IDENTITY, isQuotaExceededError, LlmError } from '@deepseek-ai/dsh-llm'
import type { GenerateOptions, LlmModelInfo, PreparedAdapterCall, StreamChunk } from '@deepseek-ai/dsh-llm'
import { PiAiAdapter } from '@deepseek-ai/dsh-llm-pi-ai'
import type { PiAiAdapterOptions, PiAiRequestHeaderContext } from '@deepseek-ai/dsh-llm-pi-ai'

/** Account credential access the adapter needs, bound to the mounted account service. */
export interface VegaAccountBinding {
  /** Resolve the managed key for one request destination; undefined while signed out. */
  readonly resolveToken: (url: string) => Promise<string | undefined>
  /** Remove a server-rejected managed key while it still matches the stored login. */
  readonly rejectToken: (token: string) => Promise<void>
}

/** Constructor options for {@link VegaAdapter}. */
export interface VegaAdapterOptions extends Omit<PiAiAdapterOptions, 'resolveApiKey' | 'prepareHeaders'> {
  /** Endpoint every route model shares; the listing lives at `<baseURL>/models`. */
  readonly baseURL: string
  /** Send `X-Vega-Anonymize: true` (PII shield opt-in) on every request. */
  readonly anonymize: boolean
  /** Wait for the listing's first load so first-use requests see the live catalog. */
  readonly catalogView: (signal?: AbortSignal) => Promise<void>
  /** Account credential source and rejection sink. */
  readonly account: VegaAccountBinding
}

/** Failure vocabulary the VEGA gateway emits inside OpenAI-style error bodies. */
interface TranslatedFailure {
  readonly message: string
  readonly code: string
}

const PII_CODE = /"code"\s*:\s*"(pii_[a-z_]+)"|\b(pii_[a-z_]+)\b/i

/**
 * Map a pi-ai-classified failure onto the account error vocabulary.
 * @param message - provider error text (pi-ai flattens the wire body into it).
 * @param code - pi-ai's own classification of that text.
 * @returns the account failure, or `undefined` when the failure needs no translation.
 */
function translateFailure(message: string, code: string): TranslatedFailure | undefined {
  if (code === 'AUTH' && /\b(?:401|403)\b/.test(message)) {
    return { message: 'VEGA account key was rejected; sign in again to continue', code: 'ACCOUNT_TOKEN_INVALID' }
  }
  if (code === 'QUOTA' || isQuotaExceededError(message) || /\b402\b/.test(message)) {
    return { message, code: ACCOUNT_QUOTA_EXCEEDED_CODE }
  }
  const pii = PII_CODE.exec(message)
  const piiName = pii?.[1] ?? pii?.[2]
  if (piiName !== undefined) {
    const name = piiName.toLowerCase()
    // `pii_unavailable` never reached the provider (fail-closed), so it keeps
    // the retry-classified server code; other shield rejections are terminal.
    if (name === 'pii_unavailable') return { message, code: 'SERVER' }
    return { message, code: `PII_${name.slice(4).toUpperCase()}` }
  }
  return undefined
}

/**
 * pi-ai model adapter for the account-managed `api-vega` route. The account
 * service owns the credential; `GET /models` supplies the live catalog.
 */
export class VegaAdapter extends PiAiAdapter {
  /** The token the last credential resolution handed pi-ai, for `rejectToken` binding. */
  private token: string | undefined

  /** @param options - VEGA account binding, endpoint, and listing gate, plus the pi-ai options it forwards. */
  constructor(private readonly vega: VegaAdapterOptions) {
    super({
      ...vega,
      resolveApiKey: async () => {
        const token = await vega.account.resolveToken(vega.baseURL)
        if (token === undefined) {
          throw new LlmError('no VEGA account credential is stored', 'MISSING_CREDENTIAL')
        }
        this.token = token
        return token
      },
      prepareHeaders: (request, headers) => this.vegaHeaders(request, headers),
    })
  }

  /** Request headers every VEGA call carries: session scope, shield opt-in, attribution. */
  private vegaHeaders(request: PiAiRequestHeaderContext, headers: Headers): Headers {
    if (this.vega.anonymize) headers.set('x-vega-anonymize', 'true')
    if (request.sessionId !== undefined) headers.set('x-vega-session', String(request.sessionId).slice(0, 200))
    headers.set('x-title', APP_IDENTITY.product)
    return headers
  }

  /**
   * A first request waits for the listing load before dispatch, like `connect()`
   * on the account adapter: without it the first-use window would race the
   * catalog and could reject a whitelisted model.
   */
  override async listModels(provider: string): Promise<readonly LlmModelInfo[]> {
    await this.vega.catalogView()
    return super.listModels(provider)
  }

  override stream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    return this.translated(this.withCatalog(options))
  }

  override async prepareCall(provider: string, model: string, signal?: AbortSignal): Promise<PreparedAdapterCall> {
    await this.vega.catalogView(signal)
    const prepared = await super.prepareCall(provider, model, signal)
    return { model: prepared.model, stream: options => this.translated(prepared.stream(options)) }
  }

  private async *withCatalog(options: GenerateOptions): AsyncIterable<StreamChunk> {
    await this.vega.catalogView(options.signal)
    yield* super.stream(options)
  }

  /**
   * Deliver account-translated failures on both error paths pi-ai uses: thrown
   * pre-stream errors and in-band terminal `finish` chunks. An auth rejection
   * also retires the rejected key through the account service.
   */
  private async *translated(chunks: AsyncIterable<StreamChunk>): AsyncGenerator<StreamChunk> {
    try {
      for await (const chunk of chunks) {
        if (chunk.type === 'finish' && chunk.reason.kind === 'error') {
          const translated = translateFailure(chunk.reason.failure.message, chunk.reason.failure.code)
          if (translated !== undefined) {
            this.rejectOnAuthFailure(translated)
            yield { ...chunk, reason: { kind: 'error', failure: translated } }
            continue
          }
        }
        yield chunk
      }
    } catch (error) {
      if (error instanceof LlmError) {
        if (error.code === 'MISSING_CREDENTIAL') {
          throw new LlmError('VEGA account sign-in is required', 'ACCOUNT_SIGN_IN_REQUIRED', { cause: error })
        }
        const translated = translateFailure(error.message, error.code)
        if (translated !== undefined) {
          this.rejectOnAuthFailure(translated)
          throw new LlmError(translated.message, translated.code, { cause: error })
        }
      }
      throw error
    }
  }

  /** Server rejection retires the token the request used, while it is still the stored login. */
  private rejectOnAuthFailure(translated: TranslatedFailure): void {
    const token = this.token
    if (translated.code !== 'ACCOUNT_TOKEN_INVALID' || token === undefined) return
    void this.vega.account.rejectToken(token).catch(() => undefined)
  }
}
