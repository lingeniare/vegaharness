/** `plan` namespace dictionaries (the composer plan chip's copy). */

/** The plan namespace key union. */
export type PlanKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'chip.label': 'Plan',
  'preview.title': 'Plan',
  'preview.document': 'Plan · Markdown',
  'preview.action': 'Open',
  'preview.open': 'Open plan in sidebar',
  'preview.full': 'View full plan',
  'preview.openNamed': 'Open plan: {title}',
  'preview.loading': 'Loading plan…',
  'preview.failed': 'Could not load plan',
  'preview.invalidAddress': 'Invalid plan address',
  'preview.notFound': 'This plan was not found',
  'preview.unavailable': 'Plan preview is unavailable',
  'preview.expired': 'This temporary plan preview has expired. Reopen it from the pending review card.',
  'chip.on.aria': 'Plan mode on, press to turn off',
  'chip.on.title': 'Plan mode on — click to turn off (/plan off)',
  'chip.exitFailed': 'Failed to exit plan mode',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'chip.label': 'План',
  'preview.title': 'План',
  'preview.document': 'План · Markdown',
  'preview.action': 'Открыть',
  'preview.open': 'Открыть план в боковой панели',
  'preview.full': 'Просмотреть план целиком',
  'preview.openNamed': 'Открыть план: {title}',
  'preview.loading': 'Загрузка плана…',
  'preview.failed': 'Не удалось загрузить план',
  'preview.invalidAddress': 'Недопустимый адрес плана',
  'preview.notFound': 'План не найден',
  'preview.unavailable': 'Предпросмотр плана недоступен',
  'preview.expired': 'Срок действия временного предпросмотра плана истёк. Откройте его повторно из карточки, ожидающей подтверждения.',
  'chip.on.aria': 'Режим планирования включён. Нажмите, чтобы выключить',
  'chip.on.title': 'Режим планирования включён — нажмите, чтобы выключить (/plan off)',
  'chip.exitFailed': 'Не удалось выйти из режима планирования',
} satisfies Record<keyof typeof en, string>
