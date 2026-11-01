/** Locale-owned application-access approval messages. */

/** English application-access messages. */
export const en = {
  question: 'Allow computer use to launch, read, capture and control this application?',
  detail: 'Allowing or denying applies to every version and copy sharing the same application identity. Session access and denial apply only to this conversation.',
  approve: 'Allow for this session',
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  question: 'Разрешить Computer Use запуск, чтение, захват и управление этим приложением?',
  detail: 'Разрешение или отказ распространяется на все версии и копии с тем же идентификатором приложения. Доступ для сеанса и отказ действуют только в этом разговоре.',
  approve: 'Разрешить для этого сеанса',
} satisfies Record<keyof typeof en, string>

/** Display translations resolved by the Client; wire choices stay unchanged. */
export const applicationAccessDisplay = {
  question: {
    en: en.question,
    ru: ru.question,
  },
  detail: { en: en.detail, ru: ru.detail },
  approve: {
    en: en.approve,
    ru: ru.approve,
  },
}
