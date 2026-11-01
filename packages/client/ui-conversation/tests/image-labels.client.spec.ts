import { describe, expect, it } from 'vitest'
import { makeTranslate } from '@deepseek-ai/dsh-client-test-runtime'
import { ru as commonRu } from '@deepseek-ai/dsh-client-locale/src/locales/ru.ts'
import { attachmentErrorText, imageSizeText } from '../src/client/image-labels.ts'
import { en, ru } from '../src/client/locales.ts'

const t = makeTranslate(ru, commonRu)
const enT = makeTranslate(en, commonRu)

describe('attachment rejection copy', () => {
  const limits = {
    maxImageBytes: 5 * 1024 * 1024,
    maxImagesPerMessage: 20,
    maxMessageImageBytes: 100 * 1024 * 1024,
    maxImagePixels: 40_000_000,
    maxImageDimension: 2000,
    mediaTypes: ['image/png'] as const,
  }

  it('renders megabytes without a trailing fraction unless one exists', () => {
    expect(imageSizeText(10 * 1024 * 1024)).toBe('10MB')
    expect(imageSizeText(2.5 * 1024 * 1024)).toBe('2.5MB')
  })

  it('maps user-solvable reasons to limit-naming copy', () => {
    expect(attachmentErrorText(t, 'MODEL_DOES_NOT_SUPPORT_IMAGES')).toBe('Текущая модель не поддерживает изображения; переключитесь на модель с поддержкой изображений')
    expect(attachmentErrorText(t, 'IMAGE_TOO_MANY_PIXELS')).toBe('Разрешение изображения слишком высокое; сожмите его и попробуйте снова')
    expect(attachmentErrorText(t, 'INVALID_IMAGE')).toBe('Поддерживаются только изображения в форматах PNG, JPG, WebP и GIF')
    expect(attachmentErrorText(t, 'IMAGE_TYPE_MISMATCH')).toBe('Поддерживаются только изображения в форматах PNG, JPG, WebP и GIF')
    expect(attachmentErrorText(t, 'TOO_MANY_IMAGES', limits)).toBe('В одно сообщение можно добавить не более 20 изображений')
    expect(attachmentErrorText(t, 'IMAGE_TOO_LARGE', limits)).toBe('Размер каждого изображения должен быть меньше 5MB')
    expect(attachmentErrorText(t, 'IMAGES_TOO_LARGE', limits)).toBe('Общий размер изображений превышает 100MB; удалите некоторые и попробуйте снова')
    expect(attachmentErrorText(t, 'IMAGE_DIMENSION_TOO_LARGE', limits)).toBe('Размеры изображения не должны превышать 2000px; уменьшите его и попробуйте снова')
    expect(attachmentErrorText(enT, 'TOO_MANY_IMAGES', limits)).toBe('A message can include up to 20 images')
  })

  it('folds unknown reasons and limit reasons without projected limits into the send-failed line', () => {
    expect(attachmentErrorText(t, 'INVALID_IMAGE_BASE64')).toBe('Не удалось отправить изображения (INVALID_IMAGE_BASE64); добавьте их заново и попробуйте снова')
    expect(attachmentErrorText(t, 'TOO_MANY_IMAGES')).toBe('Не удалось отправить изображения (TOO_MANY_IMAGES); добавьте их заново и попробуйте снова')
    expect(attachmentErrorText(t, 'IMAGE_TOO_LARGE')).toBe('Не удалось отправить изображения (IMAGE_TOO_LARGE); добавьте их заново и попробуйте снова')
    expect(attachmentErrorText(t, 'IMAGES_TOO_LARGE')).toBe('Не удалось отправить изображения (IMAGES_TOO_LARGE); добавьте их заново и попробуйте снова')
    expect(attachmentErrorText(t, 'IMAGE_DIMENSION_TOO_LARGE')).toBe('Не удалось отправить изображения (IMAGE_DIMENSION_TOO_LARGE); добавьте их заново и попробуйте снова')
  })
})
