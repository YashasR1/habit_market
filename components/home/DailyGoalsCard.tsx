import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface DailyGoalsCardProps {
    progressPercent: number;
}

export const DailyGoalsCard = ({ progressPercent }: DailyGoalsCardProps) => {
    const todayDate = new Date();
    const dayShort = todayDate.toLocaleDateString('en-US', { weekday: 'short' });
    const dateNum = todayDate.getDate();

    return (
        <View style={styles.goalsCard}>
            <View style={styles.goalsHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View style={styles.boltIconContainer}>
                    <Zap size={16} color={Colors.text} fill={Colors.text} />
                </View>
                <Text style={styles.goalsTitle}>
                    Daily Goals <Text style={styles.goalsSubtitle}>({dayShort}, {dateNum})</Text>
                </Text>
            </View>
            </View>
            
            <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
            </View>
            </View>
            
            <Text style={styles.progressText}>
                You completed {progressPercent}% of your daily goals
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
  goalsCard: { 
      backgroundColor: '#0F1523',
      marginHorizontal: 15, 
      marginTop: 10, 
      marginBottom: 20, 
      padding: 20, 
      borderRadius: 24,
      borderWidth: 1,
      borderColor: '#1E293B'
  },
  goalsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  boltIconContainer: { marginRight: 10 },
  goalsTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  goalsSubtitle: { color: Colors.textSecondary, fontSize: 14, fontWeight: 'normal' },
  progressBarContainer: { marginBottom: 15 },
  progressBarBg: { height: 8, backgroundColor: '#1E293B', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#818CF8', borderRadius: 4 },
  progressText: { color: Colors.textSecondary, fontSize: 13, marginBottom: 20 },
});
