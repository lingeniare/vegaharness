/** `settings.permission` namespace dictionaries (the Permission row's copy). */

/** Locale namespace shared by both current-session permission pickers. */
export const PERMISSION_ACCESS_NS = 'permission.access'

/** The settings.permission namespace key union. */
export type PermissionSettingsKey = keyof typeof en

/** English dictionary, the key-set source of truth. */
export const en = {
  'title': 'Permission',
  'description': 'Choose the default permission mode for new sessions',
  'loading': 'Loading',
  'unavailable': 'Unavailable',
  'preset.readOnly': 'Read Only',
  'preset.workspaceWrite': 'Workspace Write',
  'preset.fullAccess': 'Full access',
  'confirm.title': 'Enable Full access?',
  'confirm.description': 'Full access lets new sessions reduce confirmation steps and perform more actions directly, including sensitive operations, file changes, or external commands. Only use it when you trust subsequent tasks.',
  'confirm.acknowledge': 'I understand the risks and want to continue',
  'confirm.cancel': 'Cancel',
  'confirm.enable': 'Enable Full access',
} satisfies Record<string, string>

/** Current-session popup-gate key union. */
export type PermissionAccessKey = keyof typeof accessEn

/** English dictionary for the current-session popup gate. */
export const accessEn = {
  'mode': 'Access mode, current: {name}',
  'close': 'Close',
  'preset.readOnly': 'Read Only',
  'preset.workspaceWrite': 'Workspace Write',
  'preset.fullAccess': 'Full access',
  'confirm.title': 'Enable Full access?',
  'confirm.description': 'Full access reduces confirmation steps and lets the agent perform more actions directly, including sensitive operations, file changes, or external commands. Only use it when you trust the current task.',
  'confirm.acknowledge': 'I understand the risks and want to continue',
  'confirm.cancel': 'Cancel',
  'confirm.enable': 'Enable Full access',
  'auto.label': 'Auto review',
  'auto.badge': 'EXP',
  'auto.description': 'Run without a sandbox after an experimental same-model review of every native tool call and PTC inner call.',
  'auto.confirm.title': 'Enable Auto review (experimental)?',
  'auto.confirm.description': 'Auto review runs without a sandbox. Before every native tool call and PTC inner call, the same model as the current agent reviews whether to allow it; you approve or reject each call it denies. This feature is experimental, can falsely allow or deny actions, and uses additional tokens.',
  'auto.confirm.acknowledge': 'I understand these risks and want to continue',
  'auto.confirm.enable': 'Enable Auto review',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'title': 'Разрешение',
  'description': 'Выберите режим разрешений по умолчанию для новых сессий',
  'loading': 'Загрузка',
  'unavailable': 'Недоступно',
  'preset.readOnly': 'Только чтение',
  'preset.workspaceWrite': 'Запись в рабочую область',
  'preset.fullAccess': 'Полный доступ',
  'confirm.title': 'Включить полный доступ?',
  'confirm.description': 'Полный доступ позволяет новым сессиям сокращать количество подтверждений и выполнять больше действий напрямую, включая конфиденциальные операции, изменение файлов и внешние команды. Используйте его, только если доверяете последующим задачам.',
  'confirm.acknowledge': 'Я понимаю риски и хочу продолжить',
  'confirm.cancel': 'Отмена',
  'confirm.enable': 'Включить полный доступ',
} satisfies Record<keyof typeof en, string>

/** Russian dictionary, checked against the English keys. */
export const accessRu = {
  'mode': 'Режим доступа, сейчас: {name}',
  'close': 'Закрыть',
  'preset.readOnly': 'Только чтение',
  'preset.workspaceWrite': 'Запись в рабочую область',
  'preset.fullAccess': 'Полный доступ',
  'confirm.title': 'Включить полный доступ?',
  'confirm.description': 'Полный доступ сокращает количество подтверждений и позволяет агенту выполнять больше действий напрямую, включая чувствительные операции, изменение файлов и внешние команды. Используйте его, только если доверяете текущей задаче.',
  'confirm.acknowledge': 'Я понимаю риски и хочу продолжить',
  'confirm.cancel': 'Отмена',
  'confirm.enable': 'Включить полный доступ',
  'auto.label': 'Автопроверка',
  'auto.badge': 'EXP',
  'auto.description': 'Работа без песочницы с экспериментальной проверкой каждого вызова нативного инструмента и внутреннего вызова PTC той же моделью.',
  'auto.confirm.title': 'Включить автопроверку (экспериментальная функция)?',
  'auto.confirm.description': 'Автопроверка выполняется без песочницы. Перед каждым вызовом нативного инструмента и внутренним вызовом PTC та же модель, что и у текущего агента, проверяет, следует ли его разрешить; каждый отклонённый ею вызов вы подтверждаете или отклоняете. Эта функция экспериментальная, может ошибочно разрешать или отклонять действия и расходует дополнительные токены.',
  'auto.confirm.acknowledge': 'Я понимаю эти риски и хочу продолжить',
  'auto.confirm.enable': 'Включить автопроверку',
} satisfies typeof accessEn
