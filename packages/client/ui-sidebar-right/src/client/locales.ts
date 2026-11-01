/**
 * `sidebarRight` namespace dictionaries.
 *
 * Everything a user reads in this column is here, including the strings handed
 * to the docking kit — the kit renders no copy of its own, so its whole
 * vocabulary is this package's to own and translate.
 */

/** Right-Sidebar dictionary key union. */
export type SidebarRightKey = keyof typeof en

/** English dictionary (the key-set source of truth). */
export const en = {
  'menu.close': 'Close',
  'menu.closeOthers': 'Close Other Tabs',
  'menu.closeRight': 'Close Tabs to the Right',
  'command.close': 'Close current page or window',
  'command.refresh': 'Refresh current page',
  'command.noRefresh': 'This page cannot be refreshed',
  'command.toggle': 'Toggle right sidebar',
  'command.fullscreen': 'Toggle panel fullscreen',
  'command.noSession': 'Select a session first',
  'command.noFocus': 'Focus a right sidebar pane first',
  'command.stale': 'The page changed; focus it again',
  'command.collapsed': 'Expand the right sidebar first',
  'command.float': 'This action is unavailable in a floating panel',
  'command.empty': 'Open a page first',
  'command.budget': 'Two panes is the limit',
  'command.width': 'Not enough width to split, widen the sidebar',
  'chrome.expand': 'Open sidebar',
  'chrome.expandAria': 'Open right sidebar',
  'chrome.collapse': 'Collapse sidebar',
  'chrome.collapseAria': 'Collapse right sidebar',
  'chrome.toFullscreen': 'Fullscreen',
  'chrome.exitFullscreen': 'Exit fullscreen',
  'dock.emptyPane': 'Empty pane',
  'dock.splitPane': 'Split',
  'dock.splitPaneDisabled': 'Two panes is the limit',
  'dock.splitPaneNarrow': 'Not enough width to split, widen the sidebar',
  'dock.closeTab': 'Close',
  'dock.addTab': 'New tab',
  'dock.dockFloat': 'Send back to the sidebar',
  'dock.closeFloat': 'Close',
  'dock.drop.center': 'Move here',
  'dock.drop.left': 'Add left split',
  'dock.drop.right': 'Add right split',
  'dock.drop.top': 'Add top split',
  'dock.drop.bottom': 'Add bottom split',
  'tab.guide.title': 'Start',
  'tab.guide.more': 'More tools',
  'tab.unavailable': 'Nothing here can view this kind of content yet.',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'menu.close': 'Закрыть',
  'menu.closeOthers': 'Закрыть другие вкладки',
  'menu.closeRight': 'Закрыть вкладки справа',
  'command.close': 'Закрыть текущую страницу или окно',
  'command.refresh': 'Обновить текущую страницу',
  'command.noRefresh': 'Эту страницу нельзя обновить',
  'command.toggle': 'Переключить видимость правой боковой панели',
  'command.fullscreen': 'Переключить полноэкранный режим панели',
  'command.noSession': 'Сначала выберите сессию',
  'command.noFocus': 'Сначала установите фокус на панели справа',
  'command.stale': 'Страница изменилась; установите на неё фокус снова',
  'command.collapsed': 'Сначала разверните правую боковую панель',
  'command.float': 'Это действие недоступно в плавающей панели',
  'command.empty': 'Сначала откройте страницу',
  'command.budget': 'Можно открыть не более двух панелей',
  'command.width': 'Недостаточно места для разделения — увеличьте ширину боковой панели',
  'chrome.expand': 'Открыть боковую панель',
  'chrome.expandAria': 'Открыть правую боковую панель',
  'chrome.collapse': 'Свернуть боковую панель',
  'chrome.collapseAria': 'Свернуть правую боковую панель',
  'chrome.toFullscreen': 'Полный экран',
  'chrome.exitFullscreen': 'Выйти из полноэкранного режима',
  'dock.emptyPane': 'Пустая панель',
  'dock.splitPane': 'Разделить',
  'dock.splitPaneDisabled': 'Можно открыть не более двух панелей',
  'dock.splitPaneNarrow': 'Недостаточно места для разделения — увеличьте ширину боковой панели',
  'dock.closeTab': 'Закрыть',
  'dock.addTab': 'Новая вкладка',
  'dock.dockFloat': 'Вернуть на боковую панель',
  'dock.closeFloat': 'Закрыть',
  'dock.drop.center': 'Переместить сюда',
  'dock.drop.left': 'Добавить разделение слева',
  'dock.drop.right': 'Добавить разделение справа',
  'dock.drop.top': 'Добавить разделение сверху',
  'dock.drop.bottom': 'Добавить разделение снизу',
  'tab.guide.title': 'Начало',
  'tab.guide.more': 'Больше инструментов',
  'tab.unavailable': 'Пока нет способа просмотреть содержимое такого типа.',
} satisfies Record<keyof typeof en, string>
