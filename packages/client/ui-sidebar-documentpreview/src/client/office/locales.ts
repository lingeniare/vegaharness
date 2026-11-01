
/** Office preview locale keys. */
export type OfficePreviewKey = keyof typeof en

/** English translations the key-set source of truth. */
export const en = {
  title: 'Office document',
  loading: 'Rendering document...',
  retry: 'Retry',
  viewMissingFonts: 'Missing fonts: {count}. Click to view.',
  missingFontsTitle: 'Missing fonts',
  missingFontsDescription: 'These fonts are unavailable for this preview. Text and layout may differ from the original document.',
  missingFontsCount: 'Fonts: {count}',
  closeDetails: 'Close font details',
  unavailable: 'Office previews are unavailable. Enable the document preview service on the computer running VEGA Harness.',
  invalid: 'This Office file cannot be previewed. It may be damaged, password protected, or have the wrong extension.',
  tooLarge: 'The Office file or converted PDF exceeds the preview size limit. Reduce the file size or adjust the preview configuration.',
  failed: 'Office conversion did not produce a usable PDF. Check the file and try again.',
  timeout: 'Office conversion timed out. Try again.',
  busy: 'Office preview is busy. Try again shortly.',
  changed: 'The file changed while being read. Reopen the preview.',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Документ Office',
  loading: 'Отрисовка документа...',
  retry: 'Повторить',
  viewMissingFonts: 'Отсутствуют шрифты: {count}. Нажмите, чтобы посмотреть.',
  missingFontsTitle: 'Отсутствующие шрифты',
  missingFontsDescription: 'Эти шрифты недоступны для предварительного просмотра. Текст и оформление могут отличаться от исходного документа.',
  missingFontsCount: 'Шрифты: {count}',
  closeDetails: 'Закрыть сведения о шрифтах',
  unavailable: 'Предварительный просмотр документов Office недоступен. Включите службу предварительного просмотра документов на компьютере, где запущен VEGA Harness.',
  invalid: 'Этот файл Office нельзя просмотреть. Возможно, он повреждён, защищён паролем или имеет неверное расширение.',
  tooLarge: 'Размер файла Office или преобразованного PDF превышает ограничение для предварительного просмотра. Уменьшите размер файла или измените настройки предварительного просмотра.',
  failed: 'При преобразовании файла Office не удалось получить пригодный для просмотра PDF. Проверьте файл и повторите попытку.',
  timeout: 'Время ожидания преобразования файла Office истекло. Повторите попытку.',
  busy: 'Предварительный просмотр файла Office занят. Повторите попытку позже.',
  changed: 'Файл изменился во время чтения. Откройте предварительный просмотр заново.',
} satisfies Record<keyof typeof en, string>
