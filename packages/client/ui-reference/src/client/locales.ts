/** `reference` dictionaries for the unified `@` source and inline file navigation. */

import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Dictionary namespace owned by this plugin. */
export const NS = 'reference'

/**
 * English dictionary (the key-set source of truth).
 *
 * The `time.*` bucket words are this namespace's own copy of the session-row
 * vocabulary: locale-owned copy keeps the words per plugin, while the
 * bucketing they name is the one shared {@link relativeTime} in ui-primitives.
 */

/** The reference namespace key union. */
export type ReferenceKey = keyof typeof en

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Reference menu and per-file navigation feedback. */
    reference: ReferenceKey
  }
}

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'menu.addToChat': 'Add to chat',
  'menu.addToChatFailed': 'Couldn’t add file. Return to the chat and try again.',
  'section.files': 'Files & folders',
  'section.subagents': 'Subagents',
  'section.sessions': 'Sessions',
  'candidate.noCwd': '(no cwd)',
  'crumb.root': 'Workspace',
  'fileOpen.title': 'Couldn’t open file',
  'fileOpen.failed': 'Couldn’t open “{path}”. Try again or close this message.',
  'fileOpen.close': 'Close',
  'fileOpen.retry': 'Retry',
  'time.now': 'now',
  'time.minutes': '{n}min',
  'time.hours': '{n}h',
  'time.days': '{n}d',
  'time.months': '{n}mo',
  'time.years': '{n}y',
}

/** Japanese copy. */

/** Spanish dictionary. */

/** French dictionary. */

/** German dictionary. */

/** Russian dictionary. */
export const ru = {
  'menu.addToChat': 'Добавить в чат',
  'menu.addToChatFailed': 'Не удалось добавить файл. Вернитесь в чат и повторите попытку.',
  'section.files': 'Файлы и папки',
  'section.subagents': 'Субагенты',
  'section.sessions': 'Сессии',
  'candidate.noCwd': '(нет текущего каталога)',
  'crumb.root': 'Рабочая область',
  'fileOpen.title': 'Не удалось открыть файл',
  'fileOpen.failed': 'Не удалось открыть «{path}». Повторите попытку или закройте это сообщение.',
  'fileOpen.close': 'Закрыть',
  'fileOpen.retry': 'Повторить',
  'time.now': 'сейчас',
  'time.minutes': '{n} мин',
  'time.hours': '{n} ч',
  'time.days': '{n} дн.',
  'time.months': '{n} мес.',
  'time.years': '{n} г.',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary. */
