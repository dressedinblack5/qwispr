export function parseIntSafe(value: string, label: string): number {
  const v = parseInt(value, 10);
  if (Number.isNaN(v) || v <= 0) throw new Error(`qwispr: invalid ${label}`);
  return v;
}