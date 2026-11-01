/** Animated star mask and static SVG fallback for the running Chat status. */
import { BrandMark } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './ChatView.module.css'

/**
 * Render the decorative running icon; the APNG asset owns its animation timing.
 * @returns mask and static SVG selected by browser capabilities and accessibility preferences.
 */
export function RunningStarTail() {
  return (
    <span className={css.runningIcon} aria-hidden="true">
      <span className={css.runningStarAnimated} />
      <BrandMark size={14} className={css.runningStarStill} />
    </span>
  )
}
