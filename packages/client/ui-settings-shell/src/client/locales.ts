/** Locale bundles for the shell executor's settings page. */

import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the page renders. */
export type ShellSettingsLocaleKey =
  | 'title' | 'description'
  | 'timeoutMs' | 'timeoutMsHint' | 'maxOutputBytes' | 'maxOutputBytesHint'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'invalidNumber'

/** English copy. */
export const en: Record<ShellSettingsLocaleKey, string> = {
  title: 'Shell',
  description: 'Limit how long each command may run and how much it may output.',
  timeoutMs: 'Command timeout (ms)',
  timeoutMsHint: 'How long one command may run before it is terminated.',
  maxOutputBytes: 'Output cap per stream (bytes)',
  maxOutputBytesHint: 'Output beyond this spills to a temporary file rather than being lost.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a number, or leave blank to use the default.',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: ShellSettingsLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Терминал',
  description: 'Ограничьте время выполнения каждой команды и объём её вывода.',
  timeoutMs: 'Тайм-аут команды (мс)',
  timeoutMsHint: 'Как долго может выполняться одна команда до её завершения по тайм-ауту.',
  maxOutputBytes: 'Лимит вывода для каждого потока (байты)',
  maxOutputBytesHint: 'Превышение этого лимита сохраняется во временный файл, а не теряется.',
  overridden: 'Переопределено',
  reset: 'Сбросить настройки по умолчанию',
  readOnly: 'В этой среде развёртывания настройки доступны только для чтения.',
  unavailable: 'Этот плагин не загружен, поэтому сейчас его нельзя настроить.',
  save: 'Сохранить',
  saving: 'Сохранение…',
  saveFailed: 'Среда развёртывания не приняла эти значения; они оставлены для исправления.',
  invalidNumber: 'Введите число или оставьте поле пустым, чтобы использовать значение по умолчанию.',
} satisfies Record<keyof typeof en, string>
