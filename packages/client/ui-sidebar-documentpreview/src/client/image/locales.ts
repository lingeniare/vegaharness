import { zoomEn, zoomRu } from '../zoom/locales.ts'

/** Image renderer dictionary keys. */
export type ImagePreviewKey = keyof typeof en

/** English dictionary with the same keys as the Russian dictionary. */
export const en = {
  ...zoomEn,
  title: 'Image',
  preview: 'Image preview: {name}',
  loading: 'Rendering document...',
  failed: 'This image could not be displayed.',
  unsupported: 'Image preview requires the complete file contents.',
} satisfies Record<string, string>

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Image preview selection, accessible name, and status text. */
    sidebarImage: ImagePreviewKey
  }
}

/** Russian dictionary, checked against the English keys. */
export const ru = {
  ...zoomRu,
  title: 'Изображение',
  preview: 'Предварительный просмотр изображения: {name}',
  loading: 'Отображение документа...',
  failed: 'Не удалось отобразить это изображение.',
  unsupported: 'Для предварительного просмотра изображения требуется полное содержимое файла.',
} satisfies Record<keyof typeof en, string>
