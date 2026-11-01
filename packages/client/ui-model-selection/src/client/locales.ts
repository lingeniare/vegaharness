/**
 * `model` namespace dictionaries.
 *
 * `trigger.selectAria` intentionally matches `trigger.fallback` but remains a
 * separate key: the visible fallback label and the accessible name of
 * an unset trigger are free to diverge per locale, and folding it into
 * `trigger.aria` would announce the degenerate "Select model, current Select
 * model".
 */

/** The model namespace key union. */
export type ModelKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'provider.account': 'VEGA Account',
  'command.label': 'Model',
  'command.description': 'Select the model for this conversation',
  'option.loadError': 'Catalog failed to load: {message}',
  'trigger.fallback': 'Select model',
  'trigger.loading': 'Loading models…',
  'trigger.selectAria': 'Select model',
  'trigger.aria': 'Select model, current {model}',
  'trigger.ariaEffort': 'Select model, current {model}, reasoning effort {effort}',
  'menu.aria': 'Model and reasoning effort',
  'menu.model': 'Model',
  'menu.effort': 'Effort',
  'effort.providerDefault': 'Default',
  'status.loading': 'Refreshing model list…',
  'error.action': 'Model operation failed: {message}',
  'error.sessionInUse': 'This session is already in use, possibly by another running VEGA Harness instance (such as dsh web or the desktop app). Quit other running VEGA Harness instances and try again.',
  'action.reload': 'Reload',
  'warning.groupLoad': '{name} failed to load: {message}',
  'search.placeholder': 'Search models…',
  'search.clear': 'Clear search',
  'search.empty': 'No matching models.',
  'empty.models': 'No models available.',
  'empty.efforts': 'This model provides no reasoning effort levels.',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'provider.account': 'Аккаунт VEGA',
  'command.label': 'Модель',
  'command.description': 'Выберите модель для этой беседы',
  'option.loadError': 'Не удалось загрузить каталог: {message}',
  'trigger.fallback': 'Выбрать модель',
  'trigger.loading': 'Загрузка моделей…',
  'trigger.selectAria': 'Выбрать модель',
  'trigger.aria': 'Выбрать модель. Текущая: {model}',
  'trigger.ariaEffort': 'Выбрать модель. Текущая: {model}, уровень усилий при рассуждении: {effort}',
  'menu.aria': 'Модель и уровень усилий при рассуждении',
  'menu.model': 'Модель',
  'menu.effort': 'Уровень усилий',
  'effort.providerDefault': 'По умолчанию',
  'status.loading': 'Обновление списка моделей…',
  'error.action': 'Не удалось выполнить операцию с моделью: {message}',
  'error.sessionInUse': 'Эта сессия уже используется, возможно, другим запущенным экземпляром VEGA (например, dsh web или приложением для компьютера). Закройте другие запущенные экземпляры VEGA и повторите попытку.',
  'action.reload': 'Перезагрузить',
  'warning.groupLoad': 'Не удалось загрузить {name}: {message}',
  'search.placeholder': 'Поиск моделей…',
  'search.clear': 'Очистить поиск',
  'search.empty': 'Подходящие модели не найдены.',
  'empty.models': 'Нет доступных моделей.',
  'empty.efforts': 'Для этой модели не предусмотрены уровни усилий при рассуждении.',
} satisfies Record<keyof typeof en, string>
