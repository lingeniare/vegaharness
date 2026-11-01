/** `approval` namespace dictionaries. */

/** Approval dictionary key union. */
export type ApprovalKey = keyof typeof en

/** English dictionary (the key-set source of truth). */
export const en = {
  waiting: 'Waiting for approval',
  'detail.aria': 'Approval details',
  escalation: 'Tool {toolName} requests privileged execution',
  reject: 'Reject',
  allow: 'Allow',
  allowOnce: 'Allow once',
  allowAlways: 'Always allow',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  waiting: 'Ожидание подтверждения',
  'detail.aria': 'Сведения о подтверждении',
  escalation: 'Инструмент {toolName} запрашивает выполнение с повышенными привилегиями',
  reject: 'Отклонить',
  allow: 'Разрешить',
  allowOnce: 'Разрешить один раз',
  allowAlways: 'Всегда разрешать',
} satisfies Record<keyof typeof en, string>
