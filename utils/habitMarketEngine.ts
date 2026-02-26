// utils/habitMarketEngine.ts

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  actualRate?: number; // Stores the true 0-1 completion rate for stats
}

export const calculateCandle = (
  history: Candle[],
  completionRate: number, // 0.0 to 1.0
  totalTasks: number
): Candle => {
  // If no history, start at a baseline of 1.00
  if (!history || history.length === 0) {
    const open = 1.00;
    const close = 1.00 + (completionRate > 0.5 ? 0.05 : -0.05);
    const volatility = 0.02;
    return {
      timestamp: Date.now(),
      open: parseFloat(open.toFixed(4)),
      high: parseFloat((Math.max(open, close) + volatility).toFixed(4)),
      low: parseFloat((Math.min(open, close) - volatility).toFixed(4)),
      close: parseFloat(close.toFixed(4)),
      actualRate: completionRate
    };
  }

  const yesterday = history[history.length - 1];
  const completedTasks = Math.round(completionRate * totalTasks);
  
  // 1. The Opening Bell
  // Stock opens with a strictly small random deviation from yesterday's close
  const gap = (Math.random() - 0.5) * 0.01;
  const open = yesterday.close + gap;

  // --- NEW: Weekend Volatility Factor ---
  // Markets are volatile on weekends because routines are harder to maintain.
  const today = new Date();
  const isWeekend = today.getDay() === 0 || today.getDay() === 6; // Sunday or Saturday
  const volatilityMultiplier = isWeekend ? 1.5 : 1.0;

  // 2. The Intraday Sell-Off (The Drop)
  // The market constantly applies downward pressure EQUAL to the total number of habits.
  // Example: 4 habits = 4x pressure. 6 habits = 6x pressure.
  const BASE_POINT = 0.015 * volatilityMultiplier; // 1.5% equivalent move per task (boosted on weekends)
  const sellOffPressure = totalTasks * BASE_POINT;

  // 3. Buying the Dip
  // To satisfy: "If I complete 2 out of 4 habits, I want a 50% big green candle"
  // If baseline drop = -4 points. Completing 2 habits MUST yield +6 points total (+2 net).
  // So each completed habit provides 3x the baseline point in "Buy Pressure".
  const buyPressurePerTask = BASE_POINT * 3;
  const totalBuyPressure = completedTasks * buyPressurePerTask;

  // 4. Calculate Close
  // The close is the starting price minus the gravity of the total tasks, plus the effort of completing them.
  let delta = totalBuyPressure - sellOffPressure;
  const close = open + delta;

  // 5. Wicks (Highs and Lows)
  // Low: Shows the intraday "crash" down to the sell-off pressure before you bought it back.
  // High: Adds some random market noise above the highest body point.
  const maxIntradayDrop = open - sellOffPressure;
  const low = Math.min(open, close, maxIntradayDrop) - (Math.random() * 0.005);
  const high = Math.max(open, close) + (Math.random() * 0.01);

  return {
    timestamp: Date.now(),
    open: parseFloat(open.toFixed(4)),
    high: parseFloat(high.toFixed(4)),
    low: parseFloat(low.toFixed(4)),
    close: parseFloat(close.toFixed(4)),
    actualRate: completionRate
  };
};

export const detectPattern = (history: Candle[]) => {
  if (history.length < 3) return null;

  const today = history[history.length - 1];
  const prev = history[history.length - 2];

  // 1. BIG GREEN MARUBOZU (Massive productivity day)
  if (today.close > today.open + 0.2 && (today.high - today.close) < 0.02) {
    return {
      name: "Bullish Marubozu",
      message: "High Conviction Day! You dominated your tasks with zero hesitation.",
      type: "BREAKOUT"
    };
  }

  // 2. HAMMER (Recovery after a slump)
  const bodySize = Math.abs(today.open - today.close);
  const lowerWick = Math.min(today.open, today.close) - today.low;
  if (lowerWick > bodySize * 2 && today.close > today.open) {
    return {
      name: "Hammer",
      message: "Strong Recovery! You started slow but finished strong. Trend reversal imminent.",
      type: "REVERSAL"
    };
  }

  // 3. GAP UP (Early Bird) — now based on actual open vs prev close
  if (today.open > prev.close + 0.05) {
    return {
      name: "Gap Up",
      message: "Early Market Entry! Your early start has given you a head start on the day.",
      type: "MOMENTUM"
    };
  }

  return null;
};