// @vitest-environment jsdom
/**
 * ShieldToggle over the anonymize settings snapshot: nothing renders while
 * the namespace is not ready; the protected state shows the accent
 * shield-check and drops the shield on click; the unprotected state is a
 * disabled muted shield-x; a refused or failed write keeps the state and
 * raises the failure status.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import { bindSnapshotSelector, makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import type { ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { ru as commonRu } from '@deepseek-ai/dsh-client-locale/src/locales/ru.ts'
import { ShieldToggle, type PiiShieldSection, type ShieldToggleProps } from '../src/client/ShieldToggle.tsx'
import css from '../src/client/ShieldToggle.module.css'
import { ru } from '../src/client/locales.ts'

afterEach(cleanup)

// The framework-injected t seat, stubbed over the ru dictionaries (the default locale).
const t: ShieldToggleProps['t'] = makeTranslate(ru, commonRu)

const snapshot = (over: Partial<ConfigFormSnapshot<PiiShieldSection>> = {}): ConfigFormSnapshot<PiiShieldSection> => ({
  status: 'ready',
  value: { anonymize: true },
  base: undefined,
  user: undefined,
  revision: 1,
  writable: true,
  ...over,
})

function setup(
  initial = snapshot(),
  toggle = vi.fn<(on: boolean) => Promise<boolean>>(() => Promise.resolve(true)),
) {
  const store = createSnapshotStore<ConfigFormSnapshot<PiiShieldSection>>(initial)
  const props = { usePiiShield: bindSnapshotSelector(store), toggle, t } as ShieldToggleProps
  return { store, toggle, view: render(<ShieldToggle {...props} />) }
}

const button = () => screen.getByRole('button')
const paths = (container: HTMLElement) => container.querySelectorAll('svg path').length

describe('ShieldToggle', () => {
  it('renders nothing while the namespace is loading or unavailable', () => {
    const loading = setup(snapshot({ status: 'loading', value: undefined }))
    expect(loading.view.container.innerHTML).toBe('')
    cleanup()
    const unavailable = setup(snapshot({ status: 'unavailable', value: undefined }))
    expect(unavailable.view.container.innerHTML).toBe('')
  })

  it('shows the accent shield-check while the flag is on', () => {
    const { view } = setup()
    const control = button()
    expect(control.getAttribute('aria-pressed')).toBe('true')
    expect(control.getAttribute('aria-label')).toBe('Персональных данные защищены в промпте и документах')
    expect(control.className).toContain(css.toggleOn)
    expect(control.hasAttribute('disabled')).toBe(false)
    expect(paths(view.container)).toBe(2)
  })

  it('shows the clickable muted shield-x while the flag is off', () => {
    const { view } = setup(snapshot({ value: { anonymize: false } }))
    const control = button()
    expect(control.getAttribute('aria-pressed')).toBe('false')
    expect(control.getAttribute('aria-label')).toBe('Персональные данные не защищены в промпте и документах')
    expect(control.className).toContain(css.toggleOff)
    expect((control as HTMLButtonElement).disabled).toBe(false)
    expect(paths(view.container)).toBe(3)
  })

  it('toggles the flag both ways and swaps the icon once the snapshot moves', async () => {
    const { store, toggle, view } = setup()
    fireEvent.click(button())
    expect(toggle).toHaveBeenCalledExactlyOnceWith(false)
    await act(async () => { store.set(snapshot({ value: { anonymize: false } })) })
    expect(paths(view.container)).toBe(3)
    fireEvent.click(button())
    expect(toggle).toHaveBeenCalledTimes(2)
    expect(toggle).toHaveBeenLastCalledWith(true)
    await act(async () => { store.set(snapshot({ value: { anonymize: true } })) })
    expect(paths(view.container)).toBe(2)
  })

  it('stays disabled while the document refuses writes', () => {
    setup(snapshot({ writable: false }))
    expect((button() as HTMLButtonElement).disabled).toBe(true)
  })

  it('raises the failure status when the write is refused', async () => {
    const toggle = vi.fn<(on: boolean) => Promise<boolean>>(() => Promise.resolve(false))
    setup(snapshot(), toggle)
    fireEvent.click(button())
    expect((await screen.findByRole('status')).textContent).toBe('Не удалось изменить защиту персональных данных')
  })

  it('raises the failure status when the write rejects', async () => {
    const toggle = vi.fn<(on: boolean) => Promise<boolean>>(() => Promise.reject(new Error('transport down')))
    setup(snapshot(), toggle)
    fireEvent.click(button())
    expect((await screen.findByRole('status')).textContent).toBe('Не удалось изменить защиту персональных данных')
  })
})
