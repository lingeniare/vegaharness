
/** English dictionary (the key-set source of truth). */
export const zoomEn = {
  zoomControls: 'Zoom controls',
  zoomMenu: 'Choose zoom',
  zoomOut: 'Zoom out',
  zoomIn: 'Zoom in',
  zoomFitWidth: 'Fit width',
  zoomValue: '{percent}%',
} satisfies Record<string, string>

/** Shared zoom dictionary keys. */
export type ZoomLocaleKey = keyof typeof zoomEn

/** Russian dictionary, checked against the English keys. */
export const zoomRu = {
  zoomControls: 'Управление масштабом',
  zoomMenu: 'Выбрать масштаб',
  zoomOut: 'Уменьшить масштаб',
  zoomIn: 'Увеличить масштаб',
  zoomFitWidth: 'По ширине',
  zoomValue: '{percent}%',
} satisfies typeof zoomEn
