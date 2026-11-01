/** Locale-owned approval text; reviewer reasons remain verbatim in every language. */

/** English approval messages. */
export const en = {
  denied: 'Auto review denied this call.',
  deniedWithReason: (reason: string): string => `Auto review denied this call: ${reason}`,
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  denied: 'Auto review отклонила этот вызов.',
  deniedWithReason: (reason: string): string => `Auto review отклонила этот вызов: ${reason}`,
} satisfies typeof en

/**
 * Build all display translations without translating the reviewer's raw reason.
 * @param reason - optional reviewer explanation.
 * @returns text for the Client's localized-text resolver.
 */
export function deniedDisplayReason(reason?: string): Record<'en' | 'ru', string> {
  return reason === undefined
    ? { en: en.denied, ru: ru.denied }
    : { en: en.deniedWithReason(reason), ru: ru.deniedWithReason(reason) }
}
