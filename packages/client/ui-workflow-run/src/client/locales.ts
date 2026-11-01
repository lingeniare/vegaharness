/** `workflowRun` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'workflowRun'

/** English dictionary (same key set). */
export const en = {
  'run.title': '{name}',
  'run.members.one': '{count} member',
  'run.members.other': '{count} members',
  'run.empty': 'No members started',
  'phase.unassigned': 'Unphased',
  'phase.empty': 'Empty phase name',
  'statusCount.running': 'Running {count}',
  'statusCount.completed': 'Completed {count}',
  'statusCount.failed': 'Failed {count}',
  'statusCount.cancelled': 'Cancelled {count}',
  'statusCount.interrupted': 'Interrupted {count}',
  'member.empty': 'Empty member name',
  'member.open': 'Open {name}',
  'status.running': 'Running',
  'status.completed': 'Completed',
  'status.failed': 'Failed',
  'status.cancelled': 'Cancelled',
  'status.interrupted': 'Interrupted',
}

/** Union of this namespace's dictionary keys. */
export type WorkflowRunKey = keyof typeof en

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'run.title': '{name}',
  'run.members.one': '{count} участник',
  'run.members.other': '{count} участников',
  'run.empty': 'Нет запущенных участников',
  'phase.unassigned': 'Без этапа',
  'phase.empty': 'Пустое имя этапа',
  'statusCount.running': 'Выполняется: {count}',
  'statusCount.completed': 'Завершено: {count}',
  'statusCount.failed': 'Не удалось: {count}',
  'statusCount.cancelled': 'Отменено: {count}',
  'statusCount.interrupted': 'Прервано: {count}',
  'member.empty': 'Пустое имя участника',
  'member.open': 'Открыть {name}',
  'status.running': 'Выполняется',
  'status.completed': 'Завершено',
  'status.failed': 'Не удалось',
  'status.cancelled': 'Отменено',
  'status.interrupted': 'Прервано',
} satisfies Record<keyof typeof en, string>
