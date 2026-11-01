/**
 * `command` namespace dictionaries: the composer menu's section headings,
 * the client face (title, description, claim token) of the built-in Host
 * commands whose catalog descriptors carry English text only, and the
 * popupSelect shell's copy.
 */

import { builtinCommandTokens } from '@deepseek-ai/dsh-commands/builtin'

/** The command namespace key union. */
export type CommandKey = keyof typeof en

/** English dictionary (the key-set source of truth). */
export const en = {
  'section.add': 'Add',
  'section.commands': 'Commands',
  'label.goal': 'Goal',
  'label.plan': 'Plan',
  'label.feedback': 'Feedback',
  'label.compact': 'Compact',
  'label.permission': 'Permission',
  'label.export': 'Export',
  'description.goal': 'Set or view the goal for a long-running task',
  'description.plan': 'Enter or leave plan mode',
  'description.feedback': 'Record feedback about this session',
  'description.compact': 'Compact older conversation history',
  'description.permission': 'Switch the permission preset (sandbox mode + approval policy)',
  'description.export': 'Download this Session log as a ZIP archive',
  'token.goal': builtinCommandTokens.en.goal,
  'token.plan': builtinCommandTokens.en.plan,
  'token.feedback': builtinCommandTokens.en.feedback,
  'token.compact': builtinCommandTokens.en.compact,
  'token.permission': builtinCommandTokens.en.permission,
  'token.export': builtinCommandTokens.en.export,
  'search.placeholder': 'Search…',
  'search.aria': 'Filter options',
  'status.loading': 'Loading options…',
  'status.applying': 'Applying…',
  'status.empty': 'No options',
  'overlay.aria': '/{command} options',
  'listbox.aria': '/{command} matches',
  'notice.attachmentsUnsupported': '/{command} does not accept attachments; remove them first',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'section.add': 'Добавить',
  'section.commands': 'Команды',
  'label.goal': 'Цель',
  'label.plan': 'План',
  'label.feedback': 'Отзыв',
  'label.compact': 'Сжать',
  'label.permission': 'Разрешение',
  'label.export': 'Экспорт',
  'description.goal': 'Задать или просмотреть цель долгосрочной задачи',
  'description.plan': 'Войти в режим планирования или выйти из него',
  'description.feedback': 'Оставить отзыв об этой сессии',
  'description.compact': 'Сжать историю старых сообщений',
  'description.permission': 'Переключить набор разрешений (режим песочницы и политика подтверждения)',
  'description.export': 'Скачать журнал этой сессии в виде ZIP-архива',
  'token.goal': builtinCommandTokens.ru.goal,
  'token.plan': builtinCommandTokens.ru.plan,
  'token.feedback': builtinCommandTokens.ru.feedback,
  'token.compact': builtinCommandTokens.ru.compact,
  'token.permission': builtinCommandTokens.ru.permission,
  'token.export': builtinCommandTokens.ru.export,
  'search.placeholder': 'Поиск…',
  'search.aria': 'Фильтровать варианты',
  'status.loading': 'Загрузка вариантов…',
  'status.applying': 'Применение…',
  'status.empty': 'Нет вариантов',
  'overlay.aria': 'Параметры /{command}',
  'listbox.aria': 'Совпадения для /{command}',
  'notice.attachmentsUnsupported': 'Команда /{command} не поддерживает вложения; сначала удалите их',
} satisfies Record<keyof typeof en, string>
