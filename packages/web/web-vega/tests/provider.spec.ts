import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { VegaFetchProvider, VegaSearchProvider } from '@deepseek-ai/dsh-web-vega'
import type {
  VegaProviderOptions,
  VegaSearchLlmRequest,
} from '@deepseek-ai/dsh-web-vega'

interface ReceivedRequest {
  readonly body: Record<string, unknown>
  readonly headers: IncomingMessage['headers']
}

const received: ReceivedRequest[] = []
let server: Server
let origin: string

const captureBody = (request: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () =>{  resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>) })
    request.on('error', reject)
  })

beforeAll(async () => {
  server = createServer((request, response) => {
    void captureBody(request).then((body) => {
      received.push({ body, headers: request.headers })
      response.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({
        choices: [{
          message: {
            content: 'result text',
            annotations: [{ type: 'url_citation', url_citation: { url: 'https://a.test/', title: 'A' } }],
          },
        }],
      }))
    }, () => response.destroy())
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => { if (error === undefined) resolve(); else reject(error) }))
})

const options = (overrides: Partial<VegaProviderOptions> = {}) => (): VegaProviderOptions & {
  readonly resolveAccountToken: (endpoint: string) => Promise<string | undefined>
} => ({
  baseURL: origin,
  model: 'configured/model',
  maxTokens: 64,
  anonymize: false,
  resolveAccountToken: async () => 'sk-apivega-test',
  ...overrides,
})

describe('VegaSearchProvider', () => {
  it('sends the openrouter:web_search server tool and records a secret-free request', async () => {
    const recorded: VegaSearchLlmRequest[] = []
    const provider = new VegaSearchProvider(
      options({ resolveModel: () => 'request/model' }),
      request => recorded.push(request),
    )
    const result = await provider.search({ query: 'dsh', maxResults: 3 })
    expect(result.sources).toEqual([{ url: 'https://a.test/', title: 'A' }])
    expect(result.content).toBe('result text')
    const sent = received.at(-1)
    expect(sent?.headers.authorization).toBe('Bearer sk-apivega-test')
    expect((sent?.body.tools as [{ type: string; parameters?: { max_results: number } }])[0])
      .toEqual({ type: 'openrouter:web_search', parameters: { max_results: 3 } })
    expect((sent?.body as { model: string }).model).toBe('request/model')
    expect(recorded[0]?.body).toEqual(sent?.body)
    expect(JSON.stringify(recorded)).not.toContain('sk-apivega-test')
  })

  it('maps a missing account token to a credential-missing error', async () => {
    const provider = new VegaSearchProvider(() => ({ ...options()(), resolveAccountToken: async () => undefined }))
    await expect(provider.search({ query: 'dsh' })).rejects.toMatchObject({ code: 'WEB_PROVIDER_CREDENTIAL_MISSING' })
  })
})

describe('VegaFetchProvider', () => {
  it('sends the openrouter:web_fetch server tool', async () => {
    const provider = new VegaFetchProvider(options())
    const result = await provider.fetch({ url: 'https://a.test/page' })
    expect(result.body).toMatchObject({ kind: 'text', content: 'result text' })
    const sent = received.at(-1)
    expect((sent?.body.tools as [{ type: string }])[0]).toEqual({ type: 'openrouter:web_fetch' })
  })
})
