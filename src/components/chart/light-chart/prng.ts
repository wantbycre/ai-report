/** 결정적 pseudo-random [0, 1) */
export function seededUnit(index: number, salt: number): number {
  const s = ((index * 1103515245 + salt) >>> 0) / 0x100000000;
  return s;
}

export function seededUnit2(index: number, salt: number): number {
  const s = ((index * 1664525 + salt + 1013904223) >>> 0) / 0x100000000;
  return s;
}
