/** Locale-owned code renderer name and CodeBlock controls. */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Code document implementation name and copy controls. */
    sidebarCodePreview: keyof typeof en
  }
}

/** English dictionary with the same keys. */
export const en = {
  title: 'Code',
  copy: 'Copy',
  copied: 'Copied',
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Код',
  copy: 'Копировать',
  copied: 'Скопировано',
} satisfies Record<keyof typeof en, string>
