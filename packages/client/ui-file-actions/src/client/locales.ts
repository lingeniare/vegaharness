/** Original-file actions and completion feedback. */

/** File-action dictionary keys. */
export type FileActionKey = keyof typeof en

/** en file-action labels. */
export const en = {
  'menu.finder': 'Show in Finder',
  'menu.reveal': 'Show in folder',
  'menu.saveAs': 'Save as…',
  'menu.copied': 'Copied',
  'menu.copyImage': 'Copy image',
  'menu.download': 'Download',
  'menu.saveFailed': 'Could not save. Check the source and destination, then retry.',
  'menu.copyFailed': 'Could not copy. Check that the content is available, then retry.',
  'menu.saved': 'Saved',
  'menu.downloadStarted': 'Download started',
  'menu.downloaded': 'Download complete',
  'path.revealError': 'Could not show the file location. Try again.',
} satisfies Record<string, string>

/** ru file-action labels. */
export const ru = {
  'menu.finder': 'Показать в Finder',
  'menu.reveal': 'Показать в папке',
  'menu.saveAs': 'Сохранить как…',
  'menu.copied': 'Скопировано',
  'menu.copyImage': 'Копировать изображение',
  'menu.download': 'Скачать',
  'menu.saveFailed': 'Не удалось сохранить. Проверьте источник и место сохранения и повторите попытку.',
  'menu.copyFailed': 'Не удалось скопировать. Проверьте доступность содержимого и повторите попытку.',
  'menu.saved': 'Сохранено',
  'menu.downloadStarted': 'Скачивание началось',
  'menu.downloaded': 'Скачивание завершено',
  'path.revealError': 'Не удалось показать местоположение файла. Попробуйте еще раз.',
} satisfies Record<FileActionKey, string>
