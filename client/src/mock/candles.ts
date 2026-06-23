export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Default export structure as requested in example
export const candles: Candle[] = [
  {
    time: "2025-01-01",
    open: 100,
    high: 110,
    low: 95,
    close: 108,
    volume: 500000,
  },
];

// Helper to generate dynamic high-quality mock data for chart visuals
export const generateMockCandles = (symbol: string, count = 150): Candle[] => {
  let price = 100;
  const upper = symbol.toUpperCase();
  if (upper === "TCS") price = 3845.20;
  else if (upper === "RELIANCE") price = 2950.40;
  else if (upper === "INFY") price = 1490.50;
  else if (upper === "HDFCBANK") price = 1560.10;

  // Let's go backwards and construct history
  const data: Candle[] = [];
  const today = new Date();
  
  // To avoid date mismatches, let's step day by day
  let datePointer = new Date(today);
  datePointer.setDate(today.getDate() - Math.floor(count * 1.5)); // Start older

  // Initialize starting price a bit lower/higher to trend to current
  let currentPrice = price - (Math.random() * 200 - 100);

  for (let i = 0; i < count; i++) {
    // Increment date until we get a weekday
    do {
      datePointer.setDate(datePointer.getDate() + 1);
    } while (datePointer.getDay() === 0 || datePointer.getDay() === 6);

    const timeStr = datePointer.toISOString().split("T")[0];

    // Random walk with positive bias or symbol bias
    const volatility = 0.015; // 1.5%
    const change = currentPrice * (Math.random() * volatility * 2 - volatility);
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + (Math.random() * currentPrice * 0.008);
    const low = Math.min(open, close) - (Math.random() * currentPrice * 0.008);
    const volume = Math.floor(Math.random() * 1500000) + 300000;

    data.push({
      time: timeStr,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  // Force the last candle's close close to current price for UI consistency
  const lastIndex = data.length - 1;
  if (lastIndex >= 0) {
    data[lastIndex].close = price;
    data[lastIndex].high = Math.max(data[lastIndex].open, price) + 5;
    data[lastIndex].low = Math.min(data[lastIndex].open, price) - 5;
  }

  return data;
};
