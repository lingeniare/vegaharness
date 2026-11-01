/** `goal` namespace dictionaries. */

/** The goal namespace key union. */
export type GoalKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'phase.active': 'Ongoing Goal',
  'phase.active.disarmed': 'Inactive Goal',
  'phase.paused': 'Paused Goal',
  'phase.blocked': 'Blocked Goal',
  'objective.aria': 'Goal objective',
  'commandInput.aria': 'Command input',
  'action.save': 'Save goal',
  'action.cancel': 'Cancel edit',
  'action.pause': 'Pause goal',
  'action.resume': 'Resume goal',
  'action.edit': 'Edit goal',
  'action.clear': 'Clear goal',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'phase.active': 'Текущая цель',
  'phase.active.disarmed': 'Неактивная цель',
  'phase.paused': 'Приостановленная цель',
  'phase.blocked': 'Заблокированная цель',
  'objective.aria': 'Содержание цели',
  'commandInput.aria': 'Ввод команды',
  'action.save': 'Сохранить цель',
  'action.cancel': 'Отменить редактирование',
  'action.pause': 'Приостановить цель',
  'action.resume': 'Возобновить цель',
  'action.edit': 'Редактировать цель',
  'action.clear': 'Очистить цель',
} satisfies Record<keyof typeof en, string>
