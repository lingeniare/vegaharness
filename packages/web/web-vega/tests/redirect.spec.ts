/**
 * Real HTTP coverage proves whether native `fetch` contacts a cross-origin `Location`; mocked
 * request-init assertions alone cannot observe that boundary.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { VegaFetchProvider, VegaSearchProvider } from '@deepseek-ai/dsh-web-vega'
import type { VegaProviderOptions } from '@deepseek-ai/dsh-web-vega'

const TEST_TOKEN = 'redirect-test-key'
const TEST_QUERY = 'private redirect query'
const targetRequests: ReceivedRequest[] = []

interface ReceivedRequest {
  readonly body: string
  readonly headers: IncomingMessage['headers']
}

type ResolvedOptions = VegaProviderOptions & {
  readonly resolveAccountToken: (endpoint: string) => Promise<string | undefined>
}

const options = (): ResolvedOptions => ({
  baseURL: redirectOrigin,
  model: 'openai/gpt-4o-mini',
  maxTokens: 64,
  anonymize: false,
  resolveAccountToken: async () => TEST_TOKEN,
})

let redirectOrigin: string
let targetOrigin: string
let redirectServer: Server
let targetServer: Server

const captureRequest = (request: IncomingMessage): Promise<ReceivedRequest> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () =>{  resolve({
      body: Buffer.concat(chunks).toString('utf8'),
      headers: request.headers,
    }) })
    request.on('error', reject)
  })

const asError = (error: unknown): Error => error instanceof Error ? error : new Error(String(error))

beforeAll(async () => {
  targetServer = createServer((request, response) => {
    void captureRequest(request).then((received) => {
      targetRequests.push(received)
      response.writeHead(204).end()
    }, (error: unknown) => response.destroy(asError(error)))
  })
  redirectServer = createServer((request, response) => {
    request.resume()
    response.writeHead(302, { location: `${targetOrigin}/collect` }).end()
  })
  await Promise.all([
    new Promise<void>(resolve => targetServer.listen(0, '127.0.0.1', resolve)),
    new Promise<void>(resolve => redirectServer.listen(0, '127.0.0.1', resolve)),
  ])
  targetOrigin = `http://127.0.0.1:${(targetServer.address() as AddressInfo).port}`
  redirectOrigin = `http://127.0.0.1:${(redirectServer.address() as AddressInfo).port}`
})

afterAll(async () => {
  await Promise.all([
    new Promise<void>((resolve, reject) => targetServer.close((error) => { if (error === undefined) resolve(); else reject(error) })),
    new Promise<void>((resolve, reject) => redirectServer.close((error) => { if (error === undefined) resolve(); else reject(error) })),
  ])
})

describe('VEGA credentialed redirect policy', () => {
  it('search fails on a redirect response without contacting the target', async () => {
    const provider = new VegaSearchProvider(options)
    await expect(provider.search({ query: TEST_QUERY })).rejects.toThrow()
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(targetRequests).toHaveLength(0)
  })

  it('fetch fails on a redirect response without contacting the target', async () => {
    const provider = new VegaFetchProvider(options)
    await expect(provider.fetch({ url: 'https://example.test/page' })).rejects.toThrow()
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(targetRequests).toHaveLength(0)
  })
})
