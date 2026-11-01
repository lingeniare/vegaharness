/** Locale bundles for the agent-preset hero chip, header label, and management section. */

import { guideEn, guideRu, type PresetGuideKey } from './guide-locales.ts'

/** Locale keys these surfaces render. */
export type AgentPresetSettingsKey =
  | PresetGuideKey
  | 'builtInGroup'
  | 'customGroup'
  | 'seatHint'
  | 'headerHint'
  | 'nav'
  | 'sectionIntro'
  | 'setDefault'
  | 'view'
  | 'presetStandardName'
  | 'presetStandardDescription'
  | 'presetPtcName'
  | 'presetPtcDescription'
  | 'presetMinimalName'
  | 'presetMinimalDescription'
  | 'presetCordisName'
  | 'presetCordisDescription'
  | 'inUse'
  | 'noDescription'
  | 'brokenBadge'
  | 'switchRefused'
  | 'standardUnavailable'
  | 'close'
  | 'creatorDraft'
  | 'createPlugin'
  | 'createPluginDescription'
  | 'createPluginChecking'
  | 'createPluginUnavailable'
  | 'createPluginMissing'

/** English copy. */
export const en: Record<AgentPresetSettingsKey, string> = {
  ...guideEn,
  builtInGroup: 'Built-in', customGroup: 'Custom',
  sectionIntro: 'Choose the agent’s tools and how it works. Use Standard mode for everyday tasks, or Creator mode to add capabilities to VEGA.',

  seatHint: 'Choose the agent preset for your new task',
  headerHint: 'The agent preset chosen when this task started',
  nav: 'Agent presets',

  setDefault: 'Set as new task default',
  view: 'View configuration',

  presetStandardName: 'Standard mode',
  presetStandardDescription:
    'Work with code, files, and information. Suitable for most tasks, with search, editing, terminal commands, and other tools available as needed.',
  presetPtcName: 'PTC mode',
  presetPtcDescription:
    'Includes all Standard mode capabilities. Better suited to tasks that call tools in batches and then filter, organize, deduplicate, count, or summarize the results.',
  presetMinimalName: 'Minimal mode',
  presetMinimalDescription:
    'The agent uses a terminal and image reading, with context compaction. Useful for testing and comparing its basic performance.',
  presetCordisName: 'Creator mode',
  presetCordisDescription:
    'Customize VEGA through conversation. Let the agent write plugins that add features or UI, or combine tools and prompts to create your own mode.',

  inUse: 'New task default',

  noDescription: 'No description.',
  brokenBadge: 'Failed to load',

  switchRefused: 'Could not switch to {name}: {reason}',
  standardUnavailable: 'Standard mode is unavailable. Restore it or choose another available mode.',

  close: 'Close',

  creatorDraft: 'Let the agent help me create a preset',
  createPlugin: 'Let the agent create a plugin',
  createPluginDescription: 'Enter Creator mode and make your own VEGA plugin',
  createPluginChecking: 'Checking whether Creator mode is available',
  createPluginUnavailable: 'Temporarily unavailable. Reopen this menu to retry',
  createPluginMissing: 'Creator mode is not included in this configuration',

}

// The resolution itself is the shared fold in `dsh-agent-preset-registry/display`,
// re-exported here so every surface in this plugin reads one path; the
// Settings plugin list inlines the same fold over this plugin's dictionaries.
export { isBuiltInPreset, presetDisplayText } from '@deepseek-ai/dsh-agent-preset-registry/display'
export type { PresetDisplaySource, PresetDisplayText } from '@deepseek-ai/dsh-agent-preset-registry/display'

/** Russian dictionary, checked against the English keys. */
export const ru = {
  ...guideRu,
  builtInGroup: 'Встроенные', customGroup: 'Пользовательские',
  sectionIntro: 'Выберите инструменты агента и принцип его работы. Используйте Стандартный режим для повседневных задач или Режим создания, чтобы добавить возможности в VEGA.',

  seatHint: 'Выберите режим агента для новой задачи',
  headerHint: 'Режим агента, выбранный при запуске этой задачи',
  nav: 'Режимы агента',

  setDefault: 'Использовать по умолчанию для новых задач',
  view: 'Просмотреть конфигурацию',

  presetStandardName: 'Стандартный режим',
  presetStandardDescription:
    'Работа с кодом, файлами и информацией. Подходит для большинства задач: при необходимости доступны поиск, редактирование, команды терминала и другие инструменты.',
  presetPtcName: 'Режим PTC',
  presetPtcDescription:
    'Включает все возможности Стандартного режима. Лучше подходит для задач, в которых нужно пакетно вызывать инструменты, а затем фильтровать, упорядочивать, удалять дубликаты, подсчитывать или обобщать результаты.',
  presetMinimalName: 'Минимальный режим',
  presetMinimalDescription:
    'Агент использует терминал и инструменты для чтения изображений, а также сжатие контекста. Подходит для тестирования и сравнения базовых возможностей агента.',
  presetCordisName: 'Режим создания',
  presetCordisDescription:
    'Настраивайте VEGA в диалоге. Попросите агента написать плагины, добавляющие функции или элементы интерфейса, либо объедините инструменты и промпты, чтобы создать собственный режим.',

  inUse: 'По умолчанию для новых задач',

  noDescription: 'Нет описания.',
  brokenBadge: 'Не удалось загрузить',

  switchRefused: 'Не удалось переключиться на «{name}»: {reason}',
  standardUnavailable: 'Стандартный режим недоступен. Восстановите его или выберите другой доступный режим.',

  close: 'Закрыть',

  creatorDraft: 'Попросить агента создать режим',
  createPlugin: 'Попросить агента создать плагин',
  createPluginDescription: 'Перейдите в Режим создания и создайте собственный плагин VEGA',
  createPluginChecking: 'Проверка доступности Режима создания',
  createPluginUnavailable: 'Временно недоступно. Откройте это меню снова, чтобы повторить',
  createPluginMissing: 'Режим создания не предусмотрен в этой конфигурации',

} satisfies Record<keyof typeof en, string>
