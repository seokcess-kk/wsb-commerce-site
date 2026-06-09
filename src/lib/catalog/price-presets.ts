export type PricePreset = {
  readonly label: string;
  readonly min: number | undefined;
  readonly max: number | undefined;
};

export const PRICE_PRESETS: readonly PricePreset[] = [
  { label: "전체", min: undefined, max: undefined },
  { label: "~1만", min: undefined, max: 10000 },
  { label: "1~3만", min: 10000, max: 30000 },
  { label: "3만~", min: 30000, max: undefined },
] as const;

/** Returns the min/max bounds for the given preset key (e.g. "10000-30000").
 *  Returns empty object (no bounds) when key is absent or "all". */
export function parsePricePreset(preset: string | undefined): {
  minPrice?: number;
  maxPrice?: number;
} {
  if (!preset) return {};
  const found = PRICE_PRESETS.find(
    (p) => `${p.min ?? ""}-${p.max ?? ""}` === preset,
  );
  if (!found) return {};
  const result: { minPrice?: number; maxPrice?: number } = {};
  if (found.min !== undefined) result.minPrice = found.min;
  if (found.max !== undefined) result.maxPrice = found.max;
  return result;
}
