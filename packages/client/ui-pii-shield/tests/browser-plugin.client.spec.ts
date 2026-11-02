/**
 * ui-pii-shield browser half on a real SlotRegistry: the plugin occupies the
 * conversation-declared `conversation.input.right` list seat with the shield
 * toggle; the injected face binds the shared anonymize form and writes the
 * flag through it, folding transport failures to false; teardown empties the
 * seat (HMR safety).
 */
import { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import { SlotRegistry } from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { ConfigForm, ConfigFormSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import { ShieldToggle, type PiiShieldSection, type ShieldToggleInjected } from '../src/client/ShieldToggle.tsx'
import { apply, inject } from '../src/client/index.ts'
import { apply as nodeApply } from '../src/index.ts'

const SID = 's-shield' as SessionId

function bench(setImpl: (field: string, value: unknown) => Promise<boolean> = () => Promise.resolve(true)) {
  const store = createSnapshotStore<ConfigFormSnapshot<PiiShieldSection>>({
    status: 'ready',
    value: { anonymize: true },
    base: undefined,
    user: undefined,
    revision: 1,
    writable: true,
  })
  const set = vi.fn(setImpl)
  const form: ConfigForm<PiiShieldSection> = {
    getSnapshot: store.getSnapshot,
    subscribe: store.subscribe,
    mutate: vi.fn(() => Promise.resolve(true)),
    set,
    unset: vi.fn(() => Promise.resolve(true)),
  }
  const ctx = new Context()
  ctx.provide('locale', new LocaleRuntime(ctx))
  ctx.provide('configForms', { get: () => form })
  return { ctx, form, set }
}

async function boot(ctx: Context) {
  await ctx.plugin(SlotRegistry).await()
  const slots = ctx.get('slots') as SlotRegistry
  slots.register({
    name: 'root',
    children: { 'conversation.input.right': { kind: 'list', scope: 'session' } },
  } as never, () => null)
  return slots
}

describe('ui-pii-shield browser apply', () => {
  it('declares every service it binds', () => {
    expect(inject).toEqual(['slots', 'locale', 'configForms'])
  })

  it('node-half apply is an intentional no-op', () => {
    expect(() => { nodeApply() }).not.toThrow()
  })

  it('waits until conversation declares the input.right seat', async () => {
    const { ctx } = bench()
    await ctx.plugin(SlotRegistry).await()
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    expect(ctx.slots.entries('conversation.input.right')).toHaveLength(0)
    ctx.slots.register({
      name: 'root', children: { 'conversation.input.right': { kind: 'list', scope: 'session' } },
    } as never, () => null)
    await Promise.resolve()
    expect(ctx.slots.entries('conversation.input.right')).toHaveLength(1)
    await fiber.dispose()
  })

  it('binds the anonymize form, writes the flag through toggle, and empties the seat on teardown', async () => {
    const { ctx, form, set } = bench()
    const slots = await boot(ctx)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const entry = slots.entries('conversation.input.right')[0]!
    expect(entry.component).toBe(ShieldToggle)
    const injected = Reflect.apply(entry.inject!, undefined, [SID]) as ShieldToggleInjected
    expect(injected.hooks.piiShield).toBe(form)
    await expect(injected.toggle(false)).resolves.toBe(true)
    expect(set).toHaveBeenCalledExactlyOnceWith('anonymize', false)
    await fiber.dispose()
    expect(slots.entries('conversation.input.right')).toHaveLength(0)
  })

  it('folds a transport failure of the settings write to false', async () => {
    const { ctx } = bench(() => Promise.reject(new Error('transport down')))
    const slots = await boot(ctx)
    const fiber = ctx.plugin({ inject: [...inject], apply })
    await fiber.await()
    const entry = slots.entries('conversation.input.right')[0]!
    const injected = Reflect.apply(entry.inject!, undefined, [SID]) as ShieldToggleInjected
    await expect(injected.toggle(true)).resolves.toBe(false)
    await fiber.dispose()
  })
})
