import { buildMockDaily } from "./mockDaily";

const SALT = 30_003;
const TRADING_DAYS = 90;

export function buildMock3m() {
  return buildMockDaily({ tradingDays: TRADING_DAYS, salt: SALT });
}
