/** Typed product copy for recommendation cards. */

/** Keys shared by every card dictionary. */
export type RecommendationKey = keyof typeof en

/** English card copy. */
export const en = {
  heading: 'Recommended plugin',
  official: 'Official',
  detailsFor: 'View details: {title}',
  'version-error': 'This plugin is incompatible with this VEGA version. Update VEGA and retry.',
  'management-error': 'Could not enable the plugin. Open its details to check the error and retry.',
  enable: 'Enable',
  dismiss: 'Not now',
  working: 'Working…',
  scope: 'Available in all conversations when enabled',
  enabled: 'Enabled',
  'already-enabled': 'Already selected in Plugins. Open details to check its runtime status.',
  dismissed: 'Dismissed',
  'restart-required': 'Saved. Restart VEGA to apply.',
  failed: 'Could not enable. Retry or check Plugins.',
  retry: 'Retry enabling',
  unconfirmed: 'Could not confirm whether the plugin was enabled. Retry to check.',
  'lookup-failed': 'Could not load this plugin’s details. Try again.',
  retryLookup: 'Try again',
  unavailable: 'This plugin cannot be enabled now. Check Plugins.',
  unknown: 'This recommendation is unavailable. Reopen the conversation.',
  'access-denied': 'You do not have permission to change this profile.',
  'not-live-root': 'Use this recommendation in its original conversation.',
  closing: 'The service is reloading. Try again shortly.',
  transport: 'Could not confirm the result. Refresh and try again.',
}

/** Japanese card copy. */

/** Spanish card copy. */

/** French card copy. */

/** German card copy. */

/** Russian card copy. */
export const ru = {
  heading: 'Рекомендуемый плагин',
  official: 'Официальный',
  detailsFor: 'Подробнее: {title}',
  'version-error': 'Этот плагин несовместим с текущей версией VEGA. Обновите VEGA и повторите попытку.',
  'management-error': 'Не удалось включить плагин. Откройте его подробности, чтобы проверить ошибку, и повторите попытку.',
  enable: 'Включить',
  dismiss: 'Не сейчас',
  working: 'Обработка…',
  scope: 'После включения доступен во всех разговорах',
  enabled: 'Включено',
  'already-enabled': 'Уже выбран в разделе «Плагины». Откройте подробности, чтобы проверить состояние работы.',
  dismissed: 'Отклонено',
  'restart-required': 'Сохранено. Перезапустите VEGA, чтобы применить изменение.',
  failed: 'Не удалось включить. Повторите попытку или проверьте раздел «Плагины».',
  retry: 'Повторить включение',
  unconfirmed: 'Не удалось подтвердить, включен ли плагин. Повторите попытку, чтобы проверить.',
  'lookup-failed': 'Не удалось загрузить сведения об этом плагине. Повторите попытку.',
  retryLookup: 'Повторить',
  unavailable: 'Этот плагин сейчас нельзя включить. Проверьте раздел «Плагины».',
  unknown: 'Эта рекомендация недоступна. Откройте разговор заново.',
  'access-denied': 'У вас нет разрешения на изменение этого профиля.',
  'not-live-root': 'Используйте эту рекомендацию в исходном разговоре.',
  closing: 'Сервис перезагружается. Повторите попытку чуть позже.',
  transport: 'Не удалось подтвердить результат. Обновите страницу и повторите попытку.',
}

/** Portuguese card copy. */
