import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, TouchableOpacity, Modal, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ChevronLeft, Settings, FileBarChart, LogOut, Archive, Bell, Edit2, Check, PauseCircle, Play, Undo2, X, Trash2, 
    TrendingUp, Shield, Rocket, Diamond, Crown, Bot, Zap
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '../context/HabitContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';

// Avatar Configuration
const AVATARS = [
    { name: 'TrendingUp', icon: TrendingUp, color: '#4ADE80' }, // Growth
    { name: 'Shield', icon: Shield, color: '#3B82F6' }, // Stoic
    { name: 'Rocket', icon: Rocket, color: '#F59E0B' }, // Speed
    { name: 'Diamond', icon: Diamond, color: '#06B6D4' }, // Value
    { name: 'Crown', icon: Crown, color: '#F43F5E' }, // Legacy 
    { name: 'Bot', icon: Bot, color: '#8B5CF6' }, // System
    { name: 'Zap', icon: Zap, color: '#EAB308' }, // Energy
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userName, updateUserName, dailyHabits, resumeHabit, archiveHabit, removeHabit, userAvatar, updateUserAvatar, resetAppData,
    // #2: Wire settings from context
    soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled
  } = useHabits();
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);

  // Modal States
  const [isPausedVisible, setIsPausedVisible] = useState(false);
  const [isArchivedVisible, setIsArchivedVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isAvatarVisible, setIsAvatarVisible] = useState(false);

  // #2: Settings are now live from context — no local shadow state needed

  // Sync tempName
  useEffect(() => { setTempName(userName); }, [userName]);

  const handleSave = () => {
      if (tempName.trim().length > 0) updateUserName(tempName.trim());
      setIsEditing(false);
  };

  const pausedHabits = dailyHabits.filter((h: any) => h.status === 'paused');
  const archivedHabits = dailyHabits.filter((h: any) => h.status === 'archived');
  
  // Render current avatar
  const CurrentAvatarIcon = AVATARS.find(a => a.name === userAvatar)?.icon || TrendingUp;
  const currentAvatarColor = AVATARS.find(a => a.name === userAvatar)?.color || '#4ADE80';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color="#FFF" size={28} />
        </TouchableOpacity>
      </View>

      {/* PROFILE INFO */}
      <View style={styles.profileSection}>
        <TouchableOpacity style={styles.avatarContainer} onPress={() => setIsAvatarVisible(true)}>
          <View style={[styles.avatar, { borderColor: currentAvatarColor, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }]}>
            <CurrentAvatarIcon size={40} color={currentAvatarColor} />
          </View>
          <View style={styles.editBadge}>
            <Edit2 size={10} color="#FFF" />
          </View>
        </TouchableOpacity>
        
        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 5}}>
            {isEditing ? (
                <TextInput 
                    value={tempName}
                    onChangeText={setTempName}
                    style={[styles.userNameInput]}
                    autoFocus
                    onSubmitEditing={handleSave}
                />
            ) : (
                <Text style={styles.userName}>{userName}</Text>
            )}
            
            <TouchableOpacity 
                onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                style={{ padding: 8 }}
            >
                {isEditing ? <Check size={20} color={Colors.success} /> : <Edit2 size={16} color={Colors.textSecondary} />}
            </TouchableOpacity>
        </View>
      </View>

      {/* MENU OPTIONS */}
      <View style={styles.menuContainer}>
        <MenuOption 
            icon={<FileBarChart color="#94A3B8" size={22} />} 
            label="Weekly Reports" 
            onPress={() => router.push('/weekly-report' as any)}
        />
        <MenuOption 
            icon={<Archive color="#94A3B8" size={22} />} 
            label="Hidden Habits" 
            onPress={() => setIsPausedVisible(true)}
            count={pausedHabits.length + archivedHabits.length}
        />
        <MenuOption 
            icon={<Settings color="#94A3B8" size={22} />} 
            label="Settings" 
            onPress={() => setIsSettingsVisible(true)}
        />
        <MenuOption 
            icon={<Trash2 color={Colors.error} size={22} />} 
            label="Reset App Data" 
            onPress={() => {
                // #3: Confirmation guard to prevent accidental data wipe
                Alert.alert(
                    'Reset All Data?',
                    'This will permanently delete all your habits, history, and progress. This cannot be undone.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reset', style: 'destructive', onPress: () => resetAppData() }
                    ]
                );
            }}
            isLast
            textColor={Colors.error}
        />
      </View>
      </ScrollView>

      {/* 4. AVATAR SELECTOR MODAL */}
      <BottomModal 
        visible={isAvatarVisible} 
        onClose={() => setIsAvatarVisible(false)} 
        title="Choose Avatar"
      >
          <View style={styles.avatarGrid}>
            {AVATARS.map((item) => {
                const Icon = item.icon;
                const isSelected = userAvatar === item.name;
                return (
                    <TouchableOpacity 
                        key={item.name}
                        style={[styles.avatarOption, isSelected && { borderColor: item.color, borderWidth: 2, backgroundColor: '#1E293B' }]}
                        onPress={() => {
                            updateUserAvatar(item.name);
                            setIsAvatarVisible(false);
                            Haptics.selectionAsync();
                        }}
                    >
                        <Icon size={32} color={item.color} />
                    </TouchableOpacity>
                );
            })}
          </View>
      </BottomModal>

      {/* 1. MANAGED HABITS MODAL (Merged) */}
      <BottomModal 
        visible={isPausedVisible} 
        onClose={() => setIsPausedVisible(false)} 
        title="Managed Habits"
      >
          <ScrollView style={{ maxHeight: 400 }}>
            {/* SECTION 1: PAUSED */}
            <Text style={styles.sectionTitle}>Paused</Text>
            {pausedHabits.length === 0 ? (
                <Text style={styles.emptyText}>No paused habits.</Text>
            ) : (
                pausedHabits.map((h: any) => (
                    <View key={h.id} style={styles.modalItem}>
                        <Text style={styles.modalItemText}>{h.title}</Text>
                        <TouchableOpacity 
                            style={styles.actionBtn} 
                            onPress={() => resumeHabit(h.id)}
                        >
                            <Play size={16} color={Colors.white} fill={Colors.white} />
                            <Text style={styles.actionBtnText}>Resume</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}

            <View style={{ height: 20 }} />

            {/* SECTION 2: ARCHIVED */}
            <Text style={styles.sectionTitle}>Archived</Text>
            {archivedHabits.length === 0 ? (
                <Text style={styles.emptyText}>No archived habits.</Text>
            ) : (
                archivedHabits.map((h: any) => (
                    <View key={h.id} style={styles.modalItem}>
                        <Text style={[styles.modalItemText, { flex: 1 }]}>{h.title}</Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#334155' }]} onPress={() => resumeHabit(h.id)}>
                                <Undo2 size={16} color={Colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => removeHabit(h.id)}>
                                <Trash2 size={16} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
          </ScrollView>
      </BottomModal>

      {/* 3. SETTINGS MODAL */}

      {/* 3. SETTINGS MODAL */}
      <BottomModal 
        visible={isSettingsVisible} 
        onClose={() => setIsSettingsVisible(false)} 
        title="Settings"
      >
          <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingDesc}>Play sounds when completing habits</Text>
              </View>
              {/* #2: Both switches now read/write live context state */}
              <Switch 
                value={soundEnabled} 
                onValueChange={(v) => { setSoundEnabled(v); }}
                trackColor={{ false: '#334155', true: Colors.primary }}
                thumbColor={Colors.white}
              />
          </View>
          
          <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Haptics</Text>
                <Text style={styles.settingDesc}>Vibrate on interactions</Text>
              </View>
              <Switch 
                value={hapticsEnabled} 
                onValueChange={(v) => { setHapticsEnabled(v); }}
                trackColor={{ false: '#334155', true: Colors.primary }}
                thumbColor={Colors.white}
              />
          </View>
      </BottomModal>

    </View>
  );
}



// Reusable Components
const MenuOption = ({ icon, label, onPress, isLast, count, textColor }: any) => (
  <TouchableOpacity style={[styles.menuItem, isLast && { borderBottomWidth: 0 }]} onPress={onPress}>
    <View style={styles.menuLeft}>
      {icon}
      <Text style={[styles.menuText, textColor && { color: textColor }]}>{label}</Text>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {count !== undefined && <Text style={{ color: Colors.textMuted }}>{count}</Text>}
        <ChevronRight color="#334155" size={20} />
    </View>
  </TouchableOpacity>
);

const BottomModal = ({ visible, onClose, title, children }: any) => (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={{ padding: 5 }}>
                        <X size={24} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                {children}
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  headerRow: { paddingHorizontal: 20, marginBottom: 10, marginTop: 10 },
  backBtn: { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  headerTop: { flexDirection: 'row', justifyContent: 'flex-end', padding: 20, marginTop: 20 },
  profileSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 15 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#334155' },
  userName: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  userNameInput: { color: '#FFF', fontSize: 22, fontWeight: 'bold', minWidth: 100, borderBottomWidth: 1, borderColor: Colors.primary, paddingVertical: 0 },
  
  menuContainer: { backgroundColor: '#1E293B', marginHorizontal: 20, borderRadius: 20, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#334155' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { color: '#FFF', fontSize: 16, marginLeft: 15 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0F1523', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 50 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  modalItemText: { color: '#FFF', fontSize: 16 },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  
  actionBtn: { flexDirection: 'row',  alignItems: 'center', gap: 5, backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  actionBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },

  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  settingLabel: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  settingDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },

  // Avatar Styles
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: Colors.primary, padding: 5, borderRadius: 12, borderWidth: 2, borderColor: '#0F172A' },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 20, paddingTop: 10 },
  avatarOption: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#0F1523', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  sectionTitle: { color: Colors.textSecondary, fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10, marginTop: 5 },
});