/** Copy for the API Session-log upload preference. */
export const en = {
  title: 'Upload Session Log when using the official model API',
  description: 'Help improve DeepSeek models and products.',
  saved: 'Preference saved',
  failed: 'Could not save preference',
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  title: 'Загрузить журнал сеансов при использовании официальной модели API',
  description: 'Помогите улучшить модели и продукты DeepSeek.',
  saved: 'Предпочтение сохранено.',
  failed: 'Не удалось сохранить предпочтения.',
} satisfies Record<keyof typeof en, string>
