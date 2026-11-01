/**
 * `sidebarDocumentPreview` namespace dictionaries.
 *
 * The failure lines are the point of this file: a preview that cannot show a
 * page has to say which of several different things went wrong, and each one
 * suggests a different next step for the reader.
 */

/** Text-preview dictionary key union. */
export type SidebarDocumentPreviewKey = keyof typeof en

/** English dictionary (the key-set source of truth). */
export const en = {
  loading: 'Rendering document...',
  loadMore: 'Load more',
  changed: 'The file has changed, showing the previous content.',
  reloadNow: 'Reload',
  reload: 'Read the file again',
  autoRefresh: 'Auto refresh',
  'autoRefresh.enable': 'Enable auto refresh',
  'autoRefresh.disable': 'Disable auto refresh',
  'wrap.enable': 'Turn on line wrap',
  'wrap.disable': 'Turn off line wrap',
  'wrap.aria': 'Line wrap',
  openWith: 'Open with',
  'viewer.text': 'Plain text',
  resourceUnavailable: 'The file resource service is unavailable.',
  rendererUnavailable: 'The {name} preview is unavailable.',
  unsupportedFile: 'Preview is not available for this file type yet.',
  'error.notFound': 'File not found. It may have been moved or deleted.',
  'error.tooLarge': 'This page exceeds the {limit} limit and cannot be read.',
  'error.notText': 'Preview is not available for this file type yet.',
  'error.notRegularFile': 'Not a regular file, nothing to display.',
  'error.unavailable': 'Read failed: {message}',
  retry: 'Retry',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  loading: 'Отображение документа...',
  loadMore: 'Загрузить ещё',
  changed: 'Файл изменился, отображается предыдущее содержимое.',
  reloadNow: 'Обновить',
  reload: 'Повторно прочитать файл',
  autoRefresh: 'Автообновление',
  'autoRefresh.enable': 'Включить автообновление',
  'autoRefresh.disable': 'Отключить автообновление',
  'wrap.enable': 'Включить перенос строк',
  'wrap.disable': 'Отключить перенос строк',
  'wrap.aria': 'Перенос строк',
  openWith: 'Открыть с помощью',
  'viewer.text': 'Обычный текст',
  resourceUnavailable: 'Служба доступа к файлам недоступна.',
  rendererUnavailable: 'Предварительный просмотр {name} недоступен.',
  unsupportedFile: 'Предварительный просмотр файлов этого типа пока недоступен.',
  'error.notFound': 'Файл не найден. Возможно, он был перемещён или удалён.',
  'error.tooLarge': 'Эта страница превышает ограничение {limit} и не может быть прочитана.',
  'error.notText': 'Предварительный просмотр файлов этого типа пока недоступен.',
  'error.notRegularFile': 'Это не обычный файл, отображать нечего.',
  'error.unavailable': 'Не удалось прочитать: {message}',
  retry: 'Повторить',
} satisfies Record<keyof typeof en, string>
