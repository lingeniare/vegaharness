/** Copy owned by the Quote interaction plugin. */

/** Quote plugin dictionary namespace. */
export const NS = 'messageQuotes'

/** Supported Quote interaction copy keys. */
export type MessageQuotesKey = keyof typeof en

/** English dictionary. */
export const en: Record<string, string> = {
  'quote.add': 'Quote text',
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'quote.add': 'Текст цитаты',
} satisfies Record<keyof typeof en, string>
