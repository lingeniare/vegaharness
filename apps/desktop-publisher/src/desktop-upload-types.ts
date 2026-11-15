/** Shared upload contracts for Desktop packaging and publication. */
import type { DesktopAutoUpdateTarget } from './desktop-auto-update-environment.mjs'

/** One local file and its final object metadata. */
export interface DesktopUploadArtifact {
  readonly path: string
  readonly filename: string
  readonly key: string
  readonly contentType: string
  /** Browser save name for fixed website downloads, preserving the validated installer basename. */
  readonly contentDisposition?: string
  readonly channelMetadata: boolean
  /** Published YAML with normalized artifact URLs; binary bytes remain file-backed. */
  readonly contents?: string
}

/** Shared shape of a validated installer or update upload, channel metadata ordered last. */
interface DesktopUploadPlanBase {
  readonly environment: 'test' | 'production'
  readonly channel: 'stable'
  readonly target: DesktopAutoUpdateTarget
  readonly version: string
  /** Update feed directory URL, or the single installer URL for a fixed download. */
  readonly publicUrl: string
  readonly artifacts: readonly DesktopUploadArtifact[]
  /** Commit the artifacts were packaged from, absent for a package built before builds recorded it. */
  readonly commit?: string
  /** Whether that checkout carried uncommitted changes. */
  readonly dirty?: boolean
}

/** A validated upload bound for the generic object-storage destination. */
export interface DesktopGenericUploadPlan extends DesktopUploadPlanBase {
  readonly provider: 'generic'
  readonly bucket: string
  readonly secretIdEnvName: string
  readonly secretKeyEnvName: string
}

/** A validated upload bound for a GitHub Releases destination. */
export interface DesktopGithubUploadPlan extends DesktopUploadPlanBase {
  readonly provider: 'github'
  readonly owner: string
  readonly repo: string
  readonly tokenEnvName: string
}

/** A validated installer or update upload, with any channel metadata ordered last. */
export type DesktopUploadPlan = DesktopGenericUploadPlan | DesktopGithubUploadPlan

/** A publication operation targeting exactly one metadata object or installer. */
export type DesktopSingleUploadPlan = Omit<DesktopGenericUploadPlan, 'artifacts'> & {
  readonly artifacts: readonly [DesktopUploadArtifact]
}
