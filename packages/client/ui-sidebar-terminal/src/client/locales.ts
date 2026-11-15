/** Copy owned by the sidebar terminal feature. */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    sidebarTerminal: keyof typeof en
  }
}

/** English terminal copy. */
export const en = {
  'shortcut.noSession': 'Select a session first',
  recoveryFailed: 'Terminal recovery failed: {message}', retryRecovery: 'Retry terminal recovery',
  shell: 'Choose shell', shellLoading: 'Loading shells…', shellEmpty: 'No shells available', description: 'Run commands in the Session workspace',
  title: 'Terminal', new: 'New terminal', loading: 'Reading terminal environment…', creating: 'Starting…',
  connecting: 'Connecting…', disconnected: 'Disconnected.', reconnect: 'Reconnect',
  readonly: 'This view is read-only.', control: 'Take control',
  closed: 'Terminal closed.', exited: 'Process exited ({code})', failed: 'Terminal error: {message}',
  rename: 'Terminal name', unavailable: 'Unavailable', retry: 'Retry',
  cleanupFailed: 'Terminal “{title}” could not be ended: {message}',
  missingTerminal: 'This terminal no longer exists. Open a new terminal.',
  inputFull: 'The input buffer is full. Reconnect and try again.',
  attachmentEnded: 'The terminal connection ended. Reconnect to continue.',
  invalidOutput: 'The terminal screen could not be received. Reconnect to recover it.',
  terminalLimit: 'The terminal limit has been reached. Close unused terminals and try again. Exited terminals also count toward the limit.',
  'badge.agent': 'Agent', 'badge.agentHint': 'Opened by the agent. Typing here takes over; the agent can then only read it.',
  'badge.sandbox': 'Sandbox',
  'badge.readOnlyHint': "Commands run in the agent's read-only sandbox, including commands you type here.",
  'badge.workspaceWriteHint': "Commands run in the agent's workspace sandbox, including commands you type here.",
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'shortcut.noSession': 'Сначала выберите сессию',
  recoveryFailed: 'Не удалось восстановить терминал: {message}', retryRecovery: 'Повторить восстановление терминала',
  shell: 'Выбрать оболочку', shellLoading: 'Загрузка оболочек…', shellEmpty: 'Нет доступных оболочек', description: 'Выполнение команд в рабочей области сессии',
  title: 'Терминал', new: 'Новый терминал', loading: 'Загрузка среды терминала…', creating: 'Запуск…',
  connecting: 'Подключение…', disconnected: 'Соединение разорвано.', reconnect: 'Подключиться повторно',
  readonly: 'Этот экран доступен только для чтения.', control: 'Взять управление',
  closed: 'Терминал закрыт.', exited: 'Процесс завершился ({code})', failed: 'Ошибка терминала: {message}',
  rename: 'Название терминала', unavailable: 'Недоступно', retry: 'Повторить',
  cleanupFailed: 'Не удалось завершить терминал «{title}»: {message}',
  missingTerminal: 'Этот терминал больше не существует. Откройте новый терминал.',
  inputFull: 'Буфер ввода заполнен. Подключитесь повторно и попробуйте ещё раз.',
  attachmentEnded: 'Подключение к терминалу завершено. Подключитесь повторно, чтобы продолжить.',
  invalidOutput: 'Не удалось получить изображение экрана терминала. Подключитесь повторно, чтобы восстановить его.',
  terminalLimit: 'Достигнуто максимальное количество терминалов. Закройте неиспользуемые терминалы и попробуйте ещё раз. Завершённые терминалы также учитываются.',
  'badge.agent': 'Агент', 'badge.agentHint': 'Открыт агентом. Если вы начнёте вводить здесь, управление перейдёт к вам; после этого агент сможет только читать его.',
  'badge.sandbox': 'Песочница',
  'badge.readOnlyHint': 'Команды выполняются в песочнице агента только для чтения, включая команды, которые вы вводите здесь.',
  'badge.workspaceWriteHint': 'Команды выполняются в песочнице рабочей области агента, включая команды, которые вы вводите здесь.',
} satisfies Record<keyof typeof en, string>
