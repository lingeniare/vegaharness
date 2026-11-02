/** Validated VEGA (api.vega.chat) HTTP messages and restricted browser destinations. */
import { z } from 'zod'
import type { SignInErrorCode } from '@deepseek-ai/dsh-deepseek-account/types'

/** Protocol errors expose a stable code, never a response body or device secret. */
export class VegaAuthError extends Error {
  /** @param code - safe error classification. */
  constructor(readonly code: SignInErrorCode) { super(`account: ${code}`) }
}

/** An authenticated VEGA request was rejected with HTTP 401 or 403. */
export class AccountUnauthorizedError extends VegaAuthError {
  constructor() { super('expired') }
}

/** Bearer-credential device authorization issued by {@link requestDeviceCode}. */
export const deviceCode = z.object({
  device_code: z.string().min(1),
  user_code: z.string().min(1),
  verification_uri: z.url(),
  verification_uri_complete: z.url().optional(),
  expires_in: z.number().positive(),
  interval: z.number().positive(),
})

/** Successful device-token exchange; an in-band `{error}` is not a success shape. */
export const deviceToken = z.object({ access_token: z.string().regex(/^[\x21-\x7e]+$/) })

/** Device-token polling errors defined by RFC 8628. */
export const deviceTokenError = z.object({ error: z.string().min(1) })

/** Managed API key minted for this client registration. */
export const mintedKey = z.object({
  id: z.unknown().optional(),
  key: z.string().regex(/^[\x21-\x7e]+$/),
})

/**
 * Accept HTTPS VEGA endpoints, or explicitly configured loopback development HTTP.
 * @param value - configured origin.
 * @param allowLoopbackHttp - development-only opt-in.
 * @returns normalized origin.
 */
export function platformOrigin(value: string, allowLoopbackHttp: boolean): string {
  const url = new URL(value)
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash
    || !(url.protocol === 'https:' || (allowLoopbackHttp && loopback && url.protocol === 'http:'))) {
    throw new Error('account: platformOrigin must be an HTTPS origin or explicitly enabled loopback HTTP origin')
  }
  return url.origin
}

/**
 * Validate the server-supplied page the user confirms the device code on.
 * @param value - returned verification URL.
 * @returns normalized https URL.
 */
export function browserUrl(value: string): string {
  let url: URL
  try { url = new URL(value) } catch { throw new VegaAuthError('protocol') }
  if (url.protocol !== 'https:' || url.username || url.password) throw new VegaAuthError('protocol')
  return url.href
}

/**
 * Validate Host-only deployment headers without exposing their values in diagnostics.
 * @param values - configured headers for the VEGA origin.
 * @returns normalized headers; authorization, routing and framing remain provider-owned.
 */
export function platformHeaders(values: Record<string, string>): Record<string, string> {
  const headers = new Headers()
  const names = new Set<string>()
  for (const [name, value] of Object.entries(values)) {
    const key = name.toLowerCase()
    if (['authorization', 'x-dsh-auth-token', 'host', 'content-length', 'transfer-encoding', 'connection', 'content-type'].includes(key)
      || names.has(key)) throw new Error('account: requestHeaders contains a reserved or duplicate header')
    names.add(key)
    try { headers.set(name, value) }
    catch { throw new Error('account: requestHeaders contains an invalid header') }
  }
  return Object.fromEntries(headers)
}

/** Caller cancellation stays silent; standard TimeoutError aborts remain failures. */
function callerCancelled(signal: AbortSignal): boolean {
  const reason: unknown = signal.reason
  return signal.aborted && !(reason instanceof Error && reason.name === 'TimeoutError')
}

/**
 * Read one bounded JSON response; non-cancellation failures emit non-secret diagnostics to stderr.
 * @param url - validated VEGA endpoint.
 * @param init - request method, headers and body; credentials live in headers only.
 * @param signal - attempt cancellation and request timeout.
 * @returns decoded JSON payload, validated by its caller.
 */
