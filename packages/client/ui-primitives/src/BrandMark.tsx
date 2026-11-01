import type { IconProps } from './icons/props.ts'

/** Native viewBox of {@link BRAND_MARK_PATH} (width and height in user units). */
export const BRAND_MARK_VIEWBOX = { width: 760, height: 760 }

/** Default stroke weight of the mark in viewBox units, tuned to stay legible at icon sizes. */
export const BRAND_MARK_STROKE_WIDTH = 64

/**
 * The six-spoke star silhouette path data, exported for consumers that compose
 * their own svg (entrance effects, rotations) around the same geometry. Stroke it
 * with `currentColor`.
 */
export const BRAND_MARK_PATH =
  'M380 12V748M196 61.22L564 698.78M61.22 196L698.78 564M12 380H748M61.22 564L698.78 196M196 698.78L564 61.22'

/** Props for {@link BrandMark}: square icon sizing plus the brand's stroke weight. */
export interface BrandMarkProps extends IconProps {
  /** Stroke width in viewBox units; defaults to {@link BRAND_MARK_STROKE_WIDTH}. */
  strokeWidth?: number | undefined
}

/**
 * Render the star mark.
 * @param props.size - edge in px (default 24; the mark is square).
 * @param props.className - extra class for layout placement.
 * @param props.strokeWidth - stroke weight in viewBox units.
 * @returns the logo svg (aria-hidden; pair with the wordmark for accessibility).
 */
export function BrandMark({ size = 24, className, strokeWidth = BRAND_MARK_STROKE_WIDTH }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      viewBox={`0 0 ${BRAND_MARK_VIEWBOX.width} ${BRAND_MARK_VIEWBOX.height}`}
      fill="none"
      aria-hidden="true"
    >
      <path d={BRAND_MARK_PATH} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}
