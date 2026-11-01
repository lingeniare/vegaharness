import type { Volatile } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { RetryPolicySchema } from '@deepseek-ai/dsh-llm'
import type { RetryPolicyConfig } from '@deepseek-ai/dsh-llm'
import { modelListingConfigFields } from '@deepseek-ai/dsh-llm-deepseek'

/** Deployment options for the account-managed VEGA route. */
export interface Config {
  /** VEGA Messages-compatible endpoint; the listing is `<baseURL>/models`. */
  baseURL: string
  /** Send `X-Vega-Anonymize: true` on every request (PII shield opt-in). */
  anonymize: boolean
  /**
   * Whether the deployed key name is registered for shielding, which is a
   * server-side list the client cannot observe. When true the directory entry
   * badges the route as PII-shielded; the header alone does not shield a key
   * the server has not enrolled.
   */
  piiShield: boolean
  /** Provider-owned retry policy for this route. */
  retryPolicy: Volatile<RetryPolicyConfig | undefined>
  /** Context capacity for models the listing does not size (default 1,000,000). */
  defaultContextWindow: Volatile<number>
  /** Output capability for models the listing does not size (default 128,000). */
  defaultMaxTokens: Volatile<number>
  /** Deadline of one model-listing request and of a first-use wait. */
  modelsTimeoutMs: Volatile<number>
  /** Listing refresh interval after first use; zero disables automatic refresh. */
  modelsMaxAgeMs: Volatile<number>
}
/** Validated deployment choices. */
export const Config = Schema.object({
  baseURL: Schema.string().default('https://api.vega.chat/api/v1'),
  anonymize: Schema.boolean().default(true),
  piiShield: Schema.boolean().default(false),
  retryPolicy: RetryPolicySchema.volatile(),
  defaultContextWindow: Schema.number().min(1).max(Number.MAX_SAFE_INTEGER).default(1_000_000).volatile(),
  defaultMaxTokens: Schema.number().min(1).max(Number.MAX_SAFE_INTEGER).default(128_000).volatile(),
  ...modelListingConfigFields,
})
