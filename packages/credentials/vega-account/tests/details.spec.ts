import { afterEach, expect, it, vi } from 'vitest'
import { readAccountDetail } from '../src/details.ts'
import { AccountUnauthorizedError } from '../src/protocol.ts'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(respond: (url: string) => Response) {
  vi.stubGlobal('fetch', vi.fn((input: unknown) => Promise.resolve(respond(String(input)))))
}

const account = (payload: unknown) => {
  stubFetch(url => url.endsWith('/api/v1/account') ? Response.json(payload) : new Response(null, { status: 404 }))
}

const balance = (locale: string) =>
  readAccountDetail('balance', 'https://api.vega.chat', 'sk-apivega-test', new AbortController().signal, {}, locale)

it.each(['ru', 'ru-RU'])('reports the ruble deposit to %s UI through balanceRub', async (locale) => {
  account({ balance: 84.219593, balanceRub: 7462.95 })
  expect(await balance(locale)).toEqual({
    status: 'ready', value: [{ currency: 'RUB', balance: '7462.95' }], bonusWallets: [],
  })
})

it.each(['en', 'en-US', 'zh-CN', 'ja', 'fr'])('reports the dollar deposit to %s UI', async (locale) => {
  account({ balance: 84.219593, balanceRub: 7462.95 })
  expect(await balance(locale)).toEqual({
    status: 'ready', value: [{ currency: 'USD', balance: '84.219593' }], bonusWallets: [],
  })
})

it('keeps the dollar wallet on a ru UI when the server omits balanceRub', async () => {
  account({ balance: 84.219593 })
  expect(await balance('ru')).toEqual({
    status: 'ready', value: [{ currency: 'USD', balance: '84.219593' }], bonusWallets: [],
  })
})

it('reads remaining USD credit when the account payload carries no balance', async () => {
  stubFetch((url) => {
    if (url.endsWith('/api/v1/account')) return Response.json({ email: 'u@example.invalid' })
    if (url.endsWith('/api/v1/credits')) return Response.json({ data: { total_credits: 10, total_usage: 2.5 } })
    return new Response(null, { status: 404 })
  })
  expect(await balance('ru')).toEqual({
    status: 'ready', value: [{ currency: 'USD', balance: '7.5' }], bonusWallets: [],
  })
})

it('fails the balance read on a malformed account payload instead of minting a zero', async () => {
  account('unexpected')
  expect(await balance('en')).toEqual({ status: 'failed' })
})

it('rethrows a credential rejection for the caller to expire', async () => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))))
  await expect(balance('en')).rejects.toThrow(AccountUnauthorizedError)
})
