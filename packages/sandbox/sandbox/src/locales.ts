/** Locale-owned sandbox approval text; audit inputs remain verbatim. */

/** English escalation messages. */
export const en = {
  escalation: (mode: string, justification: string): string => `Allow this operation with ${mode} permissions: ${justification}`,
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  escalation: (mode: string, justification: string): string => `Разрешить эту операцию с правами ${mode}: ${justification}`,
} satisfies typeof en

/**
 * Build translations for the existing Client localized-text resolver.
 * @param mode - requested sandbox mode.
 * @param justification - raw model justification, preserved in every translation.
 * @returns localized approval text.
 */
export function escalationDisplayReason(mode: string, justification: string): Record<'en' | 'ru', string> {
  return {
    en: en.escalation(mode, justification),
    ru: ru.escalation(mode, justification),
  }
}
