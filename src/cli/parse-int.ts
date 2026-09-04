export function parseIntSafe(value: string, label: string): number {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) throw new Error(`qwispr: invalid ${label}`);
  const v = parseInt(trimmed, 10);
  if (Number.isNaN(v) || v <= 0) throw new Error(`qwispr: invalid ${label}`);
  return v;
}