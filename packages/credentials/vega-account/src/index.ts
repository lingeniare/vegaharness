/** VEGA (api.vega.chat) device-flow account provider behind the `deepseekAccount` seam. */
import { randomUUID } from 'node:crypto'
import { setTimeout as delay } from 'node:timers/promises'
import { platform, release } from 'node:os'
import { Context, Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { z } from 'zod'
import { DeepSeekAccount, installAccountTaskCancellation, platformClientHeaders, type AccountBonusBatch, type AccountBonusOrderId, type AccountClientMetadata, type AccountDetails, type AccountUserId, type AccountView, type PlatformSession, type SignInAttemptId, type SignInAttemptView } from '@deepseek-ai/dsh-deepseek-account'
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
  static inject = ['credentials', 'authorization']
  static Config = Config
  private readonly origin: string
  private readonly clientId: string
  private readonly scope: string
  private readonly links: AccountView['links']
  private readonly platform: 'darwin' | 'win32' | null
  private readonly requestHeaders: Record<string, string>
  private readonly requestTimeout: number
  private readonly balanceTimeout: number
  private readonly attemptTimeout: number
  private readonly logoutPolicy: LogoutRetryPolicy
  private readonly logoutLifetime = new AbortController()
  private readonly revocations = new Set<Promise<void>>()
  private attempt: Attempt | undefined
  private readonly listeners = new Set<(identityOnly: boolean) => void>()
  /**
   * Latest ready profile read and the grant token it was read with. Binding the token keeps a
   * cached identity from answering for a credential that has since changed.
   */
  private lastProfile: { readonly token: string; readonly profile: Extract<AccountDetails['profile'], { status: 'ready' }> } | undefined
  private detailsLifetime = new AbortController()
  private closed = false
  private removing: Promise<AccountView> | undefined

  /** @param ctx - Host with authorization and credentials services. @param config - deployment options. */
  constructor(ctx: Context, config: Config = {}) {
    super(ctx)
    installAccountTaskCancellation(ctx)
    const resolved = Config(config)
    this.origin = platformOrigin(resolved.platformOrigin, resolved.allowLoopbackHttp)
    this.clientId = resolved.clientId
    this.scope = resolved.scope
    const dashboard = `${this.origin}/dashboard`
    this.links = {
      usageUrl: resolved.usageUrl || dashboard,
      topUpUrl: resolved.topUpUrl || `${dashboard}/billing`,
    }
    this.platform = resolved.desktopPlatform
    this.requestHeaders = platformHeaders(resolved.requestHeaders)
    this.requestTimeout = resolved.requestTimeoutMs
    this.balanceTimeout = resolved.balanceTimeoutMs
    this.attemptTimeout = resolved.attemptTimeoutMs
    this.logoutPolicy = {
      maxRetries: resolved.logoutMaxRetries, delayMs: resolved.logoutRetryDelayMs, requestTimeoutMs: this.requestTimeout,
    }
    ctx.authorization.registerFlow({
      key: KEY, label: 'API VEGA', methods: [{ id: 'browser', label: 'API VEGA' }],
      run: (session) => {
        const attempt = this.attempt
        if (attempt === undefined) return Promise.reject(new VegaAuthError('protocol'))
        attempt.running = this.run(session, attempt)
        return attempt.running
      },
    })
    ctx.on('credentials/record-updated', (key) => {
      if (key !== KEY) return
      this.invalidateDetails()
      this.changed()
    })
    ctx.effect(() => async () => {
      this.closed = true
      this.logoutLifetime.abort()
      this.invalidateDetails()
      const active = this.attempt
      if (active !== undefined) {
        if (active.view.phase !== 'committing') active.controller.abort()
        await active.done
      }
      await this.removing
      await Promise.all(this.revocations)
      this.changed()
    }, 'account: active attempt lifetime')
  }

  async [Service.init](): Promise<void> {
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record === undefined) return
    if (record.kind !== 'grant') throw new VegaAuthError('storage')
    const parsed = grant.safeParse(record.payload)
    if (!parsed.success) throw new VegaAuthError('storage')
    if (parsed.data.issuer === this.origin) return
    await this.ctx.credentials.deleteRecord(KEY)
  }

  override async getState(): Promise<AccountView> {
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record !== undefined && (record.kind !== 'grant' || !grant.safeParse(record.payload).success)) {
      throw new VegaAuthError('storage')
    }
    const attempt = this.attempt?.view ?? null
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
    const lifetime = this.detailsLifetime
    const stored = await this.readCurrentGrant(lifetime)
    if (stored === null || lifetime.signal.aborted) return null
    const result = await this.getDetail('profile', this.detailHeaders(client), { lifetime, stored })
    if (this.detailsLifetime !== lifetime) return null
    if (result !== null) this.cacheProfile(stored.token, result)
    if (result?.status !== 'failed') return result
    // Only this same grant's last ready read may stand in for a failed refresh.
    const cached = this.lastProfile?.token === stored.token ? this.lastProfile.profile : undefined
    return cached ?? result
  }

  override getBalance(client: AccountClientMetadata): Promise<AccountDetails['balance'] | null> {
    return this.getDetail('balance', this.detailHeaders(client))
  }

  /** VEGA exposes no bonus program; the outcome is an empty projection. */
  override getUnnotifiedBonuses(_client: AccountClientMetadata): Promise<AccountBonusBatch | null> {
    return Promise.resolve(null)
  }

  /** VEGA exposes no bonus program; nothing can be acknowledged. */
  override ackBonusNotified(_accountId: AccountUserId, _orderId: AccountBonusOrderId, _client: AccountClientMetadata): Promise<boolean> {
    return Promise.resolve(false)
  }

  private async getDetail<K extends keyof AccountDetails>(field: K, headers: Record<string, string>,
    captured?: { lifetime: AbortController; stored: z.infer<typeof grant> }): Promise<AccountDetails[K] | null> {
    const lifetime = captured?.lifetime ?? this.detailsLifetime
    const stored = captured?.stored ?? await this.readCurrentGrant(lifetime)
    if (stored === null || lifetime.signal.aborted) return null
    try {
      const details = await readAccountDetail(field, this.origin, stored.token,
        AbortSignal.any([lifetime.signal, AbortSignal.timeout(field === 'balance' ? this.balanceTimeout : this.requestTimeout)]), headers)
      return this.detailsLifetime !== lifetime ? null : details
    } catch (_unauthorized) {
      // readAccountDetail exposes only authenticated credential rejection failures.
      if (this.detailsLifetime === lifetime) await this.expireCredential(stored.token, lifetime)
      return null
    }
  }

  /** Deployment account headers plus the client identity headers derived from one call's metadata. */
  private detailHeaders(client: AccountClientMetadata): Record<string, string> {
    return { ...this.requestHeaders, ...platformClientHeaders(this.platform, client) }
  }

  override async rejectToken(token: string): Promise<void> {
    const lifetime = this.detailsLifetime
    const stored = await this.readCurrentGrant(lifetime)
    if (stored?.token !== token || this.detailsLifetime !== lifetime) return
    await this.expireCredential(token, lifetime)
  }

  private async expireCredential(token: string, lifetime: AbortController): Promise<void> {
    this.removing ??= (async () => {
      if (this.attempt !== undefined) await this.cancelSignIn(this.attempt.view.id)
      const record = await this.ctx.credentials.readRecord(KEY)
      if (this.closed || this.detailsLifetime !== lifetime || record?.kind !== 'grant') return this.getState()
      const current = grant.parse(record.payload)
      if (current.token !== token || current.issuer !== this.origin) return this.getState()
      await this.ctx.credentials.deleteRecord(KEY)
      this.ctx.emit('deepseek-account/session-expired')
      this.attempt = undefined
      this.ctx.emit('deepseek-account/signed-out')
      this.changed()
      return this.getState()
    })().finally(() => { this.removing = undefined })
    await this.removing
  }

  override async getDeviceIdentity(): Promise<{ deviceId?: string; userId?: AccountUserId; osVersion: string }> {
    let record = await this.ctx.credentials.readRecord(DEVICE)
    // The device record predates this provider: preserve the analytics identity a
    // previous account implementation established instead of minting a new one.
    if (record === undefined) record = await this.ctx.credentials.readRecord(LEGACY_DEVICE)
    const parsed = record?.kind === 'grant' ? device.safeParse(record.payload) : undefined
    return {
      ...parsed?.success ? { deviceId: parsed.data.id } : {},
      ...this.lastProfile?.profile.value.id == null ? {} : { userId: this.lastProfile.profile.value.id },
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

  private async readCurrentGrant(lifetime: AbortController): Promise<z.infer<typeof grant> | null> {
    if (this.closed) return null
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record === undefined || lifetime.signal.aborted) return null
    if (record.kind !== 'grant') throw new VegaAuthError('storage')
    const parsed = grant.safeParse(record.payload)
    if (!parsed.success) throw new VegaAuthError('storage')
    // A private origin override must never forward a grant issued by another environment.
    if (parsed.data.issuer !== this.origin) throw new VegaAuthError('protocol')
    return parsed.data
  }

  override async resolveToken(url: string): Promise<string | undefined> {
    if (this.closed || this.removing !== undefined) return undefined
    const destination = new URL(url)
    // VEGA serves auth, account and inference from one origin; the managed key
    // authenticates every request on it.
    if (destination.origin !== this.origin || destination.username || destination.password) return undefined
    const record = await this.ctx.credentials.readRecord(KEY)
    if (record === undefined) return undefined
    if (record.kind !== 'grant') throw new VegaAuthError('storage')
    const result = grant.safeParse(record.payload)
    if (!result.success) throw new VegaAuthError('storage')
    if (result.data.issuer !== this.origin) return undefined
    return result.data.token
  }

  override async startSignIn(client: AccountClientMetadata, _callbackOrigin: string, _loginSource: 'web' | 'desktop'): Promise<AccountView> {
    if (this.removing !== undefined) await this.removing
    if (this.closed) throw new VegaAuthError('protocol')
    if (this.attempt !== undefined && ['initializing', 'waiting-browser', 'exchanging', 'committing'].includes(this.attempt.view.phase)) {
      return this.getState()
    }
    const previous = this.attempt
    if (previous !== undefined) {
      await previous.done
      // Disposal can close the provider while the previous attempt settles.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (this.closed) throw new VegaAuthError('protocol')
      if (this.attempt !== previous) return this.getState()
    }
    const attempt: Attempt = {
      clientHeaders: platformClientHeaders(this.platform, client),
      view: { id: randomUUID() as SignInAttemptId, phase: 'initializing' },
      controller: new AbortController(), done: Promise.resolve(), running: Promise.resolve(),
    }
    this.attempt = attempt
    attempt.done = this.ctx.authorization.begin({
      key: KEY, signal: attempt.controller.signal,
      interaction: { notify: () => undefined, prompt: () => Promise.reject(new VegaAuthError('protocol')) },
    }).then((outcome) => {
      this.update(attempt, { phase: outcome.status === 'authorized' ? 'succeeded' : 'cancelled' })
    }).catch((error: unknown) => {
      const code = error instanceof VegaAuthError ? error.code : 'protocol'
      console.error('[vega-account] sign-in failed', { errorCode: code })
      this.update(attempt, { phase: code === 'expired' ? 'expired' : 'failed', errorCode: code })
    }).then(async () => {
      // begin() may report cancellation before the poll loop observes its signal.
      await attempt.running.catch(() => undefined)
    })
    this.changed()
    return this.getState()
  }

  override async cancelSignIn(id: SignInAttemptId): Promise<AccountView> {
    const attempt = this.attempt
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
    this.removing ??= (async () => {
      if (this.closed) throw new VegaAuthError('protocol')
      if (this.attempt !== undefined) await this.cancelSignIn(this.attempt.view.id)
      const record = await this.ctx.credentials.readRecord(KEY)
      if (record !== undefined) {
        if (record.kind !== 'grant') throw new VegaAuthError('storage')
        const parsed = grant.safeParse(record.payload)
        if (!parsed.success) throw new VegaAuthError('storage')
        if (parsed.data.issuer !== this.origin) throw new VegaAuthError('protocol')
        await this.ctx.credentials.deleteRecord(KEY)
        this.revoke(parsed.data.token, platformClientHeaders(this.platform, client))
      }
      this.attempt = undefined
      this.ctx.emit('deepseek-account/signed-out')
      this.changed()
      return this.getState()
    })().finally(() => { this.removing = undefined })
    return this.removing
  }

  override async *watch(signal: AbortSignal, includeIdentityChanges = false): AsyncIterable<AccountView> {
    let dirty = true
    let wake: (() => void) | undefined
    const wakeUp = (): void => { dirty = true; wake?.() }
    const changed = (identityOnly: boolean): void => { if (!identityOnly || includeIdentityChanges) wakeUp() }
    this.listeners.add(changed)
    signal.addEventListener('abort', wakeUp, { once: true })
    try {
      while (!this.closed && !signal.aborted) {
        if (dirty) { dirty = false; yield await this.getState(); continue }
        await new Promise<void>((resolve) => { wake = resolve })
      }
    } finally {
      this.listeners.delete(changed)
      signal.removeEventListener('abort', wakeUp)
    }
  }

  private revoke(token: string, headers: Record<string, string>): void {
    if (this.closed) return
    const revocation = revokeAccount(this.origin, this.clientId, token, this.logoutPolicy,
      this.logoutLifetime.signal, { ...this.requestHeaders, ...headers }).finally(() => { this.revocations.delete(revocation) })
    this.revocations.add(revocation)
  }

  private invalidateDetails(): void {
    this.lastProfile = undefined
    this.detailsLifetime.abort()
    this.detailsLifetime = new AbortController()
  }

  private changed(identityOnly = false): void { for (const listener of this.listeners) listener(identityOnly) }

  private update(attempt: Attempt, value: Partial<SignInAttemptView>): void {
    const { authorizeUrl: _url, userCode: _code, ...rest } = attempt.view
    attempt.view = { ...rest, ...value }
    this.changed()
  }

  /**
   * Cache one ready profile against the grant token it was read with, so identity reuse cannot cross
   * a credential change. A stable ID that first appears or changes notifies identity-enabled watch consumers.
   * @param token - grant the profile was read with.
   * @param profile - profile outcome to record when it carries account data.
   */
  private cacheProfile(token: string, profile: AccountDetails['profile']): void {
    if (profile.status !== 'ready') return
    const previous = this.lastProfile?.profile.value.id || null
    this.lastProfile = { token, profile }
    if (previous !== (profile.value.id || null)) this.changed(true)
  }

  /**
   * One device-flow attempt: request a code, publish the verification page and
   * user code, poll for the session token, mint the managed key, commit it.
   * @param session - attempt cancellation and the required commit point.
   * @param attempt - visible attempt state this run updates.
   */
  private async run(session: AuthorizationSession, attempt: Attempt): Promise<void> {
    const deadline = new AbortController()
    let expiresAt = Date.now() + this.attemptTimeout
    const signal = AbortSignal.any([session.signal, deadline.signal])
    const timer = setTimeout(() => { deadline.abort() }, this.attemptTimeout)
    try {
      const init = deviceCode.safeParse(await requestDeviceCode(this.origin, this.clientId, this.scope,
        AbortSignal.any([signal, AbortSignal.timeout(this.requestTimeout)]), attempt.clientHeaders))
      if (!init.success) throw new VegaAuthError('protocol')
      const authorizeUrl = browserUrl(init.data.verification_uri_complete ?? init.data.verification_uri)
      const now = Date.now()
      expiresAt = Math.min(expiresAt, now + init.data.expires_in * 1000)
      const remaining = expiresAt - now
      if (remaining <= 0) { deadline.abort(); signal.throwIfAborted() }
      this.update(attempt, { phase: 'waiting-browser', authorizeUrl, userCode: init.data.user_code, expiresAt })
      let interval = Math.max(MIN_POLL_INTERVAL_MS, init.data.interval * 1000)
      let sessionToken: string | undefined
      while (Date.now() < expiresAt) {
        await delay(interval, undefined, { signal })
        signal.throwIfAborted()
        const outcome = await requestDeviceToken(this.origin, this.clientId, init.data.device_code,
          AbortSignal.any([signal, AbortSignal.timeout(this.requestTimeout)]), attempt.clientHeaders)
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
      this.update(attempt, { phase: 'exchanging' })
      await this.ensureDeviceRecord()
      const minted = mintedKey.safeParse(await requestMintKey(this.origin, this.clientId, sessionToken,
        AbortSignal.any([signal, AbortSignal.timeout(this.requestTimeout)]), attempt.clientHeaders))
      if (!minted.success) throw new VegaAuthError('protocol')
      if (Date.now() >= expiresAt) deadline.abort()
      signal.throwIfAborted()
      this.update(attempt, { phase: 'committing' })
      try {
        await session.commit({ kind: 'grant', payload: { version: 1, token: minted.data.key, issuer: this.origin } })
      } catch (error) {
        // A minted key that never reached the store is a live orphan: revoke it
        // best-effort before the attempt reports the storage failure.
        this.revoke(minted.data.key, attempt.clientHeaders)
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
