/** English card frame, fallback and tool-row copy. */
export const en = {
  expandBrief: 'Show more', collapseBrief: 'Show less',
  dismiss: 'Not now', dismissed: 'Dismissed', replaced: 'Replaced',
  unavailable: 'This action is unavailable. Check the plugin in Plugins.',
  transport: 'Could not confirm the result. Reconnect and check the card before retrying.',
  'row.title': 'Action card', 'row.preparing': 'Preparing a card', 'row.running': 'Proposing',
  'row.ok': 'Proposed', 'row.error': 'Not shown', 'row.stopped': 'Interrupted', 'row.inspect': 'Inspect call',
}

/** Keys shared by every dictionary. */
export type ActionCardKey = keyof typeof en

/** Russian card frame, fallback and tool-row copy. */
export const ru: Record<ActionCardKey, string> = {
  expandBrief: 'Показать больше', collapseBrief: 'Показать меньше',
  dismiss: 'Не сейчас', dismissed: 'Отклонено', replaced: 'Заменено',
  unavailable: 'Это действие недоступно. Проверьте плагин в разделе «Плагины».',
  transport: 'Не удалось подтвердить результат. Переподключитесь и проверьте карточку перед повторной попыткой.',
  'row.title': 'Карточка действия', 'row.preparing': 'Подготовка карточки', 'row.running': 'Предлагается',
  'row.ok': 'Предложено', 'row.error': 'Не показано', 'row.stopped': 'Прервано', 'row.inspect': 'Проверить вызов',
}
