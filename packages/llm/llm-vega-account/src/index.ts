/**
 * Account-managed `api-vega` provider route over the pi-ai transport. The
 * mounted `deepseekAccount` service owns the managed key; the route's catalog
 * is the account-scoped `GET <baseURL>/models` whitelist, refreshed through the
 * shared listing cache. No profile exists to edit, so the route declares
 * `accountManaged` and configuration surfaces must not offer Edit/Delete.
 *
 * @module @deepseek-ai/dsh-llm-vega-account
 */
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/cordis-plugin-loader'
import type {} from '@deepseek-ai/dsh-fs'
import type {} from '@deepseek-ai/dsh-deepseek-account'
import type { Context } from '@deepseek-ai/cordis'
import { resolveImageAttachmentAccess } from '@deepseek-ai/dsh-llm'
import type { LlmConfigurableProvider, RetryPolicyConfig } from '@deepseek-ai/dsh-llm'
import type { Config } from './config.ts'
import { createModelListingCache, resolveListingTiming } from '@deepseek-ai/dsh-llm-deepseek'
import type { ListingEntry, ListingSettings, ModelListing } from '@deepseek-ai/dsh-llm-deepseek'
import { authContextFrom, credentialStoreFrom, resolveProfiles } from '@deepseek-ai/dsh-llm-pi-ai'
import type { PiAiModelProfile, PiAiProviderProfile, ResolvedPiAiProviderProfile } from '@deepseek-ai/dsh-llm-pi-ai'
import { deepEqualJson } from '@deepseek-ai/dsh-util-values'
import { VegaAdapter } from './adapter.ts'
import type { VegaAccountBinding } from './adapter.ts'
import { requestVegaListing } from './listing.ts'

export const name = 'llm-vega-account'
export const inject = ['llm']
export { Config } from './config.ts'

/** The single route this plugin owns. */
const PROVIDER = 'api-vega'
const DISPLAY_NAME = 'API VEGA'

/** Project one listing entry into a hand-declared pi-ai model profile. */
function toPiModel(entry: ListingEntry): PiAiModelProfile {
  const facts = entry.capabilities.usable ? entry.capabilities.facts : undefined
  const input = facts?.inputModalities === undefined ? undefined : [...facts.inputModalities]
  return {
    id: entry.id,
    ...entry.name === undefined ? {} : { name: entry.name },
    ...facts?.contextWindow === undefined ? {} : { contextWindow: facts.contextWindow },
    ...facts?.maxOutputTokens === undefined ? {} : { maxTokens: facts.maxOutputTokens },
    ...input === undefined || input.length === 0 ? {} : { input },
  }
}

/** Register the account-managed VEGA route and its live listing-driven catalog. */
export function apply(ctx: Context, config: Config): void {
  ctx.inject(['settings'], (child) => { child.effect(() => child.settings.configure({ auto: false }, ctx.fiber)) })
  const resolved = config
  const settingsNs = ctx.fiber.entry?.options.id ?? name
  const baseURL = new URL(resolved.baseURL).href.replace(/\/+$/, '')
  const listingURL = `${baseURL}/models`
  const settings = (): ListingSettings => ({
    url: listingURL,
    ...resolveListingTiming({
      modelsTimeoutMs: resolved.modelsTimeoutMs.get(),
      modelsMaxAgeMs: resolved.modelsMaxAgeMs.get(),
    }, name),
  })
  const account: VegaAccountBinding = {
    resolveToken: url => ctx.get('deepseekAccount')?.resolveToken(url) ?? Promise.resolve(undefined),
    rejectToken: token => ctx.get('deepseekAccount')?.rejectToken(token) ?? Promise.resolve(),
  }
  const cache = createModelListingCache(ctx, name, PROVIDER, {
    settings: () => settings(),
    credential: url => account.resolveToken(url),
    load: (url, token, signal) => requestVegaListing(url, token, signal),
  })

  // The profile's static half, re-materialized when deployment config changes;
  // the listing supplies `models` per read so the catalog never goes stale
  // inside a captured snapshot.
  const profileSpec = (): Omit<PiAiProviderProfile, 'models'> => {
    const retryPolicy = structuredClone(resolved.retryPolicy.get()) as RetryPolicyConfig | undefined
    return {
      api: 'openai-completions',
      baseURL,
      displayName: DISPLAY_NAME,
      defaultInput: ['text'],
      defaultContextWindow: resolved.defaultContextWindow.get(),
      defaultMaxTokens: resolved.defaultMaxTokens.get(),
      ...retryPolicy === undefined ? {} : { retryPolicy },
    }
  }
  let memoFacts: unknown
  let memoListing: ModelListing | undefined
  let memoized: ReadonlyMap<string, ResolvedPiAiProviderProfile> | undefined
  const profiles = (): ReadonlyMap<string, ResolvedPiAiProviderProfile> => {
    const facts = profileSpec()
    const view = cache.current()
    if (memoized !== undefined && memoListing === view.listing && deepEqualJson(facts, memoFacts)) return memoized
    const models = (view.listing?.entries ?? []).map(toPiModel)
    const next = resolveProfiles({ [PROVIDER]: { ...facts, models } }, 'deferred')
    memoized = next
    memoListing = view.listing
    memoFacts = facts
    return next
  }

  const adapter = new VegaAdapter({
    profiles,
    account,
    baseURL,
    anonymize: () => resolved.anonymize.get(),
    catalogView: signal => cache.view(settings(), signal).then(() => undefined),
    auth: { credentials: credentialStoreFrom(ctx), authContext: authContextFrom(ctx) },
    resolveAttachments: () => ctx.get('attachments'),
    resolveImageAccess: (attachments, ref) => resolveImageAttachmentAccess(
      attachments,
      hostPath => ctx.get('fs')?.processPathFromHostPath(hostPath),
      ref,
    ),
    onReplayDegrade: ({ provider, model, reason }) => {
      ctx.logger.warn(
        `llm-vega-account: unusable replay state on assistant history for route "${provider}/${model}";`
        + ` sending that message as provider-neutral content (${reason})`,
      )
    },
  })
  const registration = ctx.llm.registerAdapter([PROVIDER], adapter)

  const directoryEntries = (): LlmConfigurableProvider[] => [{
    provider: PROVIDER,
    displayName: DISPLAY_NAME,
    settingsNs,
    settingsPath: [],
    declared: false,
    defaultBaseURL: baseURL,
    nativeAuth: { env: [], oauth: true },
    accountManaged: true,
    ...resolved.piiShield ? { piiShielded: true } : {},
  }]
  ctx.llm.registerConfigurableProviders(directoryEntries())

  let registeredPolicy = profiles().get(PROVIDER)?.retryPolicy
  ctx.on('loader/volatile-update', () => {
    let policy: typeof registeredPolicy
    try { policy = profiles().get(PROVIDER)?.retryPolicy }
    catch (error) { ctx.logger.warn(error); return }
    if (deepEqualJson(policy, registeredPolicy)) return
    registration.replace([PROVIDER])
    registeredPolicy = policy
  })
}
