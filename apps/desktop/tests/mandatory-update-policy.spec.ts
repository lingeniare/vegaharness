import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AccountClientMetadata } from '@deepseek-ai/dsh-deepseek-account/types'
import { DesktopMandatoryUpdatePolicy, desktopPolicyPage, resolveDesktopPolicyConfig, type DesktopPolicyState } from '../src/mandatory-update-policy.ts'

const identity = { platform: 'win32', arch: 'x64', channel: 'stable', bundledDshVersion: '0.1.5-rc.1' } as const
const client: AccountClientMetadata = { version: '1.2.3', locale: 'zh-CN', timezoneOffsetSeconds: 28_800 }
const force = { code: 40005, data: { show_content: { title: '<b>Update</b>', detail: 'Required upgrade' },
  desktop_app_link: 'https://downloads.example.com/desktop?os=win' } }
const clear = { code: 0, msg: '', data: { biz_code: 0, biz_msg: '', biz_data: null } }
const deployment = { origin: 'https://policy.example.com', allowedPageOrigins: ['https://downloads.example.com'],
  intervalMs: 10_000, timeoutMs: 1_000, maxBackoffMs: 80_000, jitter: 0 }
const instances: DesktopMandatoryUpdatePolicy[] = []

function fixture(authentication: 'anonymous' | 'feishu-test' = 'anonymous',
  clientSource: () => AccountClientMetadata = () => client) {
  const request = vi.fn<typeof fetch>().mockResolvedValue(Response.json(clear))
  const publish = vi.fn<(state: DesktopPolicyState) => void>()
  const policy = new DesktopMandatoryUpdatePolicy(resolveDesktopPolicyConfig({ ...deployment, authentication, ...(authentication === 'feishu-test' ? { allowedAuthOrigins: ['https://login.example.com'] } : {}) })!,
    identity, publish, request, clientSource)
  instances.push(policy)
  return { policy, request, publish }
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(async () => {
  await Promise.all(instances.splice(0).map(policy => policy.dispose()))
  vi.useRealTimers()
})

describe('mandatory update policy', () => {
  it('retains a known block through test authentication expiry and rejects 422 as a policy decision', async () => {
    const { policy, request } = fixture('feishu-test')
    request.mockResolvedValueOnce(Response.json(force)).mockResolvedValueOnce(Response.json({
      error: { code: 'UNAUTHENTICATED', login_url: 'https://untrusted.example/' },
    }, { status: 401 })).mockResolvedValueOnce(Response.json({ detail: [] }, { status: 422 }))
    await policy.check('launch')
    expect(await policy.check('manual', true)).toMatchObject({ blocking: true, error: 'authentication-required' })
    expect(request.mock.calls[1]![1]).toMatchObject({ credentials: 'include', redirect: 'error' })
    expect(await policy.check('manual', true)).toMatchObject({ blocking: true, error: 'unavailable' })
    expect(await policy.check('manual', true)).toEqual({ blocking: false, checking: false })
  })

  it.each(['anonymous', 'feishu-test'] as const)('does not infer login from HTML or unrelated 401 in %s mode', async (authentication) => {
    const { policy, request } = fixture(authentication)
    request.mockResolvedValueOnce(Response.json({ error: { code: 'OTHER' } }, { status: 401 }))
      .mockResolvedValueOnce(new Response('<html>login</html>', { status: 200 }))
    expect(await policy.check('launch')).toMatchObject({ error: 'unavailable' })
    expect(await policy.check('manual', true)).toMatchObject({ error: 'unavailable' })
  })

  it('does not enable authentication from a gateway response in anonymous mode', async () => {
    const { policy, request } = fixture()
    request.mockResolvedValueOnce(Response.json({ error: { code: 'UNAUTHENTICATED' } }, { status: 401 }))
    expect(await policy.check('launch')).toMatchObject({ error: 'unavailable' })
  })
  it('sends an anonymous independent request with installed release headers and fixed Stable', async () => {
    const { policy, request } = fixture()
    await expect(policy.check('launch')).resolves.toEqual({ blocking: false, checking: false })
    const [url, options] = request.mock.calls[0]!
    expect(url).toBeInstanceOf(URL)
    expect((url as URL).href).toBe('https://policy.example.com/api/v0/check_client_update?scenario=launch')
    expect(options).toMatchObject({ credentials: 'omit', cache: 'no-store', redirect: 'error', headers: {
      'x-client-platform': 'desktop-win', 'x-client-version': '1.2.3', 'x-client-bundle-id': '',
      'x-client-locale': 'zh_CN', 'x-client-timezone-offset': '28800', 'x-client-arch': 'x64', 'x-client-update-channel': 'stable',
      'x-client-bundled-dsh-version': '0.1.5-rc.1',
    } })
  })

  it('sends the language and UTC offset sampled for each check', async () => {
    let current = { ...client, locale: 'en', timezoneOffsetSeconds: -18_000 }
    const { policy, request } = fixture('anonymous', () => current)
    await policy.check('launch')
    current = { ...client, locale: 'zh-CN', timezoneOffsetSeconds: 28_800 }
    await policy.check('manual', true)
    const headers = request.mock.calls.map(call => (call[1]?.headers ?? {}) as Record<string, string>)
    expect(headers[0]).toMatchObject({ 'x-client-locale': 'en_US', 'x-client-timezone-offset': '-18000' })
    expect(headers[1]).toMatchObject({ 'x-client-locale': 'zh_CN', 'x-client-timezone-offset': '28800' })
  })
})

describe('policy deployment and page validation', () => {
  it('requires validated login origins only for test authentication', () => {
    expect(() => resolveDesktopPolicyConfig({ ...deployment, authentication: 'feishu-test' })).toThrow('allowedAuthOrigins')
    expect(() => resolveDesktopPolicyConfig({ ...deployment, allowedAuthOrigins: ['https://login.example.com'] })).toThrow('anonymous')
    expect(() => resolveDesktopPolicyConfig({ ...deployment, authentication: 'feishu-test',
      allowedAuthOrigins: ['https://login.example.com/path'] })).toThrow('HTTPS origin')
    expect(resolveDesktopPolicyConfig({ ...deployment, authentication: 'feishu-test',
      allowedAuthOrigins: ['https://login.example.com'] })?.allowedAuthOrigins).toEqual(['https://login.example.com'])
  })

  it('requires explicit production origins and confines HTTP to an explicit local policy fixture', () => {
    expect(resolveDesktopPolicyConfig(undefined)).toBeUndefined()
    expect(() => resolveDesktopPolicyConfig({ ...deployment, origin: 'http://127.0.0.1:19001' })).toThrow('HTTPS')
    expect(resolveDesktopPolicyConfig({ ...deployment, origin: 'http://127.0.0.1:19001' }, true)!.origin).toBe('http://127.0.0.1:19001')
    expect(() => resolveDesktopPolicyConfig({ ...deployment, origin: 'http://example.com' }, true)).toThrow('HTTPS')
  })

  it.each(['https://user:pass@downloads.example.com/x', 'https://downloads.example.com.evil.test', 'file:///a.exe',
    'javascript:alert(1)', 'http://downloads.example.com', 'https://downloads.example.com:9443'])('rejects a disallowed page: %s', (url) => {
    expect(desktopPolicyPage(url, deployment.allowedPageOrigins)).toBeUndefined()
  })

  it.each([{ intervalMs: 0 }, { timeoutMs: 1.5 }, { maxBackoffMs: 1000 }, { jitter: 2 }, { allowedPageOrigins: [] },
    { origin: 'https://example.com/path' }, { authentication: 'feishu' },
    { authentication: 'feishu-test', origin: 'http://127.0.0.1:9000' }])('rejects invalid deployment input: %j', (change) => {
    expect(() => resolveDesktopPolicyConfig({ ...deployment, ...change })).toThrow()
  })
})
