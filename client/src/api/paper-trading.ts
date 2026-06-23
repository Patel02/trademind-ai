import { paperTradingService } from "../features/paper-trading/paper-trading.service";

/**
 * Client-side mock "API Layer" matching Express/Rest endpoints:
 * POST /buy
 * POST /sell
 * GET /positions
 * GET /portfolio
 * GET /history
 */
export const buy = async (symbol: string, quantity: number, note?: string) => {
  console.log(`[API POST /buy] Placing order for ${symbol}, Quantity: ${quantity}, Note: ${note}`);
  return await paperTradingService.placeOrder(symbol, "BUY", quantity, note);
};

export const sell = async (symbol: string, quantity: number, note?: string) => {
  console.log(`[API POST /sell] Placing order for ${symbol}, Quantity: ${quantity}, Note: ${note}`);
  return await paperTradingService.placeOrder(symbol, "SELL", quantity, note);
};

export const getPositions = async () => {
  console.log("[API GET /positions] Fetching positions");
  return await paperTradingService.getPositions();
};

export const getPortfolio = async () => {
  console.log("[API GET /portfolio] Fetching portfolio metrics");
  return await paperTradingService.getPortfolio();
};

export const getHistory = async () => {
  console.log("[API GET /history] Fetching closed trades logs");
  return await paperTradingService.getClosedTrades();
};
