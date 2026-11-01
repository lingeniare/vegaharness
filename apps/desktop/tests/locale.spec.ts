import { SHIPPED_LOCALE_IDS } from '../../../scripts/shipped-locales.ts'
import { describe, expect, it } from 'vitest'
import { en, formatDesktopMessage, resolveDesktopLocale, resolveDesktopStartupLocale, ru } from '../src/locale.ts'

describe('desktop locale dictionaries', () => {
  it('ships baseline and Russian keys and falls back for unsupported languages', () => {
    expect(Object.keys(ru)).toEqual(Object.keys(en))
    expect(resolveDesktopLocale('ru-RU')).toEqual({ id: 'ru', messages: ru })
    expect(resolveDesktopLocale('ru-RU').messages).toEqual(ru)
    expect(resolveDesktopLocale('en-US').messages).toEqual(en)
    expect(resolveDesktopLocale('it-IT').messages).toEqual(en)
    expect(resolveDesktopLocale('zh-CN').messages).toEqual(en)
  })

  it.each([
    ['en', 'en-US', en], ['ru', 'ru-RU', ru], ['ru', 'ru', ru],
  ] as const)('resolves %s, preserves placeholders, and honors saved preferences', (id, tag, messages) => {
    expect(resolveDesktopLocale(tag.toUpperCase())).toEqual({ id, messages })
    expect(resolveDesktopStartupLocale(id, ['zh-CN']).id).toBe(id)
    expect(resolveDesktopStartupLocale(null, ['it-IT', tag, 'en-US']).id).toBe(id)
    expect(Object.keys(messages)).toEqual(Object.keys(en))
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      const placeholders = (text: string): string[] => (text.match(/\{\w+\}/gu) ?? []).sort()
      expect(placeholders(messages[key]), key).toEqual(placeholders(en[key]))
    }
  })

  it.each(SHIPPED_LOCALE_IDS)('resolves every shipped language %s without fallback', (id) => {
    expect(resolveDesktopLocale(id).id).toBe(id)
    expect(resolveDesktopStartupLocale(null, [id]).id).toBe(id)
  })

  it('formats named values without consuming unknown placeholders', () => {
    expect(formatDesktopMessage('{name}@{version} {missing}', { name: 'plugin', version: '1.2.3' }))
      .toBe('plugin@1.2.3 {missing}')
  })

  it('prefers an explicit supported choice, then the first supported system language', () => {
    expect(resolveDesktopStartupLocale('ru', ['en-US']).id).toBe('ru')
    expect(resolveDesktopStartupLocale('EN', ['ru-RU']).id).toBe('en')
    expect(resolveDesktopStartupLocale(null, ['ru', 'ru-RU', 'en-US']).id).toBe('ru')
    expect(resolveDesktopStartupLocale(null, ['en-US', 'ru-RU']).id).toBe('en')
    expect(resolveDesktopStartupLocale(null, ['ru']).id).toBe('ru')
    expect(resolveDesktopStartupLocale(null, []).id).toBe('en')
    expect(resolveDesktopStartupLocale('zh', ['ru-RU']).id).toBe('ru')
  })

})
