/**
 * 결정적 해시 기반 pseudo-random [0, 1)
 * 기존 `index * 상수 + salt` 선형식은 톱니파(주기적) 패턴을 만들어
 * 봉이 많은 기간에서 규칙적 무늬가 보였으므로 비트 믹싱 해시로 교체.
 */
function hash(index: number, salt: number): number {
  let h = (Math.imul(index | 0, 0x9e3779b1) ^ (salt | 0)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0x100000000;
}

export function seededUnit(index: number, salt: number): number {
  return hash(index, salt);
}

export function seededUnit2(index: number, salt: number): number {
  return hash(index, salt ^ 0x5bd1e995);
}
