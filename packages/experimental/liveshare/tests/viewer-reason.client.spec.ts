// @vitest-environment jsdom
/** The copy a viewer page states for the reason code its share's abilities carry. */

import { Context } from '@deepseek-ai/cordis'
import { LocaleRuntime } from '@deepseek-ai/dsh-client-locale/client'
import { describe, expect, it } from 'vitest'
import {
  en, NS, viewerReasonText, viewerRefusalText, ru, type LiveshareKey,
} from '../src/client/locales.ts'

// The page's copy comes from the client locale seat, the same one the owner's dialogs use, so the
// reader's chosen language decides it. Bind it the way the served page's client tree does.
const locale = new LocaleRuntime(new Context())
locale.register(NS, { en, ru })
locale.setLocale('ru')
const t = locale.bind(NS)

describe('viewer reason copy', () => {
  it('states a known reason code in the reader\'s language', () => {
    expect(viewerReasonText(t, 'share-stopped')).toBe(ru['viewer.reason.share-stopped'])
    expect(viewerReasonText(t, 'fork-not-permitted')).toBe(ru['viewer.reason.fork-not-permitted'])
    // The reader's own language wins over the browser's: a language chosen in Settings decides.
    locale.setLocale('en')
    expect(viewerReasonText(t, 'share-stopped')).toBe(en['viewer.reason.share-stopped'])
    locale.setLocale('ru')
  })

  it('states a branch the Host created without limits as unusable, and a reused request as no branch', () => {
    // The Host made the child but could not install its read-only limits: the reader is told the branch
    // exists and cannot be used, never that nothing was created and never that it can be driven.
    expect(viewerReasonText(t, 'fork-enforcement-failed'))
      .toBe('Сеанс ответвления создан, но его ограничения изолированной среды не удалось установить, поэтому им нельзя пользоваться')
    // One request naming a prefix its earlier request did not is refused instead of making a second
    // child, so the reader is told no new Session came out of it.
    expect(viewerReasonText(t, 'fork-operation-conflict'))
      .toBe('Этот запрос ответвления указывал другой префикс, чем предыдущий, поэтому новый сеанс не создан')
    // The branch the reader already owns stayed where it was; what failed is the Host's preparation of
    // it, and the same code answers a prompt into that branch and a stop of it, so the copy names the
    // action the reader asked for rather than a message in particular.
    expect(viewerReasonText(t, 'fork-prepare-failed'))
      .toBe('Хост не смог подготовить это ответвление, поэтому действие не выполнено')
    // The two refusals a source write comes back with: the owner's share no longer allows writing it,
    // and the Host cannot confine it. Neither states what became of the request, because the Host
    // re-checks both after the dispatch — a refusal here is not a rollback.
    expect(viewerReasonText(t, 'share-not-writable')).toBe('Владелец не разрешает запись в этот сеанс')
    expect(viewerReasonText(t, 'source-write-unavailable'))
      .toBe('Этот хост не смог ограничить общий сеанс, поэтому не может им управлять')
  })

  it('states the reason it knows with the stable code, and never the Host\u2019s own words', () => {
    // The page states its own reason for a code it knows, with that code beside it so a reader can
    // quote what was refused.
    expect(viewerRefusalText(t, 'fork-not-permitted')).toBe('Владелец не разрешает ответвлять этот сеанс (fork-not-permitted)')
    expect(viewerRefusalText(t, 'fork-prepare-failed'))
      .toBe('Хост не смог подготовить это ответвление, поэтому действие не выполнено (fork-prepare-failed)')
    // The composer's own draft and the Stop it offers come back with these two codes, so both are
    // stated the same way: this page's reason with the Host's stable code beside it.
    expect(viewerRefusalText(t, 'share-not-writable'))
      .toBe('Владелец не разрешает запись в этот сеанс (share-not-writable)')
    expect(viewerRefusalText(t, 'source-write-unavailable'))
      .toBe('Этот хост не смог ограничить общий сеанс, поэтому не может им управлять (source-write-unavailable)')
  })

  it('states no refusal for a code it does not know', () => {
    // The Host's message and code stay the surface's fallback for every code this page cannot state.
    expect(viewerRefusalText(t, 'share-suspended-by-policy')).toBeUndefined()
  })

  it('names both languages for every reason code the page maps', () => {
    const keys = Object.keys(ru).filter(key => key.startsWith('viewer.reason.'))
    expect(keys.length).toBeGreaterThan(0)
    for (const language of ['ru', 'en'] as const) {
      locale.setLocale(language)
      const dictionary: Readonly<Record<string, string>> = language === 'ru' ? ru : en
      for (const key of keys) {
        const code = key.slice('viewer.reason.'.length)
        expect(viewerReasonText(t, code), `${language} ${code}`)
          .toBe(dictionary[key as LiveshareKey])
        expect(ru[key as LiveshareKey]).toBeTruthy()
        expect(en[key as LiveshareKey]).toBeTruthy()
      }
    }
    locale.setLocale('ru')
  })

  it('states a code it does not know instead of inventing copy', () => {
    // The owner host and the Relay own the reason vocabulary: a code from a newer owner reaches the
    // reader unchanged, which is how the page reports a reason it was told and cannot translate.
    expect(viewerReasonText(t, 'share-suspended-by-policy')).toBe('share-suspended-by-policy')
  })
})
