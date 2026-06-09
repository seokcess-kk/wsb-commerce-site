export function applyDefault<T extends { id: string; isDefault: boolean }>(
  addresses: T[],
  defaultId: string,
): T[] {
  return addresses.map((a) => ({ ...a, isDefault: a.id === defaultId }));
}
