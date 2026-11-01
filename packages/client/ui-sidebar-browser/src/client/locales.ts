
/** Browser dictionary key union. */
export type SidebarBrowserKey = keyof typeof en

/** English dictionary with the same keys. */
export const en = {
  'type.label': 'Browser',
  'guide.title': 'Browser',
  'guide.description': 'Browse web pages',
  'shortcut.noSession': 'Open a session first',
  'address.placeholder': 'Enter an HTTP(S) address',
  'address.changed': 'URL changed',
  back: 'Back',
  forward: 'Forward',
  reload: 'Reload',
  go: 'Go',
  external: 'Open in system browser',
  'sandbox.disable': 'Disable sandbox restrictions',
  'sandbox.enable': 'Restore sandbox restrictions',
  'sandbox.warning': 'Sandbox restrictions are disabled; the page can navigate the top-level app and use downloads, modal dialogs, and input locks.',
  start: 'Enter an HTTP(S) address to start browsing',
  loading: 'Opening…',
  'restore.previous': 'Previously opened',
  'restore.action': 'Restore page',
  'error.empty': 'Enter an address.',
  'error.invalid': 'That address is invalid or too long.',
  'error.protocol': 'Only HTTP and HTTPS addresses are supported; use Document Preview for local files.',
  'error.credentials': 'Addresses cannot contain a username or password.',
  'error.application-origin': 'The embedded browser cannot open the VEGA application itself.',
  'load.failed': 'The page could not load; reload or open it in the system browser.',
  'load.failed.detail': 'Page load failed ({code}): {description}',
  'address.unknown': 'The page navigated; this carrier cannot read its new URL.',
} satisfies Record<string, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Sidebar Browser labels, navigation controls, and failures. */
    sidebarBrowser: SidebarBrowserKey
  }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'type.label': 'Браузер',
  'guide.title': 'Браузер',
  'guide.description': 'Просмотр веб-страниц',
  'shortcut.noSession': 'Сначала откройте сессию',
  'address.placeholder': 'Введите адрес HTTP(S)',
  'address.changed': 'URL изменён',
  back: 'Назад',
  forward: 'Вперёд',
  reload: 'Обновить',
  go: 'Перейти',
  external: 'Открыть в системном браузере',
  'sandbox.disable': 'Отключить ограничения песочницы',
  'sandbox.enable': 'Восстановить ограничения песочницы',
  'sandbox.warning': 'Ограничения песочницы отключены; страница может перемещаться по приложению верхнего уровня и использовать загрузки, модальные диалоги и блокировку ввода.',
  start: 'Введите адрес HTTP(S), чтобы начать просмотр',
  loading: 'Открытие…',
  'restore.previous': 'Открытая ранее страница',
  'restore.action': 'Восстановить страницу',
  'error.empty': 'Введите адрес.',
  'error.invalid': 'Этот адрес недействителен или слишком длинный.',
  'error.protocol': 'Поддерживаются только адреса HTTP и HTTPS; для локальных файлов используйте предпросмотр документов.',
  'error.credentials': 'Адреса не могут содержать имя пользователя или пароль.',
  'error.application-origin': 'Встроенный браузер не может открыть само приложение VEGA.',
  'load.failed': 'Не удалось загрузить страницу; обновите её или откройте в системном браузере.',
  'load.failed.detail': 'Не удалось загрузить страницу ({code}): {description}',
  'address.unknown': 'Страница перешла по другому адресу; этот компонент не может прочитать новый URL.',
} satisfies Record<keyof typeof en, string>
