/**
 * `sidebarFiles` namespace dictionaries, and the namespace's declaration.
 *
 * The failure lines name what the tree could not list, one code each, because a
 * directory that is gone, one outside the workspace, and a path that is not a
 * directory each suggest a different next step.
 *
 * The namespace merge lives with its key set so that any module naming
 * `TranslateNS<'sidebarFiles'>` or `PropsLocale<'sidebarFiles'>` needs only this
 * file, whichever entry a program loads first.
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** File-tree type name, guide entry, navigator controls, row states, and failure lines. */
    sidebarFiles: SidebarFilesKey
  }
}

/** Files dictionary key union. */
export type SidebarFilesKey = keyof typeof en

/** English dictionary (the key-set source of truth). */
export const en = {
  'shortcut.noSession': 'Select a session first',
  'type.label': 'Files',
  'guide.title': 'Workspace files',
  'guide.description': 'Browse files in this session\'s workspace',
  loading: 'Reading…',
  empty: 'Empty directory',
  truncated: 'Too many entries, showing only some of them.',
  noWorkspace: 'This session has no workspace directory.',
  reload: 'Reload',
  autoRefresh: 'Auto refresh',
  'autoRefresh.enable': 'Enable auto refresh',
  'autoRefresh.disable': 'Disable auto refresh',
  'entry.other': 'Not a file or a directory, so it cannot be opened.',
  'entry.noViewer': 'No viewer can open this file.',
  'navigator.show': 'Show file tree',
  'navigator.hide': 'Hide file tree',
  'navigator.resize': 'Resize file tree',
  'error.notFound': 'That directory is gone. It may have been moved or deleted.',
  'error.outsideWorkspace': 'That directory is outside the workspace, so the sidebar will not read it.',
  'error.notDirectory': 'That is not a directory.',
  'error.unavailable': 'Read failed: {message}',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'shortcut.noSession': 'Сначала выберите сессию',
  'type.label': 'Файлы',
  'guide.title': 'Файлы рабочей области',
  'guide.description': 'Просматривайте файлы в рабочей области этой сессии',
  loading: 'Чтение…',
  empty: 'Пустая папка',
  truncated: 'Слишком много элементов, показаны только некоторые из них.',
  noWorkspace: 'У этой сессии нет папки рабочей области.',
  reload: 'Перезагрузить',
  autoRefresh: 'Автообновление',
  'autoRefresh.enable': 'Включить автообновление',
  'autoRefresh.disable': 'Отключить автообновление',
  'entry.other': 'Это не файл и не папка, поэтому открыть его нельзя.',
  'entry.noViewer': 'Нет средства просмотра, которое может открыть этот файл.',
  'navigator.show': 'Показать дерево файлов',
  'navigator.hide': 'Скрыть дерево файлов',
  'navigator.resize': 'Изменить ширину дерева файлов',
  'error.notFound': 'Эта папка больше не существует. Возможно, её переместили или удалили.',
  'error.outsideWorkspace': 'Эта папка находится за пределами рабочей области, поэтому боковая панель не будет её читать.',
  'error.notDirectory': 'Это не папка.',
  'error.unavailable': 'Не удалось прочитать: {message}',
} satisfies Record<keyof typeof en, string>
