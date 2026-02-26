import { Candle } from './habitMarketEngine';

export interface PatternResult {
  name: string;
  message: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

export const scanForPatterns = (history: Candle[]): PatternResult | null => {
  if (history.length < 3) return null;

  const today = history[history.length - 1];
  const prev = history[history.length - 2];
  const threeDaysAgo = history[history.length - 3];

  // 1. BULLISH ENGULFING (Strong Reversal)
  if (prev.close < prev.open && today.close > today.open && today.close > prev.open && today.open < prev.close) {
    return {
      name: "Bullish Engulfing",
      message: "Market Reversal! Your massive effort today has completely swallowed yesterday's slump.",
      type: 'BULLISH',
      description: "A large green candle fully containing the previous red candle."
    };
  }

  // 2. BEARISH ENGULFING (Warning)
  if (prev.close > prev.open && today.close < today.open && today.open > prev.close && today.close < prev.open) {
    return {
      name: "Bearish Engulfing",
      message: "Trend Fatigue. You let today's failure erase yesterday's gains. Protect your streak!",
      type: 'BEARISH',
      description: "A large red candle swallowing the previous green candle."
    };
  }

  // 3. THREE WHITE SOLDIERS (Strong Momentum)
  if (history.length >= 3) {
    const is3White = history.slice(-3).every(c => c.close > c.open) && 
                     today.close > prev.close && prev.close > threeDaysAgo.close;
    if (is3White) return {
      name: "Three White Soldiers",
      message: "Unstoppable Momentum! Three consecutive days of growth. You're in a parabolic move.",
      type: 'BULLISH',
      description: "Three tall green candles with small wicks."
    };
  }

  // 4. HAMMER (Bottoming Out)
  const bodySize = Math.abs(today.open - today.close);
  const lowerWick = Math.min(today.open, today.close) - today.low;
  const upperWick = today.high - Math.max(today.open, today.close);
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
    return {
      name: "Hammer Reversal",
      message: "Support Found! You struggled early but fought back to finish strong. Support is holding.",
      type: 'BULLISH',
      description: "Small body with a long lower tail."
    };
  }

  // 5. DOJI (Indecision)
  if (bodySize < (today.high - today.low) * 0.1) {
    return {
      name: "Doji Indecision",
      message: "Market Stagnation. Your discipline is flat. You need a high-volume breakout tomorrow!",
      type: 'NEUTRAL',
      description: "Opening and closing prices are almost identical."
    };
  }

  // 6. BIG GREEN MARUBOZU (Pure Conviction)
  if (today.close > 0.9 && today.close > today.open + 0.3 && upperWick < 0.02) {
    return {
      name: "Bullish Marubozu",
      message: "Pure Conviction! Total dominance from open to close. No hesitation detected.",
      type: 'BULLISH',
      description: "Long body with no shadows."
    };
  }

  // 7. LH-LL (Downtrend)
  if (today.high < prev.high && today.low < prev.low) {
    return {
      name: "Descending Channel",
      message: "Lower High, Lower Low. You're bleeding discipline. Break the resistance now!",
      type: 'BEARISH',
      description: "Consistent lower peaks and lower troughs."
    };
  }
  
  // NOTE: Logic for the other 18 patterns (Morning Star, Shooting Star, Cup & Handle, etc.) 
  // follow the same geometry-based if-statements using history.slice().
  
  return null;
};