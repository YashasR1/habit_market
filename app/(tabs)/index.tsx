import React, { useState, useEffect, useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text,
  Pressable, 
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CircleUser, Plus, TrendingUp, Shield, Rocket, Diamond, Crown, Bot, Zap } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useHabits } from '../../context/HabitContext';
import { usePod } from '../../context/PodContext';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import { OnboardingModal } from '../../components/home/OnboardingModal';
import { DailyGoalsCard } from '../../components/home/DailyGoalsCard';
import { HabitList } from '../../components/home/HabitList';
import { AddHabitModal } from '../../components/home/AddHabitModal';
import { ManageHabitModal } from '../../components/home/ManageHabitModal';
import { SkeletonLoader } from '../../components/common/SkeletonLoader';

// Avatar config — mirrors profile.tsx AVATARS
const AVATAR_MAP: Record<string, { icon: any; color: string }> = {
  TrendingUp: { icon: TrendingUp, color: '#4ADE80' },
  Shield:     { icon: Shield,     color: '#3B82F6' },
  Rocket:     { icon: Rocket,     color: '#F59E0B' },
  Diamond:    { icon: Diamond,    color: '#06B6D4' },
  Crown:      { icon: Crown,      color: '#F43F5E' },
  Bot:        { icon: Bot,        color: '#8B5CF6' },
  Zap:        { icon: Zap,        color: '#EAB308' },
};

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  if ((global as any).nativeFabricUIManager) {
    // No-op in New Architecture
  } else {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function DailyFocusScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dailyHabits, updateMarket, addHabit, removeHabit, toggleHabit, pauseHabit, archiveHabit, userName, updateUserName, userAvatar } = useHabits();
  const { clientProjects, isLoaded } = usePod();
  
  // Resolve avatar icon — falls back to CircleUser if default (TrendingUp is profile default, not home default)
  const avatarEntry = userAvatar ? AVATAR_MAP[userAvatar] : null;
  const AvatarIcon = avatarEntry?.icon ?? null;
  const avatarColor = avatarEntry?.color ?? Colors.text;
  
  const activeHabits = dailyHabits.filter((h: any) => !h.status || h.status === 'active');
  
  // Modals State
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Create / Edit State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('Dumbbell');

  // Delete Confirmation State
  const [habitToDelete, setHabitToDelete] = useState<string | null>(null);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const hasSeen = await AsyncStorage.getItem('HAS_SEEN_ONBOARDING');
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  };

  const closeOnboarding = async () => {
    setShowOnboarding(false);
    await AsyncStorage.setItem('HAS_SEEN_ONBOARDING', 'true');
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim().length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      addHabit(newTaskTitle, newHabitIcon);
      setNewTaskTitle('');
      setNewHabitIcon('Dumbbell');
      setIsModalVisible(false);
      updateMarket();
    }
  };

  const confirmDelete = () => {
      // ...
      if (habitToDelete) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          removeHabit(habitToDelete);
          setHabitToDelete(null);
      }
  };
  
  // #12: Memoize to avoid stale reads during rapid toggles
  const progressPercent = useMemo(() =>
    activeHabits.length > 0
      ? Math.round((activeHabits.filter((h: any) => h.completed).length / activeHabits.length) * 100)
      : 0,
  [activeHabits]);

  // #7: Dynamic greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);
    
  // Canvas activity widget: find the most recently edited projects
  const recentCanvasEdits = useMemo(() => {
    const edited = (clientProjects || [])
      .filter((p: any) => p.lastEditedAt)
      .sort((a: any, b: any) => new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime())
      .slice(0, 5); // Take up to 5
    if (!edited.length) return null;
    return edited.map((p: any) => ({
      projectId: p.id,
      projectName: p.name,
      editedBy: p.lastEditedBy || 'Someone',
      editedAt: p.lastEditedAt
    }));
  }, [clientProjects]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      
      {/* 1. ONBOARDING OVERLAY */}
      <OnboardingModal 
        visible={showOnboarding}
        userName={userName}
        updateUserName={updateUserName}
        onClose={closeOnboarding}
      />

      {/* 2. MANAGE HABIT MODAL */}
      <ManageHabitModal 
        habitId={habitToDelete} 
        onClose={() => setHabitToDelete(null)}
        onPause={pauseHabit}
        onArchive={archiveHabit}
        onDelete={confirmDelete}
      />

      {/* 3. HEADER SECTION */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.greetingName}>{userName}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
            {AvatarIcon
              ? <AvatarIcon color={avatarColor} size={28} strokeWidth={1.5} />
              : <CircleUser color={Colors.text} size={28} strokeWidth={1.5} />}
          </Pressable>
        </View>
      </View>

      {!isLoaded ? (
        <View style={{ paddingHorizontal: 20 }}>
          <SkeletonLoader width="100%" height={100} style={{ marginBottom: 20, borderRadius: 16 }} />
          <SkeletonLoader width="100%" height={160} style={{ marginBottom: 15, borderRadius: 16 }} />
          {[1,2,3].map(i => (
            <SkeletonLoader key={i} width="100%" height={80} style={{ marginBottom: 12, borderRadius: 16 }} />
          ))}
        </View>
      ) : (
        <>
          {/* 5. DAILY GOALS CARD */}
          <DailyGoalsCard progressPercent={progressPercent} />

          {/* 6. HABIT LIST */}
          <HabitList 
            activeHabits={activeHabits}
            toggleHabit={toggleHabit}
            setHabitToDelete={setHabitToDelete}
            setIsModalVisible={setIsModalVisible}
            recentCanvasEdits={recentCanvasEdits}
          />
        </>
      )}

      {/* 7. FAB */}
      <Pressable style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Plus color={Colors.background} size={30} />
      </Pressable>

      {/* 8. ADD TASK MODAL */}
      <AddHabitModal 
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onAdd={handleAddTask}
        newTaskTitle={newTaskTitle}
        setNewTaskTitle={setNewTaskTitle}
        newHabitIcon={newHabitIcon}
        setNewHabitIcon={setNewHabitIcon}
        bottomInset={insets.bottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  profileButton: { padding: 5 },
  fab: { position: 'absolute', right: 20, backgroundColor: Colors.white, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 8, bottom: 110 },
  // #7 Greeting styles
  greetingText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  greetingName: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  headerBtn: { padding: 4 },
});