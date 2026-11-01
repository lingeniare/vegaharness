/** Render complete persistence documentation artifacts without Git or file mutation. */

/** One repository-relative generated file and its complete UTF-8 content. */
export interface PersistenceArtifact {
  readonly path: string
  readonly content: string
}

/**
 * Render one generated document as a single artifact.
 * @param source - repository-relative document path.
 * @param content - complete authored or generated Markdown.
 * @returns the document artifact, without writing files.
 */
export function renderPersistenceDoc(source: string, content: string): PersistenceArtifact[] {
  return [{ path: source, content }]
}
