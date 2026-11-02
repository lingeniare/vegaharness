/** `piiShield` namespace dictionaries (the composer PII-shield toggle's copy). */

/** The piiShield namespace key union. */
export type PiiShieldKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'toggle.protected': 'Personal data is protected in the prompt and documents',
  'toggle.unprotected': 'Personal data is not protected in the prompt and documents',
  'toggle.failed': 'Could not update personal data protection',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'toggle.protected': 'Персональных данные защищены в промпте и документах',
  'toggle.unprotected': 'Персональные данные не защищены в промпте и документах',
  'toggle.failed': 'Не удалось изменить защиту персональных данных',
} satisfies Record<keyof typeof en, string>
