import { zoomEn, zoomRu } from '../zoom/locales.ts'

/** PDF translation keys shared by both dictionaries. */
export type PdfLocaleKey = keyof typeof en

/** English PDF-renderer dictionary. */
export const en = {
  ...zoomEn,
  title: 'PDF',
  pageImage: 'PDF page {page}',
  loading: 'Rendering document...',
  rendering: 'Rendering page…',
  failed: 'Cannot display PDF: {message}',
  password: 'This PDF requires a password; password-protected previews are not supported.',
  workerFailed: 'The PDF rendering process could not continue. Please retry.',
  unsupported: 'PDF preview requires the complete file contents.',
  retry: 'Retry',
} satisfies Record<string, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** PDF page, loading, and failure messages. */
    sidebarPdf: PdfLocaleKey
  }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  ...zoomRu,
  title: 'PDF',
  pageImage: 'Страница PDF {page}',
  loading: 'Выполняется отрисовка документа...',
  rendering: 'Отрисовка страницы…',
  failed: 'Не удалось отобразить PDF: {message}',
  password: 'Для этого PDF требуется пароль; предварительный просмотр PDF, защищённых паролем, не поддерживается.',
  workerFailed: 'Не удалось продолжить отрисовку PDF. Повторить?',
  unsupported: 'Для предварительного просмотра PDF требуется содержимое файла целиком.',
  retry: 'Повторить',
} satisfies Record<keyof typeof en, string>
