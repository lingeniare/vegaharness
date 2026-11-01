import type { IconProps } from './icons/props.ts'
import { BRAND_MARK_PATH, BRAND_MARK_STROKE_WIDTH } from './BrandMark.tsx'

/** Display options for the official brand wordmark. */
export interface BrandWordmarkProps extends IconProps {
  /** Whether to include the leading star mark; defaults to true. */
  includeMark?: boolean | undefined
}

/**
 * Render the full brand wordmark: the star, the VEGA name, and the
 * HARNESS badge.
 * @param props.size - height in px (default 24; width follows the artwork).
 * @param props.className - extra class for layout placement.
 * @param props.includeMark - whether to include the leading star mark.
 * @returns the wordmark svg (aria-hidden decorative brand art).
 */
export function BrandWordmark({ size = 24, className, includeMark = true }: BrandWordmarkProps) {
  const width = includeMark ? 148 : 118
  return (
    <svg
      width={(size * width) / 24}
      height={size}
      className={className}
      viewBox={includeMark ? '0 0 148 24' : '30 0 118 24'}
      fill="none"
      aria-hidden="true"
    >
      {includeMark ? (
        <path
          d={BRAND_MARK_PATH}
          transform="translate(1.9 1.9) scale(0.0266)"
          stroke="currentColor"
          strokeWidth={BRAND_MARK_STROKE_WIDTH}
          strokeLinecap="round"
        />
      ) : null}
      <text
        x="30"
        y="18.6"
        fontFamily="var(--dsw-font-family-brand, Montserrat, system-ui, sans-serif)"
        fontSize="17"
        fontWeight="500"
        letterSpacing="1.5"
        fill="currentColor"
        textLength="52"
        lengthAdjust="spacing"
      >VEGA</text>
      <rect x="92" y="5" width="52" height="14" rx="2" fill="currentColor" />
      <text
        x="118"
        y="15.4"
        textAnchor="middle"
        fontFamily="var(--dsw-font-family-brand, Montserrat, system-ui, sans-serif)"
        fontSize="8"
        fontWeight="500"
        letterSpacing="0.8"
        fill="var(--dsw-alias-label-primary-inverted)"
        textLength="44"
        lengthAdjust="spacing"
      >HARNESS</text>
    </svg>
  )
}
