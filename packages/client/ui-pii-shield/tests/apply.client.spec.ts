// @vitest-environment jsdom
/**
 * PII-shield seat in the shipped client composition: the plugin mounts into
 * the composer `conversation.input.right` list the web profile assembles.
 */
import { afterEach, beforeEach, expect, vi } from 'vitest'
import { createClientTest, webApp } from '@deepseek-ai/dsh-client-test-runtime/src/assembly/index.ts'
import { ShieldToggle } from '../src/client/ShieldToggle.tsx'

const it = createClientTest({ roster: webApp })

beforeEach(() => {
  vi.stubEnv('DSH_CLIENT_VERSION', '0.0.0-test')
  vi.stubGlobal('screen', { width: 1512, height: 982 })
  vi.stubGlobal('devicePixelRatio', 2)
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks() })

it('registers the composer shield seat in the shipped composition', async ({ start }) => {
  const c = await start()
  const mine = c.ctx.slots.entries('conversation.input.right')
    .find(entry => entry.component === ShieldToggle)
  expect(mine).toBeDefined()
}, 120_000)
