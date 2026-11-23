/** VEGA (api.vega.chat) device-flow account provider behind the `deepseekAccount` seam. */
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { platform, release } from 'node:os'
import { Context, Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { DeepSeekAccount, type AccountClientMetadata, type AccountDetails, type AccountNotificationBatch, type AccountNotification, type AccountNotificationEvent, type AccountNotificationId, type AccountRequestCredential, type AccountUpdate, type AccountUserId, type AccountView, type PlatformSession, type SignInAttemptId, type SignInAttemptView } from '@deepseek-ai/dsh-deepseek-account'
import { platformClientHeaders } from '@deepseek-ai/dsh-deepseek-account/client-metadata'
import { credentialKey } from '@deepseek-ai/dsh-credentials'
import type { AuthorizationSession } from '@deepseek-ai/dsh-authorization'
import { readAccountDetail } from './details.ts'
import { revokeAccount, type LogoutRetryPolicy } from './logout.ts'
import { VegaAuthError, platformHeaders, platformOrigin, browserUrl, requestDeviceCode, requestDeviceToken, requestMintKey, deviceCode, deviceToken, deviceTokenError, mintedKey } from './protocol.ts'

const KEY = credentialKey('vega-account', 'default')
const DEVICE = credentialKey('vega-account', 'device')
const LEGACY_DEVICE = credentialKey('deepseek-account-platform', 'device')
const grant = z.object({ version: z.literal(1), token: z.string().min(1), issuer: z.url() })
const device = z.object({ id: z.uuid() })
/** Lower bound applied to the server-advertised device poll interval. */
const MIN_POLL_INTERVAL_MS = 1_000
/** `slow_down` adds this much to the poll interval, per RFC 8628. */
const SLOW_DOWN_INCREMENT_MS = 5_000

/** Deployment-specific VEGA endpoints, client registration and request deadlines. */
export interface Config {
  /** VEGA origin serving device auth, account and inference APIs. */
  platformOrigin?: string
  /** Notification API origin; unused while VEGA exposes no notification feed. */
  harnessOrigin?: string
  /** Optional frontend deployment selector for embedded Platform pages. */
  embeddedPageDist?: string
  /** Exact HTTP(S) origin allowed to receive account tokens for inference and files. */
  inferenceOrigin?: string
  /** Map authorization and completion pages to platformOrigin for private development proxies. */
  rewriteBrowserOrigin?: boolean
  /** Overrides for account requests; merged over requestHeaders, Cookie pairs merge by name. */
  accountRequestHeaders?: Record<string, string>
  /** Registered OAuth client name; also the managed-key route segment. */
  clientId?: string
  /** Requested device-authorization scope. */
  scope?: string
  /** Native desktop identity for VEGA request headers; null identifies the client as web. */
  desktopPlatform?: 'darwin' | 'win32' | null
  /** External billing pages; VEGA exposes no embeddable authorized page. */
  usageUrl?: string
  /** External top-up page; defaults to the billing section of the dashboard. */
  topUpUrl?: string
  /** Allow HTTP only on loopback for development mocks. */
  allowLoopbackHttp?: boolean
  /** Host-only headers sent exclusively to platformOrigin; authorization cannot be overridden. */
  requestHeaders?: Record<string, string>
  /** Deadline for each VEGA HTTP request. */
  requestTimeoutMs?: number
  /** Deadline for balance queries; timeout returns a failed balance outcome. */
  balanceTimeoutMs?: number
  /** Additional revoke attempts after the first request fails, at most five. */
  logoutMaxRetries?: number
  /** Delay before the first revoke retry; each later delay doubles. */
  logoutRetryDelayMs?: number
  /** Upper bound for the entire local attempt, even if the server advertises a longer TTL. */
  attemptTimeoutMs?: number
}
/** Validated deployment choices. */
export const Config = Schema.object({
  platformOrigin: Schema.string().default('https://api.vega.chat'),
  harnessOrigin: Schema.string().default(''),
  embeddedPageDist: Schema.string().default(''),
  inferenceOrigin: Schema.string().default('https://api.vega.chat'),
  rewriteBrowserOrigin: Schema.boolean().default(false),
  accountRequestHeaders: Schema.dict(Schema.string().role('secret')).default({}),
  clientId: Schema.string().min(1).default('vegaharness'),
  scope: Schema.string().default('api'),
  desktopPlatform: Schema.union([Schema.const('darwin'), Schema.const('win32'), Schema.const(null)]).default(null),
  usageUrl: Schema.string().default(''),
  topUpUrl: Schema.string().default(''),
  allowLoopbackHttp: Schema.boolean().default(false),
  requestHeaders: Schema.dict(Schema.string().role('secret')).default({}),
  requestTimeoutMs: Schema.number().min(1).max(120_000).default(30_000),
  balanceTimeoutMs: Schema.number().min(1).max(120_000).default(30_000),
  logoutMaxRetries: Schema.number().min(0).max(5).step(1).default(5),
  logoutRetryDelayMs: Schema.number().min(1).max(60_000).default(1_000),
  attemptTimeoutMs: Schema.number().min(1).max(3_600_000).default(600_000),
})

interface Attempt {
  clientHeaders: Record<string, string>
  view: SignInAttemptView
  controller: AbortController
  done: Promise<void>
  running: Promise<void>
}

/** The VEGA implementation owns device-flow state and its opaque stored managed key. */
export class VegaAccount extends DeepSeekAccount {
  static override inject = ['credentials', 'authorization']
  static override Config = Config
  private readonly apiOrigin: string
  private readonly clientId: string
  private readonly scope: string
  private readonly links: AccountView['links']
  private readonly desktopPlatform: 'darwin' | 'win32' | null
  private readonly deployHeaders: Record<string, string>
  private readonly httpTimeout: number
  private readonly balTimeout: number
  private readonly signInDeadline: number
  private readonly logoutRetry: LogoutRetryPolicy
  private readonly logoutScope = new AbortController()
  private readonly pendingRevocations = new Set<Promise<void>>()
  private signedOutScope = new AbortController()
  private signInAttempt: Attempt | undefined
  private readonly watchers = new Set<(kind: 'snapshot' | 'credentials-changed' | 'identity') => void>()
  /**
   * Latest ready profile read and the grant token it was read with. Binding the token keeps a
   * cached identity from answering for a credential that has since changed.
   */
  private profileCache: { readonly token: string; readonly profile: Extract<AccountDetails['profile'], { status: 'ready' }> } | undefined
  private detailsScope = new AbortController()
  private disposed = false
  private removal: Promise<AccountView> | undefined

  /** @param ctx - Host with authorization and credentials services. @param config - deployment options. */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx)
    const resolved = Config(config)
    this.apiOrigin = platformOrigin(resolved.platformOrigin, resolved.allowLoopbackHttp)
    this.clientId = resolved.clientId
    this.scope = resolved.scope
    const dashboard = `${this.apiOrigin}/dashboard`
    this.links = {
      usageUrl: resolved.usageUrl || dashboard,
      topUpUrl: resolved.topUpUrl || `${dashboard}/billing`,
    }
    this.desktopPlatform = resolved.desktopPlatform
    this.deployHeaders = platformHeaders(resolved.requestHeaders)
    this.httpTimeout = resolved.requestTimeoutMs
    this.balTimeout = resolved.balanceTimeoutMs
    this.signInDeadline = resolved.attemptTimeoutMs
    this.logoutRetry = {
      maxRetries: resolved.logoutMaxRetries, delayMs: resolved.logoutRetryDelayMs, requestTimeoutMs: this.httpTimeout,
    }
    ctx.authorization.registerFlow({
      key: KEY, label: 'API VEGA', methods: [{ id: 'browser', label: 'API VEGA' }],
      run: (session) => {
        const attempt = this.signInAttempt
        if (attempt === undefined) return Promise.reject(new VegaAuthError('protocol'))
        attempt.running = this.runFlow(session, attempt)
        return attempt.running
      },
    })
    ctx.on('credentials/record-updated', (key) => {
      if (key !== KEY) return
      this.invalidateDetailCache()
      this.notify('credentials-changed')
    })
    ctx.effect(() => async () => {
      this.disposed = true
      this.logoutScope.abort()
      this.invalidateDetailCache()
      const active = this.signInAttempt
      if (active !== undefined) {
        if (active.view.phase !== 'committing') active.controller.abort()
        await active.done
      }
      await this.removal
      await Promise.all(this.pendingRevocations)
      this.notify()
    }, 'account: active attempt lifetime')
  }

  override async [Service.init](): Promise<void> {
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record === undefined) return
    if (record.kind !== 'grant') throw new VegaAuthError('storage')
    const parsed = grant.safeParse(record.payload)
    if (!parsed.success) throw new VegaAuthError('storage')
    if (parsed.data.issuer === this.apiOrigin) return
    await this.ctx.credentials.deleteRecord(KEY)
  }

  override async getState(): Promise<AccountView> {
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record !== undefined && (record.kind !== 'grant' || !grant.safeParse(record.payload).success)) {
      throw new VegaAuthError('storage')
    }
    const attempt = this.signInAttempt?.view ?? null
    return {
      status: record === undefined ? 'signed-out' : 'credential-stored',
      // Credential removal can notify watchers before sign-out finishes clearing the attempt.
      attempt: record === undefined && attempt?.phase === 'succeeded' ? null : attempt,
      links: this.links,
      // VEGA exposes no embeddable authorized pages; consumers open links externally.
      embeddedPages: false,
    }
  }

  override async getProfile(client: AccountClientMetadata): Promise<AccountDetails['profile'] | null> {
    const lifetime = this.detailsScope
    const stored = await this.readGrant(lifetime)
    if (stored === null || lifetime.signal.aborted) return null
    const result = await this.readDetail('profile', client, { lifetime, stored })
    if (this.detailsScope !== lifetime) return null
    if (result !== null) this.storeProfile(stored.token, result)
    if (result?.status !== 'failed') return result
    // Only this same grant's last ready read may stand in for a failed refresh.
    const cached = this.profileCache?.token === stored.token ? this.profileCache.profile : undefined
    return cached ?? result
  }

  override getBalance(client: AccountClientMetadata): Promise<AccountDetails['balance'] | null> {
    return this.readDetail('balance', client)
  }

  /** VEGA exposes no notification feed; the outcome is an empty projection. */
  override getNotifications(_client: AccountClientMetadata): Promise<AccountNotificationBatch | null> {
    return Promise.resolve(null)
  }

  /** VEGA exposes no notification feed; there is no content to read. */
  override getNotificationContent(_id: AccountNotificationId, _client: AccountClientMetadata): Promise<AccountNotification | null> {
    return Promise.resolve(null)
  }

  /** VEGA exposes no notification feed; nothing can be acknowledged. */
  override reportNotificationEvent(_id: AccountNotificationId, _event: AccountNotificationEvent,
    _client: AccountClientMetadata): Promise<boolean> {
    return Promise.resolve(false)
  }

  private async readDetail<K extends keyof AccountDetails>(field: K, client: AccountClientMetadata,
    captured?: { lifetime: AbortController; stored: z.infer<typeof grant> }): Promise<AccountDetails[K] | null> {
    const lifetime = captured?.lifetime ?? this.detailsScope
    const stored = captured?.stored ?? await this.readGrant(lifetime)
    if (stored === null || lifetime.signal.aborted) return null
    try {
      const details = await readAccountDetail(field, this.apiOrigin, stored.token,
        AbortSignal.any([lifetime.signal, AbortSignal.timeout(field === 'balance' ? this.balTimeout : this.httpTimeout)]),
        this.headersFor(client), client.locale)
      return this.detailsScope !== lifetime ? null : details
    } catch (_unauthorized) {
      // readAccountDetail exposes only authenticated credential rejection failures.
      if (this.detailsScope === lifetime) await this.expireGrant(stored.token, lifetime)
      return null
    }
  }

  /** Deployment account headers plus the client identity headers derived from one call's metadata. */
  private headersFor(client: AccountClientMetadata): Record<string, string> {
    return { ...this.deployHeaders, ...platformClientHeaders(this.desktopPlatform, client) }
  }

  /**
   * Release the request credential one VEGA destination may carry: the managed key in its request
   * header, a rejection bound to that key, and the sign-out signal that ends requests holding it.
   */
  override async resolveRequestCredential(url: string): Promise<AccountRequestCredential | undefined> {
    const revoked = this.signedOutScope.signal
    const token = await this.resolveManagedToken(url)
    if (token === undefined) return undefined
    return {
      headers: { 'x-dsh-auth-token': token },
      revoked,
      reject: async () => { await this.rejectManagedToken(token) },
    }
  }

  private async rejectManagedToken(token: string): Promise<void> {
    const lifetime = this.detailsScope
    const stored = await this.readGrant(lifetime)
    if (stored?.token !== token || this.detailsScope !== lifetime) return
    await this.expireGrant(token, lifetime)
  }

  private async expireGrant(token: string, lifetime: AbortController): Promise<void> {
    this.removal ??= (async () => {
      if (this.signInAttempt !== undefined) await this.cancelSignIn(this.signInAttempt.view.id)
      const record = await this.ctx.credentials.readRecord(KEY)
      if (this.disposed || this.detailsScope !== lifetime || record?.kind !== 'grant') return this.getState()
      const current = grant.parse(record.payload)
      if (current.token !== token || current.issuer !== this.apiOrigin) return this.getState()
      await this.ctx.credentials.deleteRecord(KEY)
      this.ctx.emit('deepseek-account/session-expired')
      this.signInAttempt = undefined
      this.announceSignedOut()
      this.notify()
      return this.getState()
    })().finally(() => { this.removal = undefined })
    await this.removal
  }

  override async getDeviceIdentity(): Promise<{ deviceId?: string; userId?: AccountUserId; osVersion: string }> {
    let record = await this.ctx.credentials.readRecord(DEVICE)
    // The device record predates this provider: preserve the analytics identity a
    // previous account implementation established instead of minting a new one.
    if (record === undefined) record = await this.ctx.credentials.readRecord(LEGACY_DEVICE)
    const parsed = record?.kind === 'grant' ? device.safeParse(record.payload) : undefined
    return {
      ...parsed?.success ? { deviceId: parsed.data.id } : {},
      ...this.profileCache?.profile.value.id == null ? {} : { userId: this.profileCache.profile.value.id },
      osVersion: `${platform()} ${release()}`,
    }
  }

  /**
   * Ensure the device identity record exists under this provider's scope,
   * migrating the id a previous account implementation stored when present.
   * @returns the persisted device identity.
   */
  private async ensureDeviceRecord(): Promise<z.infer<typeof device>> {
    const record = await this.ctx.credentials.modifyRecord(DEVICE, async (current) => {
      if (current !== undefined) return undefined
      const legacy = await this.ctx.credentials.readRecord(LEGACY_DEVICE)
      const migrated = legacy?.kind === 'grant' ? device.safeParse(legacy.payload) : undefined
      return { kind: 'grant', payload: { id: migrated?.success ? migrated.data.id : randomUUID() } }
    })
    if (record?.kind !== 'grant') throw new VegaAuthError('storage')
    return device.parse(record.payload)
  }

  /** VEGA exposes no embeddable authorized session pages; consumers open links externally. */
  override getPlatformSession(): Promise<PlatformSession | null> {
    return Promise.resolve(null)
  }

  private async readGrant(lifetime: AbortController): Promise<z.infer<typeof grant> | null> {
    if (this.disposed) return null
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record === undefined || lifetime.signal.aborted) return null
    if (record.kind !== 'grant') throw new VegaAuthError('storage')
    const parsed = grant.safeParse(record.payload)
    if (!parsed.success) throw new VegaAuthError('storage')
    // A private origin override must never forward a grant issued by another environment.
    if (parsed.data.issuer !== this.apiOrigin) throw new VegaAuthError('protocol')
    return parsed.data
  }

  private async resolveManagedToken(url: string): Promise<string | undefined> {
    if (this.disposed || this.removal !== undefined) return undefined
    const destination = new URL(url)
    // VEGA serves auth, account and inference from one origin; the managed key
    // authenticates every request on it.
    if (destination.origin !== this.apiOrigin || destination.username || destination.password) return undefined
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record === undefined) return undefined
    if (record.kind !== 'grant') throw new VegaAuthError('storage')
    const result = grant.safeParse(record.payload)
    if (!result.success) throw new VegaAuthError('storage')
    if (result.data.issuer !== this.apiOrigin) return undefined
    return result.data.token
  }

  override async startSignIn(client: AccountClientMetadata, _callbackOrigin: string, _loginSource: 'web' | 'desktop'): Promise<AccountView> {
    if (this.removal !== undefined) await this.removal
    if (this.disposed) throw new VegaAuthError('protocol')
    if (this.signInAttempt !== undefined && ['initializing', 'waiting-browser', 'exchanging', 'committing'].includes(this.signInAttempt.view.phase)) {
      return this.getState()
    }
    const previous = this.signInAttempt
    if (previous !== undefined) {
      await previous.done
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Disposal can occur during the awaited attempt settlement.
      if (this.disposed) throw new VegaAuthError('protocol')
      if (this.signInAttempt !== previous) return this.getState()
    }
    const attempt: Attempt = {
      clientHeaders: platformClientHeaders(this.desktopPlatform, client),
      view: { id: randomUUID() as SignInAttemptId, phase: 'initializing' },
      controller: new AbortController(), done: Promise.resolve(), running: Promise.resolve(),
    }
    this.signInAttempt = attempt
    attempt.done = this.ctx.authorization.begin({
      key: KEY, signal: attempt.controller.signal,
      interaction: { notify: () => undefined, prompt: () => Promise.reject(new VegaAuthError('protocol')) },
    }).then((outcome) => {
      this.patchAttempt(attempt, { phase: outcome.status === 'authorized' ? 'succeeded' : 'cancelled' })
    }).catch((error: unknown) => {
      const code = error instanceof VegaAuthError ? error.code : 'protocol'
      console.error('[vega-account] sign-in failed', { errorCode: code })
      this.patchAttempt(attempt, { phase: code === 'expired' ? 'expired' : 'failed', errorCode: code })
    }).then(async () => {
      // begin() may report cancellation before the poll loop observes its signal.
      await attempt.running.catch(() => undefined)
    })
    this.notify()
    return this.getState()
  }

  override async cancelSignIn(id: SignInAttemptId): Promise<AccountView> {
    const attempt = this.signInAttempt
    if (attempt?.view.id === id) {
      if (attempt.view.phase !== 'committing') {
        attempt.controller.abort()
        this.ctx.authorization.cancel(KEY)
      }
      await attempt.done
    }
    return this.getState()
  }

  override signOut(client: AccountClientMetadata): Promise<AccountView> {
    this.removal ??= (async () => {
      if (this.disposed) throw new VegaAuthError('protocol')
      if (this.signInAttempt !== undefined) await this.cancelSignIn(this.signInAttempt.view.id)
      const record = await this.ctx.credentials.readRecord(KEY)
      if (record !== undefined) {
        if (record.kind !== 'grant') throw new VegaAuthError('storage')
        const parsed = grant.safeParse(record.payload)
        if (!parsed.success) throw new VegaAuthError('storage')
        if (parsed.data.issuer !== this.apiOrigin) throw new VegaAuthError('protocol')
        await this.ctx.credentials.deleteRecord(KEY)
        this.revokeGrant(parsed.data.token, platformClientHeaders(this.desktopPlatform, client))
      }
      this.signInAttempt = undefined
      this.announceSignedOut()
      this.notify()
      return this.getState()
    })().finally(() => { this.removal = undefined })
    return this.removal
  }

  /**
   * Announce a completed sign-out. Listeners run first, so a turn they cancel records that cause
   * before the requests still carrying the signed-out token end.
   */
  private announceSignedOut(): void {
    const scope = this.signedOutScope
    this.signedOutScope = new AbortController()
    try { this.ctx.emit('deepseek-account/signed-out') }
    finally { scope.abort() }
  }

  override watch(signal: AbortSignal, includeIdentityChanges = false): AsyncIterable<AccountUpdate> {
    return this.streamUpdates(signal, includeIdentityChanges)
  }

  override watchState(signal: AbortSignal): AsyncIterable<AccountUpdate> {
    return this.streamUpdates(signal, false)
  }

  private async *streamUpdates(signal: AbortSignal, includeIdentityChanges: boolean): AsyncIterable<AccountUpdate> {
    let pending: AccountUpdate['type'] | undefined = 'snapshot'
    let wake: (() => void) | undefined
    const changed = (kind: 'snapshot' | 'credentials-changed' | 'identity'): void => {
      if (kind === 'identity' && !includeIdentityChanges) return
      if (kind === 'credentials-changed' || pending === undefined) {
        pending = kind === 'credentials-changed' ? kind : 'snapshot'
      }
      wake?.()
    }
    const abort = (): void => { wake?.() }
    this.watchers.add(changed)
    signal.addEventListener('abort', abort, { once: true })
    try {
      while (!this.disposed && !signal.aborted) {
        if (pending !== undefined) {
          const type = pending
          pending = undefined
          const scope = this.detailsScope
          const state = await this.getState()
          // A credential write during the read owns the next event and its replacement state.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Abort or disposal can occur during the state read.
          if (scope !== this.detailsScope || signal.aborted || this.disposed) continue
          yield { type, state }
          continue
        }
        await new Promise<void>((resolve) => { wake = resolve })
      }
    } finally {
      this.watchers.delete(changed)
      signal.removeEventListener('abort', abort)
    }
  }

  override async *watchExpiry(signal: AbortSignal): AsyncIterable<'session-expired'> {
    const lifetime = AbortSignal.any([signal, this.logoutScope.signal])
    let pending = 0
    let wake: (() => void) | undefined
    const stop = this.ctx.on('deepseek-account/session-expired', () => { pending++; wake?.() })
    const abort = (): void => { wake?.() }
    lifetime.addEventListener('abort', abort, { once: true })
    try {
      while (!lifetime.aborted) {
        if (pending > 0) { pending--; yield 'session-expired'; continue }
        await new Promise<void>((resolve) => { wake = resolve })
      }
    } finally {
      stop()
      lifetime.removeEventListener('abort', abort)
    }
  }

  private revokeGrant(token: string, headers: Record<string, string>): void {
    if (this.disposed) return
    const revocation = revokeAccount(this.apiOrigin, this.clientId, token, this.logoutRetry,
      this.logoutScope.signal, { ...this.deployHeaders, ...headers }).finally(() => { this.pendingRevocations.delete(revocation) })
    this.pendingRevocations.add(revocation)
  }

  private invalidateDetailCache(): void {
    this.profileCache = undefined
    this.detailsScope.abort()
    this.detailsScope = new AbortController()
  }

  private notify(kind: 'snapshot' | 'credentials-changed' | 'identity' = 'snapshot'): void { for (const listener of this.watchers) listener(kind) }

  private patchAttempt(attempt: Attempt, value: Partial<SignInAttemptView>): void {
    const { authorizeUrl: _url, userCode: _code, ...rest } = attempt.view
    attempt.view = { ...rest, ...value }
    this.notify()
  }

  /**
   * Cache one ready profile against the grant token it was read with, so identity reuse cannot cross
   * a credential change. A stable ID that first appears or changes notifies identity-enabled watch consumers.
   * @param token - grant the profile was read with.
   * @param profile - profile outcome to record when it carries account data.
   */
  private storeProfile(token: string, profile: AccountDetails['profile']): void {
    if (profile.status !== 'ready') return
    const previous = this.profileCache?.profile.value.id || null
    this.profileCache = { token, profile }
    if (previous !== (profile.value.id || null)) this.notify('identity')
  }

  /**
   * One device-flow attempt: request a code, publish the verification page and
   * user code, poll for the session token, mint the managed key, commit it.
   * @param session - attempt cancellation and the required commit point.
   * @param attempt - visible attempt state this run updates.
   */
  private async runFlow(session: AuthorizationSession, attempt: Attempt): Promise<void> {
    const deadline = new AbortController()
    let expiresAt = Date.now() + this.signInDeadline
    const signal = AbortSignal.any([session.signal, deadline.signal])
    const timer = setTimeout(() => { deadline.abort() }, this.signInDeadline)
    try {
      const init = deviceCode.safeParse(await requestDeviceCode(this.apiOrigin, this.clientId, this.scope,
        AbortSignal.any([signal, AbortSignal.timeout(this.httpTimeout)]), attempt.clientHeaders))
      if (!init.success) throw new VegaAuthError('protocol')
      const authorizeUrl = browserUrl(init.data.verification_uri_complete ?? init.data.verification_uri)
      const now = Date.now()
      expiresAt = Math.min(expiresAt, now + init.data.expires_in * 1000)
      const remaining = expiresAt - now
      if (remaining <= 0) { deadline.abort(); signal.throwIfAborted() }
      this.patchAttempt(attempt, { phase: 'waiting-browser', authorizeUrl, userCode: init.data.user_code, expiresAt })
      let interval = Math.max(MIN_POLL_INTERVAL_MS, init.data.interval * 1000)
      let sessionToken: string | undefined
      while (Date.now() < expiresAt) {
        await delay(interval, undefined, { signal })
        signal.throwIfAborted()
        const outcome = await requestDeviceToken(this.apiOrigin, this.clientId, init.data.device_code,
          AbortSignal.any([signal, AbortSignal.timeout(this.httpTimeout)]), attempt.clientHeaders)
        const token = deviceToken.safeParse(outcome)
        if (token.success) { sessionToken = token.data.access_token; break }
        const failure = deviceTokenError.safeParse(outcome)
        if (!failure.success) throw new VegaAuthError('protocol')
        switch (failure.data.error) {
          case 'authorization_pending': continue
          case 'slow_down': interval += SLOW_DOWN_INCREMENT_MS; continue
          case 'expired_token': throw new VegaAuthError('expired')
          case 'access_denied':
            // The human refused on the verification page: withdraw the attempt
            // so `begin()` settles it as cancelled, not failed.
            attempt.controller.abort()
            throw new VegaAuthError('expired')
          default: throw new VegaAuthError('network')
        }
      }
      if (sessionToken === undefined) throw new VegaAuthError('expired')
      signal.throwIfAborted()
      this.patchAttempt(attempt, { phase: 'exchanging' })
      await this.ensureDeviceRecord()
      const minted = mintedKey.safeParse(await requestMintKey(this.apiOrigin, this.clientId, sessionToken,
        AbortSignal.any([signal, AbortSignal.timeout(this.httpTimeout)]), attempt.clientHeaders))
      if (!minted.success) throw new VegaAuthError('protocol')
      if (Date.now() >= expiresAt) deadline.abort()
      signal.throwIfAborted()
      this.patchAttempt(attempt, { phase: 'committing' })
      try {
        await session.commit({ kind: 'grant', payload: { version: 1, token: minted.data.key, issuer: this.apiOrigin } })
      } catch (error) {
        // A minted key that never reached the store is a live orphan: revoke it
        // best-effort before the attempt reports the storage failure.
        this.revokeGrant(minted.data.key, attempt.clientHeaders)
        throw error instanceof VegaAuthError ? error : new VegaAuthError('storage')
      }
    } catch (error) {
      if (deadline.signal.aborted) throw new VegaAuthError('expired')
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}
export default VegaAccount
