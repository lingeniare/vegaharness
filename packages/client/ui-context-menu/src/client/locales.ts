/** Context-menu operation feedback, separate from plugin display metadata. */
export const dictionaries = {
  en: { back: 'Back', failed: 'Could not complete the action. Try again.' },
  ru: { back: 'Назад', failed: 'Не удалось выполнить действие. Повторите попытку.' },
} satisfies Record<string, { back: string; failed: string }>
