export function roundCurrency(value: number): number {
  return roundTo(value, 2);
}

export function roundRate(value: number): number {
  return roundTo(value, 6);
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
