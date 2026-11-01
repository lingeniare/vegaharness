/** `sidebar` namespace dictionaries for shell controls and global panels. */

/** The sidebar namespace key union. */
export type SidebarKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'session.new': 'New Session',
  'session.new.label': 'New session',
  'toggle.open': 'Open sidebar',
  'toggle.collapse': 'Collapse sidebar',
  'panels.label': 'Global panels',
  'navigation.label': 'Navigation',
  'panels.more': 'More',
  'version.copied': 'Version copied',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'session.new': 'Новая сессия',
  'session.new.label': 'Новая сессия',
  'toggle.open': 'Открыть боковую панель',
  'toggle.collapse': 'Свернуть боковую панель',
  'panels.label': 'Глобальные панели',
  'navigation.label': 'Навигация',
  'panels.more': 'Ещё',
  'version.copied': 'Версия скопирована',
} satisfies Record<keyof typeof en, string>
