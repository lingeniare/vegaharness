/** `feedback` namespace dictionaries. */

/** The feedback namespace key union. */
export type MessageFeedbackKey = keyof typeof en

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The feedback surface's copy: the message controls, the dialog, and the acknowledgement. */
    feedback: MessageFeedbackKey
  }
}

/** English dictionary, the key-set source of truth. */
export const en = {
  'action.like': 'Good response',
  'action.likeActive': 'Remove rating',
  'action.dislike': 'Bad response',
  'action.dislikeActive': 'Remove rating',
  'dialog.title': 'Submit feedback',
  'dialog.categories': 'Feedback category',
  'dialog.detail': 'Feedback details',
  'dialog.hint': 'Add details to help us improve. Your submission will include the current conversation log.',
  'category.task-result': 'Task result',
  'category.instruction-following': 'Instruction understanding and following',
  'category.product-interaction': 'Product features and interaction',
  'category.service-stability': 'Stability and speed',
  'category.resource-cost': 'Resource usage and cost',
  'category.security-privacy-permission': 'Security, privacy, and permissions',
  'category.other': 'Other',
  'toast.recorded': 'Thanks for your feedback',
  'error.conflict': 'This feedback changed elsewhere; the latest state is shown',
  'error.load': 'Could not load feedback',
  'error.generic': 'Could not save feedback',
  'error.noteTooLarge': 'The description is too long; shorten it and submit again',
} satisfies Record<string, string>

/** Russian dictionary, checked against the English keys. */
export const ru = {
  'action.like': 'Хороший ответ',
  'action.likeActive': 'Убрать оценку',
  'action.dislike': 'Плохой ответ',
  'action.dislikeActive': 'Убрать оценку',
  'dialog.title': 'Отправить отзыв',
  'dialog.categories': 'Категория отзыва',
  'dialog.detail': 'Подробности отзыва',
  'dialog.hint': 'Добавьте подробности, чтобы помочь нам стать лучше. В отправленный отзыв будет включён журнал текущего диалога.',
  'category.task-result': 'Результат задачи',
  'category.instruction-following': 'Понимание инструкций и их выполнение',
  'category.product-interaction': 'Функции продукта и взаимодействие с ним',
  'category.service-stability': 'Стабильность и скорость',
  'category.resource-cost': 'Использование ресурсов и стоимость',
  'category.security-privacy-permission': 'Безопасность, конфиденциальность и разрешения',
  'category.other': 'Другое',
  'toast.recorded': 'Спасибо за отзыв',
  'error.conflict': 'Этот отзыв изменили в другом месте. Показано последнее состояние',
  'error.load': 'Не удалось загрузить отзыв',
  'error.generic': 'Не удалось сохранить отзыв',
  'error.noteTooLarge': 'Описание слишком длинное. Сократите его и отправьте снова',
} satisfies Record<keyof typeof en, string>
