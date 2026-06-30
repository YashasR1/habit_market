import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { Check, MoreHorizontal, ChevronRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../../constants/Colors';
import { AVAILABLE_ICONS } from '../../constants/Icons';
import { EmptyState } from '../common/EmptyState';
import { WebCanvasWidget } from '../web-simulation/WebCanvasWidget';

interface HabitListProps {
    activeHabits: any[];
    toggleHabit: (id: string) => void;
    setHabitToDelete: (id: string) => void;
    setIsModalVisible: (val: boolean) => void;
}

export const HabitList = ({ 
    activeHabits, 
    toggleHabit, 
    setHabitToDelete, 
    setIsModalVisible,
}: HabitListProps) => {
    const [isAllHabitsVisible, setIsAllHabitsVisible] = useState(false);

    const renderHabitIcon = (iconName: string, size = 24, color = '#FFF') => {
        const iconDef = AVAILABLE_ICONS.find(i => i.name === iconName);
        if (iconDef) {
            const Icon = iconDef.component;
            return <Icon size={size} color={color} />;
        }
        return <Text style={{ fontSize: size, color }}>{iconName}</Text>;
    };

    const renderHabitItem = ({ item }: { item: any }) => (
        <Pressable 
            style={[styles.habitItem, item.completed && styles.habitItemCompleted]}
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleHabit(item.id);
            }}
        >
            <View style={styles.habitLeft}>
                <View style={[styles.habitIconContainer, item.completed && { backgroundColor: Colors.success }]}>
                        {renderHabitIcon(item.icon, 20, item.completed ? '#FFF' : Colors.primary)}
                </View>
                <View>
                    <Text style={[styles.habitTitle, item.completed && styles.textCompleted]}>
                        {item.title}
                    </Text>
                    <Text style={styles.habitStreak}>
                        🔥 {item.streak} day streak
                    </Text>
                </View>
            </View>

            {item.completed ? (
            <View style={styles.checkCircle}>
                <Check size={16} color="#FFF" strokeWidth={3} />
            </View>
            ) : (
            <View style={styles.circle} />
            )}
            
            <TouchableOpacity 
                style={{ padding: 10, marginRight: -10 }}
                onPress={() => setHabitToDelete(item.id)}
            >
                <MoreHorizontal color={Colors.textMuted} size={18} />
            </TouchableOpacity>
        </Pressable>
    );

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={activeHabits.slice(0, 4)} // Limit to 4
                renderItem={renderHabitItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                ListFooterComponent={() => (
                    <View style={{ gap: 20, marginTop: 10 }}>
                        {activeHabits.length > 4 && (
                            <TouchableOpacity 
                                style={styles.viewAllBtn}
                                onPress={() => setIsAllHabitsVisible(true)} 
                            >
                                <Text style={styles.viewAllText}>View All Habits ({activeHabits.length})</Text>
                                <ChevronRight color={Colors.textSecondary} size={16} />
                            </TouchableOpacity>
                        )}

                        {/* CANVAS ACTIVITY WIDGET */}
                        {Platform.OS === 'web' && (
                            <WebCanvasWidget />
                        )}
                    </View>
                )}
                ListEmptyComponent={
                    <EmptyState 
                        title="No Habits Yet"
                        description="Start small. Choose a habit to track and begin your journey."
                        icon="target"
                        actionLabel="Start a Habit"
                        onAction={() => setIsModalVisible(true)}
                    />
                }
            />

            {/* ALL HABITS MODAL */}
            <Modal visible={isAllHabitsVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.container, { paddingTop: 20 }]}>
                    <View style={styles.header}>
                        <Text style={styles.goalsTitle}>All Habits</Text>
                        <TouchableOpacity onPress={() => setIsAllHabitsVisible(false)} style={{ padding: 10 }}>
                            <Text style={{ color: Colors.primary, fontSize: 16, fontWeight: 'bold' }}>Done</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        {activeHabits.map((item: any) => (
                           <React.Fragment key={item.id}>
                               {renderHabitItem({ item })}
                           </React.Fragment>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  goalsTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  
  habitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#0F1523',
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#1E293B',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2
  },
  habitItemCompleted: {
      borderColor: 'rgba(34, 197, 94, 0.3)',
      backgroundColor: 'rgba(34, 197, 94, 0.05)'
  },
  habitLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  habitIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.05)',
      alignItems: 'center',
      justifyContent: 'center'
  },
  habitTitle: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  textCompleted: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  habitStreak: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  circle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors.textSecondary,
      marginLeft: 10
  },
  checkCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: Colors.success,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10
  },
  emptyState: {
      alignItems: 'center',
      marginTop: 40,
      padding: 20
  },
  emptyStateText: {
      color: Colors.textMuted,
      marginBottom: 10
  },
  addHabitBtnSmall: {
      backgroundColor: '#1E293B',
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 20
  },
  addHabitBtnTextSmall: {
      color: Colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 12
  },
  viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      backgroundColor: '#1E293B',
      borderRadius: 12,
      gap: 5
  },
  viewAllText: {
      color: Colors.textSecondary,
      fontSize: 14,
      fontWeight: '600'
  },
  activityCard: {
      backgroundColor: '#0F1523',
      borderRadius: 16,
      padding: 15,
      borderWidth: 1,
      borderColor: '#1E293B',
      gap: 10
  },
  activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
  },
  activityAuthor: {
      color: Colors.text,
      fontWeight: 'bold',
      fontSize: 13
  },
  activityContent: {
      color: Colors.textSecondary,
      fontSize: 14,
      fontStyle: 'italic',
      lineHeight: 20
  },
  activityTime: {
      color: Colors.textMuted,
      fontSize: 11,
      alignSelf: 'flex-end'
  },
  avatarStats: {
      width: 24, 
      height: 24, 
      borderRadius: 12, 
      backgroundColor: Colors.primary, 
      alignItems: 'center', 
      justifyContent: 'center'
  },
  sectionTitle: {
      color: Colors.textMuted,
      fontSize: 12,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 10,
      marginLeft: 20
  },
});
