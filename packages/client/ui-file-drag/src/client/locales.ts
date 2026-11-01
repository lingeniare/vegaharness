
/** English file drag failure copy. */
export const en = { failed: 'Drag failed. Try again.' }

/** Russian dictionary, checked against the English keys. */
export const ru = { failed: 'Перетащить не удалось. Попробуйте еще раз.' } satisfies Record<keyof typeof en, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** File transfer failure feedback. */
    fileDrag: keyof typeof en
  }
}
