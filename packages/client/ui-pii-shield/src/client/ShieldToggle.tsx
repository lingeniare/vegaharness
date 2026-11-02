/**
 * Composer PII-shield control: a compact icon button seated left of the model
 * selector, reflecting and toggling the VEGA route's `anonymize` settings
 * field. The protected state shows the accent shield-check; the unprotected
 * state shows a muted shield-x. Both states stay clickable — the button is a
 * two-way toggle of the same flag the provider settings section edits.
 */

import { useState } from 'react'
import type { ObservableSnapshot } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './ShieldToggle.module.css'

/** VEGA provider settings section this control reads and writes. */
export interface PiiShieldSection {
  /** `X-Vega-Anonymize` opt-in carried by the route's volatile field. */
  readonly anonymize?: boolean
}

/** Registration-side business face for the shield seat. */
export interface ShieldToggleInjected {
  hooks: {
    /** Settings form snapshot bound by the renderer as usePiiShield. */
    piiShield: ObservableSnapshot<ConfigFormSnapshot<PiiShieldSection>>
  }
  /**
   * Persist the anonymize flag in the settings document.
   * @param on - shield state to write.
   * @returns true on Host acceptance; false on refusal or transport failure.
   */
  toggle: (on: boolean) => Promise<boolean>
}

/** Full component props. */
export type ShieldToggleProps =
  PropsRuntime<'conversation.input.right'>
  & PropsLocale<'piiShield'>
  & InjectFace<ShieldToggleInjected>

/**
 * Render the shield indicator for one session row.
 * @param props - composed slot props.
 * @returns the toggle, or null while the settings document is not exposed.
 */
export function ShieldToggle({ usePiiShield, toggle, t }: ShieldToggleProps) {
  const snapshot = usePiiShield(state => state)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  if (snapshot.status !== 'ready') return null
  const on = snapshot.value?.anonymize !== false
  const label = on ? t('toggle.protected') : t('toggle.unprotected')
  return (
    <Tooltip label={label} side="top">
      <span className={css.anchor}>
        <button
          type="button"
          className={`${css.toggle} ${on ? css.toggleOn : css.toggleOff}`}
          aria-pressed={on}
          aria-label={label}
          disabled={pending || !snapshot.writable}
          onClick={() => {
            setFailed(false)
            setPending(true)
            void toggle(!on).then(
              (accepted) => { if (!accepted) setFailed(true); setPending(false) },
              () => { setFailed(true); setPending(false) },
            )
          }}
        >
          {on ? <ShieldCheckIcon /> : <ShieldXIcon />}
        </button>
        {failed && <span role="status" className={css.status}>{t('toggle.failed')}</span>}
      </span>
    </Tooltip>
  )
}

/** Lucide `shield-check` artwork supplied for the protected state. */
function ShieldCheckIcon() {
  return (
    <svg
      width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

/** Lucide `shield-x` artwork supplied for the unprotected state. */
function ShieldXIcon() {
  return (
    <svg
      width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m14.5 9.5-5 5" />
      <path d="m9.5 9.5 5 5" />
    </svg>
  )
}
