/** `subagent` namespace dictionaries. */

/** Dictionary namespace owned by this plugin. */
export const NS = 'subagent'

/** English dictionary (the key-set source of truth). */

/** English dictionary. */
export const en = {
  'duration.exactTitle': 'Total active duration: {duration}',
  'catalog.migrationRequired': 'Migration required',
  'count.total.one': '{count} subagent',
  'count.total.other': '{count} subagents',
  'count.running.one': '{count} subagent running',
  'count.running.other': '{count} subagents running',
  'readonly.body': 'The parent session is offline; reopen it to continue sending messages.',
  'section.empty': 'No subagents',

  'section.title': 'Subagents',
  'indicator.running': 'Subagents running: {count}',
  'progress.completed': '{count} completed',
  'progress.active': '{count} in progress',
  'progress.inactive': '{count} not running',
  'progress.external': '{count} external',
  'list.more': 'Show {count} more',
  'list.less': 'Show less',
  'list.foldName': '{label} (subagents)',
  'duration.seconds': '{seconds}s',
  'duration.minutes': '{minutes}m {seconds}s',
  'duration.hours': '{hours}h {minutes}m {seconds}s',
  'duration.days': '{days}d',
  'duration.daysHours': '{days}d {hours}h',
  'duration.months': '~{months}mo',
  'duration.monthsDays': '~{months}mo {days}d',
  'duration.years': '~{years}y',
  'duration.yearsMonths': '~{years}y {months}mo',
  'duration.exactDays': '{days}d {hours}h {minutes}m {seconds}s',
  'tokens.thousand': '{value}K',
  'tokens.million': '{value}M',
  'tokens.total': '{value} tok',
  'hover.owner': 'Owner: {name}',
  'loading.label': 'Loading subagents…',
  'load.idle': 'Subagents not loaded',
  'load.error': 'Unable to load subagents',
  'retry': 'Retry',
  'mode.external': 'External task',
  'mode.oneShot': 'one-shot',
  'mode.continuable': 'continuable',
  'mode.unknown': 'unknown mode',
  'readonly.unknown.body': 'Read the child session to determine whether it can be continued.',
  'activity.running': 'running',
  'activity.completed': 'completed',
  'activity.inactive': 'not running',
  'branch.collapse': 'Collapse {label} descendants',
  'branch.expand': 'Expand {label} descendants',
  'switcher.aria': 'Switch subagent: {title}',
  'tree.aria': 'Subagent sessions',
  'open.sidebar': 'Open in sidebar',
  'open.floatWindow': 'Open in floating panel',
  'open.sidebar.aria': 'Open {label} in sidebar',
  'sidebar.chat': 'Chat',
  'readonly.oneShot.title': 'One-shot subagent record',
  'readonly.title': 'This subagent is read-only for now',
  'readonly.oneShot.body': 'One-shot tasks do not accept follow-ups; review the full execution record here.',
}

/** Key domain of the `subagent` namespace (zh is the source of truth). */
export type SubagentKey = keyof typeof en

/** Japanese copy. */

/** Spanish dictionary. */

/** French dictionary. */

/** German dictionary. */

/** Russian dictionary. */
export const ru = {
  'duration.exactTitle': 'Общая активная длительность: {duration}',
  'catalog.migrationRequired': 'Требуется миграция',
  'count.total.one': '{count} субагент',
  'count.total.other': '{count} субагентов',
  'count.running.one': 'Выполняется: {count} субагент',
  'count.running.other': 'Выполняются: {count} субагентов',
  'readonly.body': 'Родительская сессия не в сети; откройте её снова, чтобы продолжить отправку сообщений.',
  'section.empty': 'Нет субагентов',

  'section.title': 'Субагенты',
  'indicator.running': 'Выполняется субагентов: {count}',
  'progress.completed': '{count} завершено',
  'progress.active': '{count} в процессе',
  'progress.inactive': '{count} не выполняются',
  'progress.external': '{count} внешних',
  'list.more': 'Показать ещё {count}',
  'list.less': 'Свернуть',
  'list.foldName': '{label} (субагенты)',
  'duration.seconds': '{seconds}с',
  'duration.minutes': '{minutes}м {seconds}с',
  'duration.hours': '{hours}ч {minutes}м {seconds}с',
  'duration.days': '{days}д',
  'duration.daysHours': '{days}д {hours}ч',
  'duration.months': '~{months}мес',
  'duration.monthsDays': '~{months}мес {days}д',
  'duration.years': '~{years}г',
  'duration.yearsMonths': '~{years}г {months}мес',
  'duration.exactDays': '{days}д {hours}ч {minutes}м {seconds}с',
  'tokens.thousand': '{value}K',
  'tokens.million': '{value}M',
  'tokens.total': '{value} ток.',
  'hover.owner': 'Ответственный: {name}',
  'loading.label': 'Загрузка субагентов…',
  'load.idle': 'Субагенты не загружены',
  'load.error': 'Не удалось загрузить субагентов',
  'retry': 'Повторить',
  'mode.external': 'Внешняя задача',
  'mode.oneShot': 'одноразовый',
  'mode.continuable': 'доступный для продолжения',
  'mode.unknown': 'неизвестный режим',
  'readonly.unknown.body': 'Прочитайте дочернюю сессию, чтобы определить, можно ли её продолжить.',
  'activity.running': 'выполняется',
  'activity.completed': 'завершено',
  'activity.inactive': 'не выполняется',
  'branch.collapse': 'Свернуть дочерние элементы {label}',
  'branch.expand': 'Развернуть дочерние элементы {label}',
  'switcher.aria': 'Переключить субагента: {title}',
  'tree.aria': 'Сессии субагентов',
  'open.sidebar': 'Открыть на боковой панели',
  'open.floatWindow': 'Открыть на плавающей панели',
  'open.sidebar.aria': 'Открыть {label} на боковой панели',
  'sidebar.chat': 'Чат',
  'readonly.oneShot.title': 'Запись одноразового субагента',
  'readonly.title': 'Этот субагент пока доступен только для чтения',
  'readonly.oneShot.body': 'Для одноразовых задач нельзя отправлять последующие сообщения; здесь можно просмотреть полную запись выполнения.',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary. */
