
/** English labels checked against the bottom-panel dictionary. */
export const en = {
  title: 'NodeJS inspector',
  toggle: 'Toggle NodeJS inspector',
  close: 'Collapse',
  resize: 'Resize NodeJS inspector panel',
  frameTitle: 'NodeJS inspector',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Shared Inspector frontend copy. */
    inspectorPanel: keyof typeof en
  }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Инспектор NodeJS',
  toggle: 'Показать или скрыть инспектор NodeJS',
  close: 'Свернуть',
  resize: 'Изменить высоту панели инспектора NodeJS',
  frameTitle: 'Инспектор NodeJS',
} satisfies Record<keyof typeof en, string>
