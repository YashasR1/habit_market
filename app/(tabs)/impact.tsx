import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { CandlestickChart } from 'react-native-wagmi-charts';
import { TrendingUp, Rocket, CheckSquare, Zap, AlertTriangle, Flame, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabits } from '../../context/HabitContext';
import { Colors } from '../../constants/Colors';
import { detectPattern } from '../../utils/habitMarketEngine';

import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// LOW #15: Format candle values as percentages for the tooltip
const formatCandleValue = (value: number) => `${Math.round(value * 100)}%`;

// MID #10: Get today's day-of-week index (0=Mon ... 6=Sun)
const getTodayBarIndex = () => {
  const day = new Date().getDay(); // 0=Sun, 1=Mon ... 6=Sat
  return day === 0 ? 6 : day - 1;  // Convert to Mon=0...Sun=6
};

export default function ImpactScreen() {
  const router = useRouter();
  const { chartData, getWeeklyComparisonData } = useHabits();
  
  const { currentWeekData, pastWeekData } = getWeeklyComparisonData();
  const todayBarIndex = getTodayBarIndex();

  // HIGH #2: Today's live score based on actual completion rate (not the cumulative chart price)
  const todayEfficiency = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const last = chartData[chartData.length - 1];
    return Math.round((last.actualRate ?? last.close) * 100);
  }, [chartData]);

  // HIGH #2: Historical all-time average (separate, clearly labelled)
  const averageEfficiency = useMemo(() => {
    if (!chartData || chartData.length === 0) return 0;
    const sum = chartData.reduce((acc: number, curr: any) => acc + (curr.actualRate ?? curr.close), 0);
    return Math.round((sum / chartData.length) * 100);
  }, [chartData]);

  // HIGH #4 + LOW #13: Rolling 3-5 day average for trend direction (in useMemo)
  const isBullish = useMemo(() => {
    if (chartData.length < 2) return true;
    const windowSize = Math.min(5, chartData.length);
    const recentSlice = chartData.slice(-windowSize);
    const recentAvg = recentSlice.reduce((s: number, c: any) => s + c.close, 0) / recentSlice.length;

    const prevWindowSize = Math.min(5, chartData.length - windowSize);
    if (prevWindowSize <= 0) {
      // Fallback: compare last two candles
      return chartData[chartData.length - 1].close >= chartData[chartData.length - 2].close;
    }
    const prevSlice = chartData.slice(-(windowSize + prevWindowSize), -windowSize);
    const prevAvg = prevSlice.reduce((s: number, c: any) => s + c.close, 0) / prevSlice.length;
    return recentAvg >= prevAvg;
  }, [chartData]);

  // MID #8: Detect and surface candlestick patterns
  const pattern = useMemo(() => detectPattern(chartData), [chartData]);

  const patternIconColor = pattern?.type === 'BREAKOUT' ? Colors.success
    : pattern?.type === 'REVERSAL' ? '#F59E0B'
    : Colors.primary;

  // MID #11: Pad data to prevent "giant blocks" when only 1-2 days of data exist
  const paddedData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];
    if (chartData.length >= 20) return chartData;
    
    // Create empty "slots" until we reach 20 to maintain consistent bar width
    const lastItem = chartData[chartData.length - 1];
    const paddingCount = 20 - chartData.length;
    const padding = Array.from({ length: paddingCount }).map((_, i) => ({
        ...lastItem,
        // Advance timestamps so they are unique and in the future
        timestamp: lastItem.timestamp + (i + 1) * 86400000,
        // Match open/close so they appear as flat lines or are effectively invisible
        open: lastItem.close,
        high: lastItem.close,
        low: lastItem.close,
        close: lastItem.close,
    }));
    
    return [...chartData, ...padding];
  }, [chartData]);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 120 }} 
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 50, marginBottom: 25 }}>
        <Text style={{ color: Colors.text, fontSize: 24, fontWeight: 'bold' }}>Cumulative Impact</Text>
        <TouchableOpacity 
            onPress={() => router.push('/weekly-report' as any)} 
            style={{ padding: 8, backgroundColor: '#1E293B', borderRadius: 8 }}
        >
            <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: 'bold' }}>Weekly Report</Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CANDLESTICK CHART */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Discipline Index (DI)</Text>
          {/* LOW #14: More accurate subtitle */}
          <Text style={styles.chartSub}>Updates when you check off habits</Text>
        </View>
        
        {chartData && chartData.length > 0 ? (
          <CandlestickChart.Provider data={paddedData}>
            <CandlestickChart width={width - 60} height={220}>
              <CandlestickChart.Candles positiveColor={Colors.success} negativeColor={Colors.error} />
              <CandlestickChart.Crosshair>
                {/* LOW #15: Format tooltip values as percentages */}
                <CandlestickChart.Tooltip
                  style={styles.tooltip}
                  textStyle={styles.tooltipText}
                />
              </CandlestickChart.Crosshair>
            </CandlestickChart>
          </CandlestickChart.Provider>
        ) : (
          <View style={{ height: 220, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: Colors.textSecondary }}>No market data available yet.</Text>
          </View>
        )}

        {/* HIGH #4: Rolling average trend sentiment */}
        <View style={[styles.chartFooter, { backgroundColor: isBullish ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
          <TrendingUp color={isBullish ? Colors.success : Colors.error} size={16} />
          <Text style={[styles.footerText, { color: isBullish ? Colors.success : Colors.error }]}>
            {isBullish ? "Market Sentiment: Bullish. Keep pushing!" : "Market Sentiment: Bearish. Resistance at 50%."}
          </Text>
        </View>

        {/* MID #8: Pattern Signal Banner */}
        {pattern && (
          <View style={[styles.patternBanner, { borderColor: patternIconColor }]}>
            <Activity size={14} color={patternIconColor} />
            <View style={{ marginLeft: 8, flex: 1 }}>
              <Text style={[styles.patternName, { color: patternIconColor }]}>
                {pattern.name} · {pattern.type}
              </Text>
              <Text style={styles.patternMsg}>{pattern.message}</Text>
            </View>
          </View>
        )}
      </View>

      {/* EFFICIENCY SCORE SECTION */}
      {/* HIGH #2: Shows today's score + all-time average separately */}
      <View style={styles.efficiencyContainer}>
        <View style={styles.scoreCircle}>
          <View style={[styles.innerCircle, { borderColor: todayEfficiency > 70 ? Colors.success : '#F59E0B' }]}>
            <Text style={styles.scoreNumber}>{todayEfficiency}%</Text>
            <Text style={styles.scoreLabel}>Today</Text>
          </View>
        </View>
        
        <View style={styles.statsList}>
          <StatItem icon={<Rocket size={18} color={Colors.primary} />} label="Today's Score" value={`${todayEfficiency}%`} />
          <StatItem icon={<Flame size={18} color={Colors.primary} />} label="All-time Average" value={`${averageEfficiency}%`} />
          {/* MID #9: Renamed from "Total Volume" to "Days Tracked" */}
          <StatItem icon={<CheckSquare size={18} color={Colors.primary} />} label="Days Tracked" value={chartData.length} />
          <StatItem icon={<Zap size={18} color={Colors.primary} />} label="Market Status" value={isBullish ? "UPTREND" : "PULLBACK"} />
        </View>
      </View>

      {/* WEEKLY ACTIVITY BARS */}
      <View style={styles.activityCard}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: 'bold' }}>Weekly Activity</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#818CF8' }} />
                    <Text style={{ color: Colors.textSecondary, fontSize: 10 }}>Current</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#334155' }} />
                    <Text style={{ color: Colors.textSecondary, fontSize: 10 }}>Past</Text>
                </View>
            </View>
        </View>

        <View style={styles.barContainer}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
            const isToday = i === todayBarIndex;
            // MID #10: Highlight today's bar with brighter color
            const currentBarColor = isToday ? '#A5B4FC' : '#818CF8';
            return (
              <View key={i} style={styles.barGroup}>
                 <View style={styles.barWrapper}>
                   {/* PAST WEEK BAR */}
                   <View style={[styles.bar, { 
                       height: Math.max((pastWeekData[i] || 0) * 100, 4), 
                       backgroundColor: '#334155',
                       opacity: 0.5
                   }]} />
                   
                   {/* CURRENT WEEK BAR */}
                   <View style={[styles.bar, { 
                       height: Math.max((currentWeekData[i] || 0) * 100, 4),
                       backgroundColor: currentBarColor,
                       // MID #10: Today's bar gets a subtle glow border
                       ...(isToday ? { borderRadius: 4, shadowColor: '#818CF8', shadowOpacity: 0.8, shadowRadius: 4, elevation: 4 } : {})
                   }]} />
                </View>
                <Text style={[styles.barLabel, isToday && { color: '#A5B4FC', fontWeight: 'bold' }]}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>


    </ScrollView>
  );
}

