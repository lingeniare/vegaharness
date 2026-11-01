/** Shared provider display order for the composer and command model pickers. */

/**
 * Put the account-managed and official providers first, preserving every other relative order.
 * @param groups - Provider groups in catalog order.
 * @returns a sorted copy; model order within each group is unchanged.
 */
export function orderModelProviders<T extends { readonly id: string; readonly accountManaged?: boolean }>(groups: readonly T[]): T[] {
  return groups.toSorted((left, right) =>
    (left.accountManaged === true ? 0 : left.id === 'deepseek-official' ? 1 : 2)
      - (right.accountManaged === true ? 0 : right.id === 'deepseek-official' ? 1 : 2))
}
