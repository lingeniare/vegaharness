
/** HTML renderer dictionary keys. */
export type HtmlPreviewKey = keyof typeof en

/** English dictionary with the same keys as the Russian dictionary. */
export const en = {
  title: 'HTML',
  frame: 'HTML document preview',
  loading: 'Rendering document...',
  failed: 'This HTML document could not be previewed.',
} satisfies Record<string, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** HTML preview selection and status text. */
    documentHtml: HtmlPreviewKey
  }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'HTML',
  frame: 'Предпросмотр HTML-документа',
  loading: 'Выполняется рендеринг документа...',
  failed: 'Не удалось просмотреть этот HTML-документ.',
} satisfies Record<keyof typeof en, string>
