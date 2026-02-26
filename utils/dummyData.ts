import { Candle } from './habitMarketEngine';

export const generateDummyHistory = (days: number): Candle[] => {
  const history: Candle[] = [];
  let currentPrice = 0.5; // Start at neutral
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const timestamp = date.getTime();

    // Randomize daily performance
    // Trend: mostly slightly up, but with some bad days
    const isGoodDay = Math.random() > 0.3; 
    const completionRate = isGoodDay 
        ? 0.6 + (Math.random() * 0.4) // 0.6 to 1.0
        : 0.1 + (Math.random() * 0.4); // 0.1 to 0.5
    
    // Open is roughly yesterday's close + small gap
    const prevClose = history.length > 0 ? history[history.length - 1].close : 0.5;
    const open = prevClose + (Math.random() * 0.1 - 0.05);
    
    // Close is driven by completion rate
    const close = (open + completionRate) / 2; // Simple weight

    // High/Low
    const high = Math.max(open, close) + (Math.random() * 0.05);
    const low = Math.min(open, close) - (Math.random() * 0.05);

    history.push({
      timestamp,
      open: parseFloat(open.toFixed(4)),
      high: parseFloat(high.toFixed(4)),
      low: parseFloat(low.toFixed(4)),
      close: parseFloat(close.toFixed(4)),
    });
  }
  
  return history;
};
