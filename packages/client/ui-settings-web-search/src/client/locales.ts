/** Locale bundles for the web-search provider's settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type WebSearchSettingsLocaleKey =
  | 'title' | 'description' | 'useVega' | 'useVegaHint' | 'useSearchApi' | 'useSearchApiHint' | 'searchGuide' | 'searchGuideUrl'
  | 'apiKey' | 'apiKeyHint' | 'apiKeySet' | 'apiKeyUnset'
  | 'baseUrl' | 'baseUrlHint' | 'searchApiBaseUrl' | 'searchApiBaseUrlHint' | 'maxUses' | 'maxUsesHint' | 'count' | 'countHint'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'invalidNumber' | 'invalidCount'

/** English copy. */
export const en: Record<WebSearchSettingsLocaleKey, string> = {
  title: 'Web search',
  description: 'Set up the DeepSeek search provider.',
  useVega: 'Use the API VEGA account',
  useVegaHint: 'On by default: search and fetch run through the signed-in API VEGA account\'s server tools, billed to the account balance. Turn off to use the DeepSeek providers below.',
  useSearchApi: 'Use the new Web Search API',
  useSearchApiHint: 'Off by default: search runs through DeepSeek Messages. For the new Web Search API\'s features and pricing, see the ',
  searchGuide: 'Search & Fetch guide',
  searchGuideUrl: 'https://api-docs.deepseek.com/guides/search',
  apiKey: 'API key',
  apiKeyHint: 'Stored outside the settings file. Leave blank to keep the current key.',
  apiKeySet: 'A key is configured.',
  apiKeyUnset: 'No key is configured; only conversations using a DeepSeek Account model can search, through the default endpoint.',
  baseUrl: 'Messages API base URL',
  baseUrlHint: 'Include the API prefix, such as https://api.deepseek.com/anthropic/v1. The provider appends /messages. Leave blank to restore the default.',
  searchApiBaseUrl: 'Search / Fetch API base URL',
  searchApiBaseUrlHint: 'Include the API prefix, such as https://api.deepseek.com/v1/tools. The provider appends /search or /fetch. Leave blank to restore the default.',
  maxUses: 'Max searches per request',
  maxUsesHint: 'How many searches the auxiliary model may run within one Messages request. Applies only to the Messages API.',
  count: 'Results per search',
  countHint: 'Results returned per query: an integer from 1 to 50, default 10. This controls result count, not search calls. web_search keeps no more sources than its own result limit.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
  invalidCount: 'Enter an integer from 1 to 50, or leave blank to use the default.',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: WebSearchSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Веб-поиск',
  description: 'Настройте поставщика поиска VEGA.',
  useVega: 'Использовать аккаунт API VEGA',
  useVegaHint: 'Включено по умолчанию: поиск и загрузка страниц выполняются серверными инструментами вошедшего аккаунта API VEGA и списываются с баланса. Выключите, чтобы использовать провайдеры DeepSeek ниже.',
  useSearchApi: 'Использовать новый API веб-поиска',
  useSearchApiHint: 'По умолчанию выключен: поиск выполняется через VEGA Messages. Возможности и тарифы нового API веб-поиска см. в ',
  searchGuide: 'руководстве Search & Fetch',
  searchGuideUrl: 'https://api.vega.chat',
  apiKey: 'API Key',
  apiKeyHint: 'Хранится отдельно от файла настроек. Оставьте поле пустым, чтобы сохранить текущий ключ.',
  apiKeySet: 'Ключ настроен.',
  apiKeyUnset: 'Ключ не настроен; искать через адрес по умолчанию могут только сессии, использующие модель VEGA Account.',
  baseUrl: 'Базовый URL Messages API',
  baseUrlHint: 'Укажите префикс API, например https://api.vega.chat/api/v1. Поставщик добавляет /messages. Оставьте пустым, чтобы восстановить значение по умолчанию.',
  searchApiBaseUrl: 'Базовый URL API Search / Fetch',
  searchApiBaseUrlHint: 'Укажите префикс API, например https://api.vega.chat/api/v1. Поставщик добавляет /search или /fetch. Оставьте пустым, чтобы восстановить значение по умолчанию.',
  maxUses: 'Максимум поисковых запросов на один запрос',
  maxUsesHint: 'Сколько поисковых запросов вспомогательная модель может выполнить в рамках одного запроса Messages. Применимо только к Messages API.',
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
} satisfies Record<keyof typeof en, string>
