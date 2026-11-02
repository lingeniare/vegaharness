/**
 * Composer PII-shield toggle: registers the VEGA anonymization control into
 * the `conversation.input.right` seat so it renders immediately left of the
 * model selector. The control reads and writes the `anonymize` volatile field
 * of the `llm-vega-account` Host entry through the shared settings document;
 * the adapter applies the flag to `X-Vega-Anonymize` on the next request.
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
// Type-only: pulls the ui-conversation SlotMap merge (the input.right seat).
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the configForms service merge (ctx.configForms).
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import { ShieldToggle, type PiiShieldSection, type ShieldToggleInjected } from './ShieldToggle.tsx'
import { en, ru, type PiiShieldKey } from './locales.ts'

export type { PiiShieldKey } from './locales.ts'
export type { PiiShieldSection, ShieldToggleInjected, ShieldToggleProps } from './ShieldToggle.tsx'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The composer PII-shield toggle's copy. */
    piiShield: PiiShieldKey
  }
}

/** Dictionary namespace owned by this plugin. */
const NS = 'piiShield'

/** Host plugin entry whose volatile `anonymize` field the control edits. */
const VEGA_ENTRY_ID = 'llm-vega-account'

/** Services for the settings form and the composer seat. */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Register the dictionary and the composer shield seat.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { en, ru }), 'ui-pii-shield: dictionaries')
  const form = ctx.configForms.get<PiiShieldSection>(VEGA_ENTRY_ID)
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'pii-shield',
    order: 10,
    locale: NS,
    inject: (_sessionId: SessionId): ShieldToggleInjected => ({
      hooks: { piiShield: form },
      toggle: on => form.set('anonymize', on).then(
        accepted => accepted,
        () => false,
      ),
    }),
  }, ShieldToggle))
}
