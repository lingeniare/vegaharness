/** `settings.locale` namespace dictionaries (the Language row's copy). */

/** English dictionary (the key-set source of truth). */
export const en = {
  'language.title': 'Language',
} satisfies Record<string, string>

/** The settings.locale namespace key union. */
export type SettingsLocaleKey = keyof typeof en

/** Russian dictionary, checked complete against the English key set. */
export const ru = {
  'language.title': 'Язык',
} satisfies Record<SettingsLocaleKey, string>
