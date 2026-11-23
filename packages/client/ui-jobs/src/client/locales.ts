/** `job` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'job'

/** English dictionary (the key-set source of truth). */

/** English dictionary. */
export const en = {
  'count.live.one': '{count} background job running',
  'count.live.other': '{count} background jobs running',
  'count.idle.one': '{count} background job',
  'count.idle.other': '{count} background jobs',
  'section.live': 'Running',
  'duration.title.live': 'Running for {duration}',
  'duration.title.done': 'Took {duration}',

  'list.aria': 'Background jobs',
  'indicator.running': 'Background jobs running: {count}',
  'section.settledCount': 'Finished {count}',
  'section.clear': 'Clear',
  'live.more': 'Show {count} more running',
  'live.foldName': '{label} (running background jobs)',
  'settled.more': 'Show {count} more finished',
  'settled.foldName': '{label} (finished background jobs)',
  'fold.less': 'Show less',
  'row.expandAria': 'Show live output of {label}',
  'row.collapseAria': 'Hide live output of {label}',
  'kill.stop': 'Stop task',
  'kill.stopAria': 'Stop task {label}',
  'kill.confirm': 'Click again to confirm',
  'kill.confirmAction': 'Confirm stop',
  'kill.failed': 'Stop failed',
  'status.running': 'running',
  'status.stopping': 'stopping',
  'status.completed': 'completed',
  'status.killed': 'cancelled',
  'status.failed': 'failed',
  'duration.seconds': '{seconds}s',
  'duration.minutes': '{minutes}m {seconds}s',
  'duration.hours': '{hours}h {minutes}m',
  'output.gap': '… earlier output dropped …',
  'output.error': 'live output stream interrupted: {error}',
  'terminal.signal': 'signal {signal}',
  'terminal.exitCode': 'exit {code}',
  'terminal.noExitCode': 'no exit code',
  'terminal.commandLine': 'Command line {n}',
  'terminal.running': 'running',
  'terminal.failed': 'failed',
  'terminal.done': 'done',
  'terminal.copy': 'Copy',
  'terminal.copied': 'Copied',
  'terminal.noOutput': '(no output)',
  'terminal.collapse': 'Collapse',
  'terminal.collapseAria': 'Collapse output',
  'terminal.expand': 'Show {n} more lines',
  'terminal.expandAria': 'Expand {n} collapsed output lines',
}

/** Key domain of the `job` namespace (zh is the source of truth). */
export type JobKey = keyof typeof en

/** Japanese copy. */

/** Spanish dictionary. */

/** French dictionary. */

/** German dictionary. */

/** Russian dictionary. */
export const ru = {
  'count.live.one': 'Выполняется {count} фоновая задача',
  'count.live.other': 'Выполняется фоновых задач: {count}',
  'count.idle.one': '{count} фоновая задача',
  'count.idle.other': 'Фоновых задач: {count}',
  'section.live': 'Выполняются',
  'duration.title.live': 'Выполняется {duration}',
  'duration.title.done': 'Заняло {duration}',

  'list.aria': 'Фоновые задачи',
  'indicator.running': 'Выполняется фоновых заданий: {count}',
  'section.settledCount': 'Завершено: {count}',
  'section.clear': 'Очистить',
  'live.more': 'Показать ещё {count} выполняющихся',
  'live.foldName': '{label} (выполняющиеся фоновые задания)',
  'settled.more': 'Показать ещё {count} завершённых',
  'settled.foldName': '{label} (завершённые фоновые задания)',
  'fold.less': 'Свернуть',
  'row.expandAria': 'Показать вывод в реальном времени: {label}',
  'row.collapseAria': 'Скрыть вывод в реальном времени: {label}',
  'kill.stop': 'Остановить задачу {label}',
  'kill.stopAria': 'Остановить задачу {label}',
  'kill.confirm': 'Нажмите ещё раз для подтверждения',
  'kill.confirmAction': 'Подтвердить остановку',
  'kill.failed': 'Не удалось остановить',
  'status.running': 'выполняется',
  'status.stopping': 'останавливается',
  'status.completed': 'завершена',
  'status.killed': 'отменена',
  'status.failed': 'не выполнена',
  'duration.seconds': '{seconds} с',
  'duration.minutes': '{minutes} мин {seconds} с',
  'duration.hours': '{hours} ч {minutes} мин',
  'output.gap': '… более ранний вывод пропущен …',
  'output.error': 'поток вывода в реальном времени прерван: {error}',
  'terminal.signal': 'сигнал {signal}',
  'terminal.exitCode': 'код завершения {code}',
  'terminal.noExitCode': 'нет кода завершения',
  'terminal.commandLine': 'Командная строка {n}',
  'terminal.running': 'выполняется',
  'terminal.failed': 'не выполнено',
  'terminal.done': 'завершено',
  'terminal.copy': 'Копировать',
  'terminal.copied': 'Скопировано',
  'terminal.noOutput': '(нет вывода)',
  'terminal.collapse': 'Свернуть',
  'terminal.collapseAria': 'Свернуть вывод',
  'terminal.expand': 'Показать ещё {n} строк',
  'terminal.expandAria': 'Развернуть {n} свёрнутых строк вывода',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary. */
