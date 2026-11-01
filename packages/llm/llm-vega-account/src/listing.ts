/** VEGA (api.vega.chat) `GET /models` listing: OpenRouter rows decoded into catalog entries. */
import { attributionHeaders, LlmError } from '@deepseek-ai/dsh-llm'
import type { ModelModality } from '@deepseek-ai/dsh-llm'
import type { ListingEntry, ModelListing } from '@deepseek-ai/dsh-llm-deepseek'

const LISTED_MODALITIES = ['text', 'image'] as const satisfies readonly ModelModality[]

type Fields = Readonly<Record<string, unknown>>

function fieldsOf(value: unknown): Fields | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Fields : undefined
}

/** A declared capacity: `undefined` when absent, `false` when not a positive safe integer. */
function capacity(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined
}

function stringList(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

/**
 * Decode one OpenRouter `/models` row. Rows that cannot serve a text request —
 * no usable id, no text output, no text input — are skipped, not listed.
 * @param row - one `data[]` member.
 * @returns the catalog entry, or `undefined` when the row is not a text model.
 */
export function decodeVegaModel(row: unknown): ListingEntry | undefined {
  const fields = fieldsOf(row)
  if (fields === undefined || typeof fields.id !== 'string' || fields.id.length === 0) return undefined
  const architecture = fieldsOf(fields.architecture)
  const output = stringList(architecture?.output_modalities)
  if (output.length > 0 && !output.includes('text')) return undefined
  const input = stringList(architecture?.input_modalities)
  if (input.length > 0 && !input.includes('text')) return undefined
  const inputModalities = LISTED_MODALITIES.filter(modality => input.includes(modality))
  const topProvider = fieldsOf(fields.top_provider)
  const name = typeof fields.name === 'string' && fields.name.trim().length > 0 ? fields.name.trim() : undefined
  const contextWindow = capacity(fields.context_length)
  const maxOutputTokens = capacity(topProvider?.max_completion_tokens)
  return {
    id: fields.id,
    ...name === undefined ? {} : { name },
    requirement: { kind: 'none' },
    capabilities: {
      usable: true,
      facts: {
        inputModalities: inputModalities.length > 0 ? inputModalities : ['text'],
        ...contextWindow === undefined ? {} : { contextWindow },
        ...maxOutputTokens === undefined ? {} : { maxOutputTokens },
      },
    },
  }
}

/**
 * Fetch and decode the account-scoped model whitelist.
 * @param url - listing endpoint (`<baseURL>/models`).
 * @param token - managed account key.
 * @param signal - request deadline from the listing cache.
 * @returns decoded entries in server order and the count of unusable rows.
 */
export async function requestVegaListing(url: string, token: string, signal: AbortSignal): Promise<ModelListing> {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}`, ...attributionHeaders() },
    redirect: 'error', signal,
  }).catch((error: unknown) => { throw new LlmError(`vega model listing request failed: ${String(error)}`, 'MODEL_LISTING_FAILED', { cause: error }) })
  if (!response.ok) {
    await response.body?.cancel()
    throw new LlmError(`vega model listing failed with HTTP ${response.status}`, 'MODEL_LISTING_FAILED')
  }
  const payload: unknown = await response.json()
  const data = fieldsOf(payload)?.data
  if (!Array.isArray(data)) throw new LlmError('vega model listing payload is not a model array', 'MODEL_LISTING_FAILED')
  const entries: ListingEntry[] = []
  const seen = new Set<string>()
  let skipped = 0
  for (const row of data) {
    const entry = decodeVegaModel(row)
    if (entry === undefined || seen.has(entry.id)) { skipped++; continue }
    seen.add(entry.id)
    entries.push(entry)
  }
  return { entries, skipped }
}