export async function requestJson(url: string, init: RequestInit, signal: AbortSignal): Promise<unknown> {
  const path = new URL(url).pathname
  const authenticated = new Headers(init.headers).has('authorization')
  let response: Response
  try {
    response = await fetch(url, { ...init, redirect: 'error', signal })
  } catch {
    if (!callerCancelled(signal)) console.error('[vega-account] request failed', { path, errorCode: 'no-response', aborted: signal.aborted })
    throw new VegaAuthError('no-response')
  }
  if ((response.status === 401 || response.status === 403) && authenticated) {
    if (!callerCancelled(signal)) console.error('[vega-account] request failed', { path, status: response.status, errorCode: 'expired' })
    await response.body?.cancel()
    throw new AccountUnauthorizedError()
  }
  if (!response.ok || response.body === null) {
    if (!callerCancelled(signal)) console.error('[vega-account] request failed', { path, status: response.status, errorCode: 'network' })
    await response.body?.cancel()
    throw new VegaAuthError('network')
  }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const next = await reader.read()
      if (next.done) break
      size += next.value.byteLength
      if (size > 65_536) throw new VegaAuthError('protocol')
      chunks.push(next.value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch (error) {
    if (!callerCancelled(signal)) console.error('[vega-account] response rejected', {
      path, status: response.status, errorCode: error instanceof VegaAuthError ? error.code : 'protocol',
    })
    if (error instanceof VegaAuthError) throw error
    throw new VegaAuthError('protocol')
  } finally {
    await reader.cancel().catch(() => undefined)
    reader.releaseLock()
  }
}

/**
 * Begin device authorization for the registered client.
 * @param origin - validated VEGA origin.
 * @param clientId - registered client name (`vegaharness`).
 * @param scope - requested grant scope.
 * @param signal - attempt cancellation and request timeout.
 * @param headers - validated deployment headers for this origin.
 * @returns the device-code payload the caller polls against.
 */
export function requestDeviceCode(origin: string, clientId: string, scope: string,
  signal: AbortSignal, headers: Record<string, string>): Promise<unknown> {
  return requestJson(`${origin}/api/auth/device/code`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, scope }),
  }, signal)
}

/**
 * One device-token poll. RFC 8628 errors arrive as a 400 with `{error}`.
 * @param origin - validated VEGA origin.
 * @param clientId - registered client name.
 * @param code - device code being exchanged.
 * @param signal - attempt cancellation and request timeout.
 * @param headers - validated deployment headers for this origin.
 * @returns raw payload; the caller distinguishes token from polling error.
 */
export async function requestDeviceToken(origin: string, clientId: string, code: string,
  signal: AbortSignal, headers: Record<string, string>): Promise<unknown> {
  const response = await fetch(`${origin}/api/auth/device/token`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code', device_code: code, client_id: clientId,
    }),
    redirect: 'error', signal,
  }).catch(() => {
    if (!callerCancelled(signal)) console.error('[vega-account] request failed', { path: '/api/auth/device/token', errorCode: 'no-response' })
    throw new VegaAuthError('no-response')
  })
  if (!response.ok && response.status !== 400) {
    if (!callerCancelled(signal)) console.error('[vega-account] request failed', { path: '/api/auth/device/token', status: response.status, errorCode: 'network' })
    await response.body?.cancel()
    throw new VegaAuthError('network')
  }
  if (response.body === null) throw new VegaAuthError('protocol')
  const text = await response.text()
  if (text.length > 65_536) throw new VegaAuthError('protocol')
  try { return JSON.parse(text) }
  catch { throw new VegaAuthError('protocol') }
}

/**
 * Mint this client's managed API key under a fresh session token.
 * @param origin - validated VEGA origin.
 * @param clientId - registered client name, also the key route segment.
 * @param token - device-flow session token.
 * @param signal - attempt cancellation and request timeout.
 * @param headers - validated deployment headers for this origin.
 * @returns minted-key payload, validated by its caller.
 */
export function requestMintKey(origin: string, clientId: string, token: string,
  signal: AbortSignal, headers: Record<string, string>): Promise<unknown> {
  return requestJson(`${origin}/api/v1/keys/${encodeURIComponent(clientId)}`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: '{}',
  }, signal)
}

/**
 * Revoke one managed API key the local store has already dropped.
 * @param origin - validated VEGA origin matching the grant issuer.
 * @param clientId - registered client name, also the key route segment.
 * @param token - revoked grant, never replaced with a later login's key.
 * @param signal - logout request deadline.
 * @param headers - validated issuer-only deployment headers.
 * @returns after VEGA confirms revocation.
 */
export async function requestRevokeKey(origin: string, clientId: string, token: string,
  signal: AbortSignal, headers: Record<string, string>): Promise<void> {
  await requestJson(`${origin}/api/v1/keys/${encodeURIComponent(clientId)}/revoke`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: '{}',
  }, signal)
}

/**
 * Fetch a fixed VEGA account endpoint with the managed key in the Bearer header.
 * @param origin - configured and grant-matched origin.
 * @param path - account endpoint.
 * @param token - managed API key.
 * @param signal - credential lifetime and request timeout.
 * @param headers - validated deployment headers for this origin.
 * @returns decoded JSON payload.
 */
export function requestAccount(origin: string, path: '/api/v1/account' | '/api/v1/credits', token: string,
  signal: AbortSignal, headers: Record<string, string>): Promise<unknown> {
  return requestJson(`${origin}${path}`, {
    method: 'GET', headers: { ...headers, authorization: `Bearer ${token}` },
  }, signal)
}
