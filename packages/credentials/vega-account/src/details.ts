/** VEGA account identity and wallet queries projected for account UI consumers. */
import { z } from 'zod'
import type { AccountDetails, AccountProfile, AccountUserId } from '@deepseek-ai/dsh-deepseek-account/types'
import { AccountUnauthorizedError, requestAccount, VegaAuthError } from './protocol.ts'

// api.vega.chat is a private fork API; parse leniently so additive server fields never break sign-in.
const account = z.object({
  id: z.union([z.string(), z.number()]).nullish(),
  email: z.string().nullish(),
  name: z.string().nullish(),
  balance: z.union([z.number(), z.string()]).nullish(),
})
const credits = z.object({
  data: z.object({ total_credits: z.number(), total_usage: z.number() }),
})

/** Project VEGA account data without retaining credentials or unneeded fields.
 * @param value - `/api/v1/account` response.
 * @returns UI account profile.
 */
export function profile(value: unknown): AccountProfile {
  const parsed = account.safeParse(value)
  if (!parsed.success) throw new VegaAuthError('protocol')
  return {
    id: parsed.data.id == null ? null : String(parsed.data.id) as AccountUserId,
    name: parsed.data.name || null,
    contact: parsed.data.email || null,
    avatarUrl: null,
  }
}

function accountPayload<T>(schema: z.ZodType<T>, value: unknown, field: 'profile' | 'balance'): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) {
    console.error(`[vega-account] ${field} schema rejected`, {
      issues: parsed.error.issues.map(issue => ({ path: issue.path, code: issue.code })),
    })
    throw new VegaAuthError('protocol')
  }
  return parsed.data
}

/**
 * Read one VEGA account field without waiting for the other query.
 * @param field - profile or the recharge wallet balance.
 * @param origin - configured origin matching the stored grant issuer.
 * @param token - stored managed API key.
 * @param signal - request and credential lifetime.
 * @param headers - validated deployment headers for the configured origin.
 * @returns sanitized query outcome; failure never becomes a zero balance.
 * @throws AccountUnauthorizedError when VEGA rejects the stored key.
 */
const queries: { [K in keyof AccountDetails]: {
  read: (origin: string, token: string, signal: AbortSignal, headers: Record<string, string>) => Promise<AccountDetails[K]>
} } = {
  profile: {
    read: async (origin, token, signal, headers) => ({
      status: 'ready',
      value: profile(await requestAccount(origin, '/api/v1/account', token, signal, headers)),
    }),
  },
  balance: {
    read: async (origin, token, signal, headers) => {
      // Balance rides the account payload when the server supplies it; otherwise
      // the OpenRouter-compatible credits endpoint reports remaining credit.
      const value = await requestAccount(origin, '/api/v1/account', token, signal, headers)
      const parsed = accountPayload(account, value, 'balance')
      let balance: string | undefined
      if (parsed.balance !== undefined && parsed.balance !== null) balance = String(parsed.balance)
      else {
        const rows = accountPayload(credits, await requestAccount(origin, '/api/v1/credits', token, signal, headers), 'balance')
        balance = String(rows.data.total_credits - rows.data.total_usage)
      }
      return { status: 'ready', value: [{ currency: 'RUB', balance }], bonusWallets: [] }
    },
  },
}

/**
 * Read one VEGA account field without waiting for the other query.
 * @param field - profile or the recharge wallet balance.
 * @param origin - configured origin matching the stored grant issuer.
 * @param token - stored managed API key.
 * @param signal - request and credential lifetime.
 * @param headers - validated deployment headers for the configured origin.
 * @returns sanitized query outcome; failure never becomes a zero balance.
 * @throws AccountUnauthorizedError when VEGA rejects the stored key.
 */
export async function readAccountDetail<K extends keyof AccountDetails>(field: K, origin: string, token: string,
  signal: AbortSignal, headers: Record<string, string>): Promise<AccountDetails[K]> {
  try { return await queries[field].read(origin, token, signal, headers) }
  catch (error) {
    if (error instanceof AccountUnauthorizedError) throw error
    return { status: 'failed' } as AccountDetails[K]
  }
}
