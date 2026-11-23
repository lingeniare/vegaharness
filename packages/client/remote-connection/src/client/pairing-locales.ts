/** Copy for Remote connection settings and owner approval. */
export const en = {
  'pairing.title': 'Pairing requests',
  'pairing.description': 'Open this app on the other device and request pairing. Compare the codes before approving.',
  'pairing.permission': 'Approval gives that browser full access to this app, including approving other devices.',
  'pairing.code': 'Pairing code',
  'pairing.sourceIp': 'Source IP',
  'pairing.sourceIpUnknown': 'Unknown',
  'pairing.approve': 'Approve',
  'pairing.deny': 'Deny',
  'pairing.retry': 'Retry',
  'pairing.loading': 'Loading pairing requests',
  'pairing.readFailed': 'Could not load requests. Retry to refresh the list.',
  'pairing.approved': 'Request approved',
  'pairing.denied': 'Request denied',
  'pairing.unavailable': 'This request is no longer awaiting approval',
  'pairing.failed': 'Could not confirm your decision. Refresh the list before trying again.',
}

/** Russian pairing copy. */
export const ru: Record<PairingLocaleKey, string> = {
  'pairing.sourceIp': 'IP-адрес источника', 'pairing.sourceIpUnknown': 'Неизвестен',
  'pairing.title': 'Запросы на сопряжение', 'pairing.description': 'Откройте приложение на другом устройстве и запросите сопряжение. Перед одобрением сравните коды.',
  'pairing.permission': 'Одобрение предоставляет этому браузеру полный доступ к приложению, включая возможность одобрять другие устройства.',
  'pairing.code': 'Код сопряжения', 'pairing.approve': 'Одобрить', 'pairing.deny': 'Отклонить', 'pairing.retry': 'Повторить', 'pairing.loading': 'Загрузка запросов на сопряжение',
  'pairing.readFailed': 'Не удалось загрузить запросы. Повторите попытку, чтобы обновить список.', 'pairing.approved': 'Запрос одобрен', 'pairing.denied': 'Запрос отклонён',
  'pairing.unavailable': 'Этот запрос больше не ожидает одобрения', 'pairing.failed': 'Не удалось подтвердить решение. Обновите список перед повторной попыткой.',
}

export type PairingLocaleKey = keyof typeof en
