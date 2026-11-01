/** Locale bundles for the Subagent settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type SubagentSettingsLocaleKey =
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed'
  | 'subagentTitle' | 'subagentDescription' | 'subagentLimitsTitle'
  | 'subagentMaxDepth'
  | 'subagentDepthHelpLabel' | 'subagentDepthHelp'
  | 'subagentDepthZero' | 'subagentDepthOne' | 'subagentDepthOverride'
  | 'subagentMaxActive'
  | 'subagentCapacityHelpLabel' | 'subagentCapacityHelp'
  | 'subagentDepthInvalid'
  | 'subagentCapacityInvalid'
  | 'subagentModelSelectionTitle'
  | 'subagentModelSelectionToggle' | 'subagentModelSelectionChoose' | 'subagentModelSelectionAllowed'
  | 'subagentModelSelectionLoading' | 'subagentModelSelectionLoadFailed' | 'subagentModelSelectionRetry'
  | 'subagentModelSelectionPartial' | 'subagentModelSelectionUnavailable'
  | 'subagentModelSelectionUnavailableGroup' | 'subagentModelSelectionEmpty'
  | 'subagentModelSelectionRequired' | 'subagentModelSelectionConflict' | 'subagentModelSelectionOff'

/** English copy. */
export const en: Record<SubagentSettingsLocaleKey, string> = {
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  subagentTitle: 'Subagent',
  subagentDescription: 'Set Subagent recursion depth, count, and models.',
  subagentLimitsTitle: 'Limits',
  subagentMaxDepth: 'Maximum recursion depth',
  subagentDepthHelpLabel: 'About maximum recursion depth',
  subagentDepthHelp: 'Limits how many levels of Subagents an Agent can create.',
  subagentDepthZero: 'Disable Subagents',
  subagentDepthOne: 'Only the main Agent can create Subagents',
  subagentDepthOverride: 'If a tool defines its own maximum recursion depth, that setting takes precedence.',
  subagentMaxActive: 'Subagent parallelism limit',
  subagentCapacityHelpLabel: 'About the Subagent parallelism limit',
  subagentCapacityHelp: 'Total live Subagents under the same main Agent, across all recursion levels. The main Agent is excluded. New start requests are rejected when the limit is reached.',
  subagentDepthInvalid: 'Enter a whole number of 0 or more.',
  subagentCapacityInvalid: 'Enter a whole number of 1 or more.',
  subagentModelSelectionTitle: 'Model selection',
  subagentModelSelectionToggle: 'Allow agents to choose models for Subagents',
  subagentModelSelectionChoose: 'When enabled, agents can choose a provider, model, and reasoning effort for each Subagent from the authorized models below. Applies only to new sessions.',
  subagentModelSelectionAllowed: 'Models agents may choose',
  subagentModelSelectionLoading: 'Loading models…',
  subagentModelSelectionLoadFailed: 'Models could not be loaded.',
  subagentModelSelectionRetry: 'Retry',
  subagentModelSelectionPartial: 'Some model providers could not be loaded; saved choices remain removable.',
  subagentModelSelectionUnavailable: 'Currently unavailable',
  subagentModelSelectionUnavailableGroup: 'Saved but currently unavailable',
  subagentModelSelectionEmpty: 'No model provider currently advertises a model.',
  subagentModelSelectionRequired: 'Select at least one model before saving.',
  subagentModelSelectionConflict: 'Settings changed elsewhere. Discard your draft and try again.',
  subagentModelSelectionOff: 'Subagents use configured defaults or inherit the parent agent\'s model. Saved model choices are retained.',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: SubagentSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  overridden: 'Переопределено',
  reset: 'Сбросить до значений по умолчанию',
  readOnly: 'В этой среде настройки доступны только для чтения.',
  unavailable: 'Этот плагин не загружен, поэтому сейчас его нельзя настроить.',
  save: 'Сохранить',
  saving: 'Сохранение…',
  saveFailed: 'Среда не приняла эти значения; они оставлены для исправления.',
  subagentTitle: 'Субагент',
  subagentDescription: 'Настройте глубину рекурсии, количество и модели субагентов.',
  subagentLimitsTitle: 'Ограничения',
  subagentMaxDepth: 'Максимальная глубина рекурсии',
  subagentDepthHelpLabel: 'О максимальной глубине рекурсии',
  subagentDepthHelp: 'Ограничивает количество уровней субагентов, которые может создавать агент.',
  subagentDepthZero: 'Отключить субагентов',
  subagentDepthOne: 'Создавать субагентов может только главный агент',
  subagentDepthOverride: 'Если для инструмента задана собственная максимальная глубина рекурсии, приоритет имеет это значение.',
  subagentMaxActive: 'Лимит параллельных субагентов',
  subagentCapacityHelpLabel: 'О лимите параллельных субагентов',
  subagentCapacityHelp: 'Общее количество одновременно работающих субагентов у одного главного агента на всех уровнях рекурсии. Главный агент не учитывается. При достижении лимита новые запросы на запуск отклоняются.',
  subagentDepthInvalid: 'Введите целое число не меньше 0.',
  subagentCapacityInvalid: 'Введите целое число не меньше 1.',
  subagentModelSelectionTitle: 'Выбор модели',
  subagentModelSelectionToggle: 'Разрешить агентам выбирать модели для субагентов',
  subagentModelSelectionChoose: 'Если эта настройка включена, агенты могут выбирать для каждого субагента поставщика, модель и уровень рассуждений из списка разрешённых моделей ниже. Применяется только к новым сессиям.',
  subagentModelSelectionAllowed: 'Модели, которые могут выбирать агенты',
  subagentModelSelectionLoading: 'Загрузка моделей…',
  subagentModelSelectionLoadFailed: 'Не удалось загрузить модели.',
  subagentModelSelectionRetry: 'Повторить',
  subagentModelSelectionPartial: 'Не удалось загрузить некоторые поставщики моделей; сохранённые варианты по-прежнему можно удалить.',
  subagentModelSelectionUnavailable: 'Сейчас недоступно',
  subagentModelSelectionUnavailableGroup: 'Сохранено, но сейчас недоступно',
  subagentModelSelectionEmpty: 'Сейчас ни один поставщик моделей не предлагает модели.',
  subagentModelSelectionRequired: 'Перед сохранением выберите хотя бы одну модель.',
  subagentModelSelectionConflict: 'Настройки изменились в другом месте. Отмените свои изменения и повторите попытку.',
  subagentModelSelectionOff: 'Субагенты используют настроенные модели по умолчанию или наследуют модель родительского агента. Выбранные модели сохраняются.',
} satisfies Record<keyof typeof en, string>
