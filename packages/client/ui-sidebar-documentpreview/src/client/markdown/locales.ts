/** Markdown implementation labels and primitive chrome. */

/** Markdown namespace keys. */
export type MarkdownPreviewKey = keyof typeof en

/** English labels, paired with the Chinese key set. */
export const en = {
  'viewer.label': 'Markdown',
  'summary.title': 'Context summary',
  'summary.expired': 'This preview is no longer available. Content from a previous window is not kept after reload.',
  'code.copy': 'Copy',
  'code.copied': 'Copied',
  'footnotes': 'Footnotes',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Markdown document renderer and its code/footnote controls. */
    documentMarkdown: MarkdownPreviewKey
  }
}

/** Japanese copy. */

/** Spanish dictionary. */

/** French dictionary. */

/** German dictionary. */

/** Russian dictionary. */
export const ru = {
  'viewer.label': 'Markdown',
  'summary.title': 'Сводка контекста',
  'summary.expired': 'Этот просмотр больше недоступен. Содержимое из предыдущего окна не сохраняется после перезагрузки.',
  'code.copy': 'Копировать',
  'code.copied': 'Скопировано',
  'footnotes': 'Сноски',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary. */
