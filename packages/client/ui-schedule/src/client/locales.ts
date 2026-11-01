/** English dictionary (the key-set source of truth). */
export const en = {
  'trigger.label': 'Automation tasks',
  'list.loading': 'Loading automation tasks…',
  'list.error': 'Could not load automation tasks.',
  'list.retry': 'Retry',
  'delete.action': 'Delete',
  'delete.pending': 'Deleting…',
  'delete.label': 'Delete automation task: {title}',
  'list.open': 'Open automation task details: {title}',
  'trigger.one': '{count} automation task',
  'trigger.other': '{count} automation tasks',
  'list.aria': 'Enabled automation tasks',
  'list.nextRun': 'Next run',
  'frequency.once': 'Once',
  'frequency.every': 'Every {value} {unit}',
  ...frequencyEn,
  'mark.aria': '{count} automation tasks',
  'hover.more': '{count} more',
} satisfies Record<string, string>

/**
 * `schedule.catalog` namespace dictionaries: the Session header catalog and the
 * Sidebar row mark with its hover-card task section.
 */
import { frequencyEn, frequencyRu } from './frequency-locales.ts'

/** Dictionary namespace owned by this plugin. */
export const NS = 'schedule.catalog'

/** Key domain of the Schedule catalog namespace. */
export type ScheduleCatalogKey = keyof typeof en

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'trigger.label': 'Напоминания',
  'list.loading': 'Загрузка напоминаний…',
  'list.error': 'Не удалось загрузить напоминания.',
  'list.retry': 'Повторить',
  'delete.action': 'Удалить',
  'delete.pending': 'Удаление…',
  'delete.label': 'Удалить напоминание: {title}',
  'list.open': 'Открыть сведения о напоминании: {title}',
  'trigger.one': '{count} напоминание',
  'trigger.other': '{count} напоминаний',
  'list.aria': 'Активные напоминания',
  'list.nextRun': 'Следующий запуск',
  'frequency.once': 'Один раз',
  'frequency.every': 'Каждые {value} {unit}',
  ...frequencyRu,
  'mark.aria': '{count} запланированных задач',
  'hover.more': 'Ещё {count}',
} satisfies Record<keyof typeof en, string>
