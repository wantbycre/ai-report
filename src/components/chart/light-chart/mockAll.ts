import { buildMockDaily } from "./mockDaily";

const SALT = 50_005;
const TRADING_DAYS = 750;

export function buildMockAll() {
  return buildMockDaily({ tradingDays: TRADING_DAYS, salt: SALT });
}
