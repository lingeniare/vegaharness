/** Web dictionaries for the chrome around a mod's band; the mods' own content is theirs. */

/** Locale namespace owned by the mods band. */
export const NS = 'claude-code-mods'

/** Mods band locale key union. */
export type ModsBandKey = keyof typeof en

/** English dictionary the key-set source of truth. */
export const en = {
  band: 'Claude Code mods',
  pressing: 'Working…',
  'press.failed': 'The button failed: {message}',
  'press.stale': 'That button belonged to an earlier drawing; the band has refreshed',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  band: 'Моды Claude Code',
  pressing: 'Выполняется…',
  'press.failed': 'Не удалось нажать кнопку: {message}',
  'press.stale': 'Эта кнопка относилась к предыдущему изображению; панель обновлена',
} satisfies Record<keyof typeof en, string>
