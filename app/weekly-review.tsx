import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, Share2, TrendingUp } from 'lucide-react-native';

export default function WeeklyReviewScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft color="#FFF" size={28} />
        </Pressable>
        <Share2 color="#FFF" size={24} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Week 4 <Text style={styles.subTitle}>(January)</Text></Text>
        <Text style={styles.dateRange}>19/01 - 25/01 2026</Text>

        {/* FEEDBACK BOX */}
        <View style={styles.feedbackBox}>
          <TrendingUp color="#818CF8" size={20} />
          <View style={{marginLeft: 15, flex: 1}}>
            <Text style={styles.feedbackTitle}>Solid progress!</Text>
            <Text style={styles.feedbackDesc}>You&apos;re building strong foundations. Keep that energy going.</Text>
          </View>
        </View>

        {/* CHART PLACEHOLDER (Use Bars for M, T, W, T, F, S, S) */}
        <View style={styles.chartArea}>
           <Text style={{color: '#94A3B8', textAlign: 'center'}}>Visual Bar Chart Data</Text>
           {/* In production, you would map 7 View components here for the bars */}
        </View>

        {/* STATS GRID */}
        <View style={styles.statsGrid}>
          <StatCard label="69%" sub="Completion Rate" />
          <StatCard label="10" sub="Habits Tracked" />
          <StatCard label="Saturday" sub="Most Productive" />
          <StatCard label="Wednesday" sub="Least Productive" />
        </View>
      </View>
    </ScrollView>
  );
}

const StatCard = ({ label, sub }: any) => (
  <View style={styles.statCard}>
    <Text style={styles.statValue}>{label}</Text>
    <Text style={styles.statLabel}>{sub}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginTop: 20 },
  content: { paddingHorizontal: 20 },
  title: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  subTitle: { color: '#94A3B8', fontSize: 18, fontWeight: 'normal' },
  dateRange: { color: '#64748B', marginBottom: 20 },
  feedbackBox: { backgroundColor: '#1E293B', padding: 20, borderRadius: 16, flexDirection: 'row', marginBottom: 25 },
  feedbackTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  feedbackDesc: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  chartArea: { height: 180, backgroundColor: '#161E2E', borderRadius: 16, justifyContent: 'center', marginBottom: 25 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#1E293B', padding: 20, borderRadius: 16, marginBottom: 15 },
  statValue: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#64748B', fontSize: 12, marginTop: 4 },
});