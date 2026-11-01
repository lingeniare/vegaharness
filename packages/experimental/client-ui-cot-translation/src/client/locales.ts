/** Locale-owned copy for reasoning translation and its preferences. */
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Dictionary namespace for this plugin. */
export const NS = 'cotTranslation'

/** English copy and key source. */
export const en = {
  provider: 'Translation service', google: 'Google', bing: 'Bing',
  deepseekAccount: 'DeepSeek Flash — account (paid)', deepseekOfficial: 'DeepSeek Flash — official API (paid)',
  providerUnavailableOption: '{provider} — unavailable',
  providerUnavailable: 'This provider is unavailable. Configure your DeepSeek account or official API provider, or choose an available service.',
  paidNotice: 'Each uncached fragment sends a separate paid DeepSeek Flash request through the selected account or official API credentials. Reopening reasoning reuses saved results; changing the provider, language, source text, or request settings may send a new paid request.',
  anonymousNotice: 'Bing and Google need no translation login or API key. Their anonymous endpoints may reject or limit requests.', targetLanguage: 'Target language',
  targetLanguageHint: 'auto follows the UI language; language codes such as zh, en, and ja also work.',
  privacy: 'Expanded reasoning is sent to the selected service. It may contain private code or conversation details.',
  translation: 'View translation', original: 'View original', retry: 'Retry', failed: 'Translation failed. Showing the original.',
  translating: 'Translating reasoning', invalidProvider: 'Choose a translation service.', invalidLanguage: 'Enter auto or a language code, such as zh, en, or ja.',
  overridden: 'Overridden', reset: 'Reset to default',
  unavailable: 'Translation preferences are unavailable.', readOnly: 'This deployment stores settings read-only.',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.', save: 'Save', saving: 'Saving…',
  copy: 'Copy', copied: 'Copied', codeTitle: 'Code block', wrap: 'Wrap lines', unwrap: 'Unwrap lines', footnotes: 'Footnotes',
}

/** Locale dictionary key union. */
export type CotTranslationKey = keyof typeof en

/**
 * Read shared form chrome from the plugin dictionary.
 * @param t - current locale reader.
 * @returns localized form labels.
 */
export function formLabels(t: (key: CotTranslationKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  provider: 'Служба перевода', google: 'Google', bing: 'Bing',
  deepseekAccount: 'DeepSeek Flash — аккаунт (платный)', deepseekOfficial: 'DeepSeek Flash — официальный API (платный)',
  providerUnavailableOption: '{provider} — недоступен',
  providerUnavailable: 'Эта служба недоступна. Настройте аккаунт VEGA или официальный API либо выберите доступную службу.',
  paidNotice: 'Каждый фрагмент, отсутствующий в кэше, отправляется отдельным платным запросом к VEGA Flash через выбранный аккаунт или учётные данные официального API. При повторном открытии рассуждений используются сохранённые результаты; смена службы, языка, исходного текста или параметров запроса может привести к новому платному запросу.',
  anonymousNotice: 'Для Bing и Google не нужны учётная запись для перевода или API key. Их анонимные конечные точки могут отклонять или ограничивать запросы.', targetLanguage: 'Целевой язык',
  targetLanguageHint: 'auto использует язык интерфейса; также можно указать код языка, например zh, en или ja.',
  privacy: 'Развёрнутые рассуждения отправляются выбранной службе. Они могут содержать личный код или сведения из переписки.',
  translation: 'Показать перевод', original: 'Показать оригинал', retry: 'Повторить', failed: 'Не удалось выполнить перевод. Показан оригинал.',
  translating: 'Перевод рассуждений', invalidProvider: 'Выберите службу перевода.', invalidLanguage: 'Укажите auto или код языка, например zh, en или ja.',
  overridden: 'Переопределено', reset: 'Восстановить значения по умолчанию',
  unavailable: 'Настройки перевода недоступны.', readOnly: 'В этом развёртывании настройки доступны только для чтения.',
  saveFailed: 'Развёртывание не приняло эти значения; они сохранены, чтобы вы могли их исправить.', save: 'Сохранить', saving: 'Сохранение…',
  copy: 'Копировать', copied: 'Скопировано', codeTitle: 'Блок кода', wrap: 'Переносить строки', unwrap: 'Не переносить строки', footnotes: 'Сноски',
} satisfies Record<keyof typeof en, string>
