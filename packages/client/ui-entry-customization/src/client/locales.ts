/** Copy for the More menu rows: navigation actions, and Creator draft prompts per region. */
export const en = {
  install: 'Browse other plugins',
  create: 'Create your plugin',
  'createPrompt.sidebar': 'Create a VEGA plugin with a left sidebar entry.',
  'createPrompt.conversation': 'Create a VEGA conversation view plugin.',
  'createPrompt.rightbar': 'Create a VEGA plugin with a right sidebar entry.',
  'pinTooltip': 'Pin to left sidebar',
  'pin': 'Pin {name} to sidebar',
} as const

/** Russian dictionary, checked against the English keys. */
export const ru = {
  install: 'Просмотреть другие плагины',
  create: 'Создать свой плагин',
  'createPrompt.sidebar': 'Создай VEGA-плагин с записью в левой боковой панели.',
  'createPrompt.conversation': 'Создай VEGA-плагин представления диалога.',
  'createPrompt.rightbar': 'Создай VEGA-плагин с записью в правой боковой панели.',
  'pinTooltip': 'Закрепить на левой боковой панели',
  'pin': 'Закрепить {name} на боковой панели',
} satisfies Record<keyof typeof en, string>
