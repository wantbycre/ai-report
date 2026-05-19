import { buildMockDaily } from "./mockDaily";

const SALT = 40_004;
const TRADING_DAYS = 252;

export function buildMock1y() {
  return buildMockDaily({ tradingDays: TRADING_DAYS, salt: SALT });
}
