/** Locale bundles for the web-search provider's settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type WebSearchSettingsLocaleKey =
  | 'title' | 'description' | 'searchSection' | 'fetchSection'
  | 'providerDeepSeek' | 'providerLocal' | 'providerDeepSeekFetch' | 'providerMissing' | 'providerAuto' | 'searchAutoHint'
  | 'providerLegacy' | 'legacyKeyHint' | 'maxUses' | 'maxUsesHint' | 'invalidMaxUses'
  | 'providersFailed' | 'retry'
  | 'pluginProviderHint' | 'searchGuide' | 'searchGuideUrl'
  | 'credential' | 'apiKeySet' | 'apiKeyUnsetApi'
  | 'baseUrl' | 'baseUrlHint'
  | 'count' | 'countHint'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'invalidNumber' | 'invalidCount'
  | 'billing' | 'billingAuto' | 'billingAutoHint' | 'billingAccount' | 'billingAccountHint' | 'billingApiKey' | 'billingApiKeyHint'
  | 'billingAdvancedOverride'

/** English copy. */
export const en: Record<WebSearchSettingsLocaleKey, string> = {
  title: 'Web search and fetch',
  description: 'Choose the providers web search and web fetch use.',
  searchSection: 'Web search provider',
  fetchSection: 'Web fetch provider',
  providerDeepSeek: 'DeepSeek Search API',
  providerLegacy: 'DeepSeek server-side search',
  legacyKeyHint: 'Uses the signed-in account on account-model requests; otherwise uses this API key ({ref}), shared with Models by default.',
  maxUses: 'Maximum searches per request',
  maxUsesHint: 'Maximum server-side searches per Messages request: a positive integer, default 5.',
  invalidMaxUses: 'Enter a positive integer, or leave blank to use the default.',
  providerLocal: 'Direct fetch',
  providerDeepSeekFetch: 'DeepSeek Fetch API',
  providerMissing: '{id} (not loaded)',
  providerAuto: 'Automatic',
  searchAutoHint: "Follows the conversation's model: DeepSeek models use DeepSeek server-side search, which has no per-search charge; other models use DeepSeek Search API.",
  providersFailed: "Couldn't load the provider list, so this menu may be incomplete.",
  retry: 'Retry',
  pluginProviderHint: 'Configure this provider in its own plugin settings.',
  credential: 'API key',
  baseUrl: 'Base URL',
  baseUrlHint: 'Include the API prefix. Leave blank to use the official address. The provider appends {path}.',
  apiKeyUnsetApi: 'No key is configured.',
  searchGuide: 'Search & Fetch guide',
  searchGuideUrl: 'https://api.vega.chat',
  apiKeySet: 'A key is configured.',
  count: 'Results per search',
  countHint: 'Results returned per search: 1 to 50, default 10.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
  invalidCount: 'Enter an integer from 1 to 50, or leave blank to use the default.',
  billing: 'Billing',
  billingAuto: 'Automatic',
  billingAutoHint: "Follows the conversation's DeepSeek account or API key; with other models, uses the API key first, then the signed-in account.",
  billingAccount: 'Signed-in DeepSeek account',
  billingAccountHint: 'Requires signing in to DeepSeek.',
  billingApiKey: 'DeepSeek API key',
  billingApiKeyHint: 'Uses the API key from the Models page; set one first.',
  billingAdvancedOverride: 'Overridden by {fields}',
}

/** Simplified Chinese copy. */

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: WebSearchSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}

/** Japanese copy. */

/** Spanish dictionary. */

/** French dictionary. */

/** German dictionary. */

/** Russian dictionary. */
export const ru = {
  title: 'Веб-поиск и загрузка страниц',
  description: 'Выберите провайдеров для веб-поиска и загрузки страниц.',
  searchSection: 'Провайдер веб-поиска',
  fetchSection: 'Провайдер загрузки веб-страниц',
  providerDeepSeek: 'DeepSeek Search API',
  providerLegacy: 'DeepSeek (прежняя версия)',
  legacyKeyHint: 'Запросы модели аккаунта используют активный аккаунт; остальные — этот ключ API ({ref}), по умолчанию общий с настройками моделей.',
  maxUses: 'Максимум поисковых запросов на один запрос',
  maxUsesHint: 'Максимум серверных поисков на один запрос Messages: положительное целое число, по умолчанию 5.',
  invalidMaxUses: 'Введите положительное целое или оставьте пустым для значения по умолчанию.',
  providerLocal: 'Прямая загрузка',
  providerDeepSeekFetch: 'DeepSeek Fetch API',
  providerMissing: '{id} (не загружен)',
  providerAuto: 'Автоматически',
  searchAutoHint: 'Следует модели разговора: модели DeepSeek используют серверный поиск DeepSeek без платы за каждый поиск; остальные модели используют DeepSeek Search API.',
  providersFailed: 'Не удалось загрузить список провайдеров, поэтому это меню может быть неполным.',
  retry: 'Повторить',
  pluginProviderHint: 'Настройте этого провайдера в настройках его собственного плагина.',
  credential: 'Ключ API',
  baseUrl: 'Базовый URL',
  baseUrlHint: 'Укажите префикс API. Оставьте пустым, чтобы использовать официальный адрес. Провайдер добавляет {path}.',
  apiKeyUnsetApi: 'Ключ не настроен.',
  searchGuide: 'Руководство Search & Fetch',
  searchGuideUrl: 'https://api.vega.chat',
  apiKeySet: 'Ключ настроен.',
  count: 'Результатов на поиск',
  countHint: 'Результатов, возвращаемых на один запрос: целое число от 1 до 50, по умолчанию 10. Управляет количеством результатов, а не числом вызовов поиска. web_search сохраняет не больше источников, чем позволяет его собственный лимит.',
  overridden: 'Переопределено',
  reset: 'Сбросить до значения по умолчанию',
  readOnly: 'В этом развертывании настройки доступны только для чтения.',
  unavailable: 'Плагин не загружен, поэтому сейчас его нельзя настроить.',
  save: 'Сохранить',
  saving: 'Сохранение…',
  saveFailed: 'Развертывание не приняло эти значения; они оставлены для исправления.',
  invalidNumber: 'Введите число или оставьте поле пустым, чтобы использовать значение по умолчанию.',
  invalidCount: 'Введите целое число от 1 до 50 или оставьте поле пустым, чтобы использовать значение по умолчанию.',
  billing: 'Оплата',
  billingAuto: 'Автоматически',
  billingAutoHint: 'Следует аккаунту или ключу API DeepSeek из разговора; с другими моделями сначала ключ API, затем активный аккаунт.',
  billingAccount: 'Активный аккаунт DeepSeek',
  billingAccountHint: 'Требуется вход в DeepSeek.',
  billingApiKey: 'Ключ API DeepSeek',
  billingApiKeyHint: 'Использует ключ API со страницы моделей; сначала задайте его.',
  billingAdvancedOverride: 'Переопределено: {fields}',
} satisfies Record<keyof typeof en, string>

/** Portuguese dictionary. */
