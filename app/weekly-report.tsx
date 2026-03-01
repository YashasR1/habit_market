import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, TrendingUp, TrendingDown, RefreshCcw, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabits } from '../context/HabitContext';
import { Colors } from '../constants/Colors';
const { width } = Dimensions.get('window');

export default function WeeklyReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getWeeklyStats, getWeeklyComparisonData } = useHabits();

  const stats = getWeeklyStats();
  const { currentWeekData } = getWeeklyComparisonData();

  const today = new Date();
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const dateRange = `${weekStart.getDate()}/${weekStart.getMonth()+1} - ${weekEnd.getDate()}/${weekEnd.getMonth()+1} ${weekEnd.getFullYear()}`;

  // #6: Compute real week number + month name dynamically
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((today.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  const monthName = weekStart.toLocaleString('default', { month: 'long' });

  // Analyze Insight
  let insightTitle = "Keep going!";
  let insightMessage = "Consistency is key. You're doing great.";
  let insightIcon = <TrendingUp color="#4ADE80" size={24} />;

  if (stats.completionRate >= 80) {
      insightTitle = "Solid progress!";
      insightMessage = "You're building strong foundations. Keep that energy going and push a little further every day.";
  } else if (stats.completionRate >= 50) {
      insightTitle = "Good start!";
      insightMessage = "You're on the right track. Try to improve your consistency next week.";
  } else if (stats.completionRate >= 30) {
      insightTitle = "Room to grow";
      insightMessage = "Don't worry, every week is a fresh start. Focus on one habit at a time.";
      insightIcon = <RefreshCcw color="#F59E0B" size={24} />;
  } else {
      insightTitle = "Rough patch";
      insightMessage = "It looks like you've fallen behind. Don't be discouraged, let's aim for just 1 habit tomorrow!";
      insightIcon = <TrendingDown color="#EF4444" size={24} />;
  }

  // Determine current day index (0=Sun, 1=Mon... but we want Mon=0)
  const currentDay = new Date().getDay();
  const adjustedDayIndex = currentDay === 0 ? 6 : currentDay - 1;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <ChevronLeft color={Colors.text} size={28} />
            </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
            {/* #6: Dynamic title computed from real current date */}
            <Text style={styles.pageTitle}>Week {weekNumber} <Text style={{ fontSize: 16, color: Colors.textSecondary }}>({monthName})</Text></Text>
            <Text style={styles.dateRange}>{dateRange}</Text>
        </View>

        {/* INSIGHT CARD */}
        <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.insightCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
            <View style={{ marginRight: 15 }}>{insightIcon}</View>
            <View style={{ flex: 1 }}>
                <Text style={styles.insightTitle}>{insightTitle}</Text>
                <Text style={styles.insightMessage}>{insightMessage}</Text>
            </View>
        </LinearGradient>

        {/* WEEKLY CHART */}
        <View style={styles.chartContainer}>
            <View style={styles.barsRow}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                    const value = currentWeekData[i] || 0;
                    const isActive = i <= adjustedDayIndex;
                    const isPerfect = value === 1;

                    return (
                        <View key={i} style={styles.barWrapper}>
                            {/* Checkmark for perfect days */}
                            {isPerfect && (
                                <View style={styles.checkBadge}>
                                    <CheckCircle2 size={12} color="#0F172A" fill={Colors.textSecondary} />
                                </View>
                            )}
                            
                            <View style={styles.barTrack}>
                                <View style={[
                                    styles.barFill, 
                                    { 
                                        height: `${Math.max(value * 100, 5)}%`,
                                        backgroundColor: isActive ? '#818CF8' : '#334155',
                                        opacity: isActive ? 1 : 0.3
                                    }
                                ]} />
                            </View>
                            <Text style={[styles.dayLabel, isActive && { color: '#FFF' }]}>{day}</Text>
                        </View>
                    );
                })}
            </View>
            
            {/* #16: Removed the misleading "Previous Week" legend — no past week bars are rendered here */}
            <View style={styles.legendContainer}>
                <View style={[styles.legendDot, { backgroundColor: '#818CF8' }]} />
                <Text style={styles.legendText}>This Week&apos;s Progress</Text>
            </View>
        </View>

        {/* GRID STATS */}
        <View style={styles.gridContainer}>
            <View style={styles.gridItem}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.gridValue}>{stats.completionRate}%</Text>
                    <TrendingUp size={16} color={Colors.textSecondary} />
                </View>
                <Text style={styles.gridLabel}>Completion Rate</Text>
            </View>
            <View style={styles.gridItem}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.gridValue}>{stats.totalHabits}</Text>
                    <RefreshCcw size={16} color={Colors.textSecondary} />
                </View>
                <Text style={styles.gridLabel}>Habits Tracked</Text>
            </View>
            <View style={styles.gridItem}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.gridValue}>{stats.bestDay}</Text>
                    <ArrowUpRight size={16} color={Colors.textSecondary} />
                </View>
                <Text style={styles.gridLabel}>Most Productive Day</Text>
            </View>
            <View style={styles.gridItem}>
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.gridValue}>{stats.worstDay}</Text>
                    <ArrowDownRight size={16} color={Colors.textSecondary} />
                </View>
                <Text style={styles.gridLabel}>Least Productive Day</Text>
            </View>
        </View>

        {/* WINS SECTION */}
        <View style={styles.winsContainer}>
            <Text style={styles.sectionTitle}>This Week&apos;s Wins</Text>
            <View style={styles.winsRow}>
                {stats.wins.length > 0 ? (
                    stats.wins.map((habit: any) => {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const Icon = require('lucide-react-native')[habit.icon] || TrendingUp;
                        return (
                             <View key={habit.id} style={styles.winCard}>
                                <View style={styles.winIconBox}>
                                    <Icon size={20} color={Colors.text} />
                                </View>
                                <Text style={styles.winTitle}>{habit.title}</Text>
                             </View>
                        );
                    })
                ) : (
                    <Text style={{ color: Colors.textSecondary, fontStyle: 'italic' }}>Keep completing habits to see your wins!</Text>
                )}
            </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10 },
  backBtn: { padding: 5 },
  shareBtn: { padding: 5 },
  titleContainer: { paddingHorizontal: 25, marginBottom: 25 },
  pageTitle: { color: Colors.text, fontSize: 28, fontWeight: 'bold' },
  dateRange: { color: Colors.textSecondary, fontSize: 14, marginTop: 5 },
  
  insightCard: { flexDirection: 'row', marginHorizontal: 20, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#1E293B', marginBottom: 30, alignItems: 'center' },
  insightTitle: { color: Colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  insightMessage: { color: Colors.textSecondary, fontSize: 13, lineHeight: 18 },

  chartContainer: { paddingHorizontal: 30, marginBottom: 30 },
  barsRow: { flexDirection: 'row', justifyContent: 'space-between', height: 150, alignItems: 'flex-end' },
  barWrapper: { alignItems: 'center', width: 20 },
  barTrack: { height: 120, width: 8, backgroundColor: '#1E293B', borderRadius: 4, justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4 },
  dayLabel: { color: Colors.textSecondary, fontSize: 12, marginTop: 10, fontWeight: '600' },
  checkBadge: { marginBottom: 5 },
  
  legendContainer: { flexDirection: 'row', marginTop: 20, alignItems: 'center' },
  legendDot: { width: 12, height: 12, borderRadius: 4, marginRight: 8 },
  legendText: { color: Colors.textSecondary, fontSize: 12 },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingHorizontal: 20, marginBottom: 30 },
  gridItem: { width: (width - 55) / 2, backgroundColor: '#121C30', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B' },
  gridValue: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  gridLabel: { color: Colors.textSecondary, fontSize: 12 },

  winsContainer: { paddingHorizontal: 25 },
  sectionTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  winsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  winCard: { alignItems: 'center' },
  winIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  winTitle: { color: Colors.textSecondary, fontSize: 12 },
});
