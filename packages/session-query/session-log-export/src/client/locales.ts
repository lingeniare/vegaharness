/** English dictionary (the key-set source of truth). */
export const en = {
  'header.more': 'More actions',
  'menu.copyMarkdown': 'Copy Session as Markdown',
  'menu.download': 'Download session log',
  'menu.feedback': 'Feedback',
  'toast.copied': 'Session copied as Markdown.',
  'toast.preparationFailed': 'Could not read the Session for copying. Try again.',
  'toast.clipboardFailed': 'Could not write to the clipboard. Check clipboard permission and try again.',
  'dialog.preparingTitle': 'Exporting Session',
  'dialog.preparingDescription': 'Preparing a ZIP containing this Session, its sub-Sessions, and attachments.',
  'dialog.successTitle': 'Session download started',
  'dialog.successDescription': 'The browser is downloading the Session ZIP.',
  'dialog.errorTitle': 'Session export failed',
  'dialog.close': 'Close',
  'dialog.commandFailed': 'Could not start the Session export.',
  'dialog.session': 'Session: {sessionId}',
} satisfies Record<string, string>

/** Locale namespace owned by Session export browser feedback. */
export const NS = 'session-log-download'

/** Stable locale keys consumed by the shared modal. */
export type SessionLogDownloadKey = keyof typeof en

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'header.more': 'Другие действия',
  'menu.copyMarkdown': 'Скопировать сеанс как Markdown',
  'menu.download': 'Скачать журнал сессии',
  'menu.feedback': 'Обратная связь',
  'toast.copied': 'Сессия скопирована как Markdown.',
  'toast.preparationFailed': 'Не удалось прочитать сеанс для копирования. Попробуйте еще раз.',
  'toast.clipboardFailed': 'Не удалось записать в буфер обмена. Проверьте разрешение буфера обмена и повторите попытку.',
  'dialog.preparingTitle': 'Экспорт сессии',
  'dialog.preparingDescription': 'Подготовка ZIP-архива с этой сессией, её подсессиями и вложениями.',
  'dialog.successTitle': 'Загрузка сессии началась',
  'dialog.successDescription': 'Браузер загружает ZIP-архив сессии.',
  'dialog.errorTitle': 'Не удалось экспортировать сессию',
  'dialog.close': 'Закрыть',
  'dialog.commandFailed': 'Не удалось начать экспорт сессии.',
  'dialog.session': 'Сеанс: {sessionId}',
} satisfies Record<keyof typeof en, string>