const StatItem = ({ icon, label, value }: any) => (
  <View style={styles.statItem}>
    {icon}
    <View style={{ marginLeft: 12 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  header: { color: Colors.text, fontSize: 24, fontWeight: 'bold', marginTop: 50, marginBottom: 25 },
  chartCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 15, marginBottom: 20 },
  chartHeader: { marginBottom: 15 },
  chartTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  chartSub: { color: Colors.textSecondary, fontSize: 12 },
  chartFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 15, padding: 8, borderRadius: 8 },
  footerText: { fontSize: 11, marginLeft: 8, fontWeight: '600' },
  // MID #8: Pattern signal banner
  patternBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3,
  },
  patternName: { fontSize: 11, fontWeight: 'bold', marginBottom: 2 },
  patternMsg: { color: Colors.textSecondary, fontSize: 11, lineHeight: 16 },
  // LOW #15: Tooltip styling
  tooltip: { backgroundColor: '#1E293B', borderRadius: 6, padding: 6 },
  tooltipText: { color: Colors.text, fontSize: 10 },
  efficiencyContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25 },
  scoreCircle: { width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
  innerCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, justifyContent: 'center', alignItems: 'center' },
  // HIGH #2: Added "Today" sub-label inside circle
  scoreNumber: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  scoreLabel: { color: Colors.textSecondary, fontSize: 9 },
  statsList: { flex: 1, marginLeft: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statValue: { color: Colors.text, fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: Colors.textSecondary, fontSize: 11 },
  activityCard: { backgroundColor: Colors.surface, borderRadius: 20, padding: 20, marginBottom: 50 },
  activityTitle: { color: Colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 20 },
  barContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingBottom: 5 },
  barGroup: { alignItems: 'center', justifyContent: 'flex-end' },
  barWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 100 },
  bar: { width: 8, borderRadius: 4 },
  barLabel: { color: Colors.textSecondary, fontSize: 10, marginTop: 8, textAlign: 'center' }
});