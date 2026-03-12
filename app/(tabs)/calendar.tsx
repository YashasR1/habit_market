import React, { useMemo, useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Platform } from 'react-native';
import { 
    ChevronDown, Plus, X, Check,
    Dumbbell, Monitor, Music, BookOpen, BedDouble, 
    Ban, Flame, Zap, Droplets, Moon, Sun, Coffee,
    FlaskConical, Activity
} from 'lucide-react-native';
import { useHabits } from '../../context/HabitContext';
import { Colors } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import { WebInfoOverlay } from '../../components/web-simulation/WebInfoOverlay';

const COLUMN_WIDTH = 55; // NEW: Fixed width for habit columns
const DATE_COL_WIDTH = 50; // Width for the date column

// Curated list of icons for habits
const AVAILABLE_ICONS = [
    { name: 'Dumbbell', component: Dumbbell },
    { name: 'Monitor', component: Monitor },
    { name: 'Music', component: Music },
    { name: 'BookOpen', component: BookOpen },
    { name: 'BedDouble', component: BedDouble },
    { name: 'Ban', component: Ban },
    { name: 'Flame', component: Flame },
    { name: 'Zap', component: Zap },
    { name: 'Droplets', component: Droplets },
    { name: 'Moon', component: Moon },
    { name: 'Sun', component: Sun },
    { name: 'Coffee', component: Coffee },
    { name: 'FlaskConical', component: FlaskConical },
    { name: 'Activity', component: Activity },
];

export default function CalendarScreen() {
  const { dailyHabits, habitHistory, toggleHistoryHabit, addHabit } = useHabits();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  
  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isMonthPickerVisible, setIsMonthPickerVisible] = useState(false); // NEW
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState('Dumbbell'); // Default icon
  const [showWebInfoOverlay, setShowWebInfoOverlay] = useState(Platform.OS === 'web');

  const scrollViewRef = useRef<ScrollView>(null);
  const ROW_HEIGHT = 52; // 48 height + 4 marginBottom

  // Auto-scroll to today if viewing the current month
  useEffect(() => {
     const today = new Date();
     if (
         selectedMonth.getMonth() === today.getMonth() && 
         selectedMonth.getFullYear() === today.getFullYear()
     ) {
         // Tiny timeout ensures the view has laid out before scrolling
         setTimeout(() => {
             const dayOfMonth = today.getDate();
             // Center it roughly or align to top; we scroll slightly above today
             const scrollPosition = Math.max(0, (dayOfMonth - 2) * ROW_HEIGHT); 
             scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
         }, 100);
     }
  }, [selectedMonth]);

  // Generate days for the selected month
  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  const monthLabel = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleAddHabit = () => {
      if (newHabitTitle.trim()) {
          addHabit(newHabitTitle, newHabitIcon);
          setNewHabitTitle('');
          setNewHabitIcon('Dumbbell');
          setIsModalVisible(false);
      }
  };

  const getIconComponent = (iconName: string, size = 20, color = '#FFF') => {
      const iconDef = AVAILABLE_ICONS.find(i => i.name === iconName);
      if (iconDef) {
          const Icon = iconDef.component;
          return <Icon size={size} color={color} />;
      }
      return <Text style={{ fontSize: size }}>{iconName}</Text>;
  };
  
  // ... (render) ...

  // In headerRow:
  // {getIconComponent(habit.icon, 20, Colors.text)}

  // In Modal:
  // ... (restore picker similar to index.tsx)

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.dateSelector} onPress={() => setIsMonthPickerVisible(true)}>
          <Text style={styles.dateText}>{monthLabel}</Text>
          <ChevronDown color={Colors.textSecondary} size={16} style={{ marginLeft: 5 }} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
             <Plus color={Colors.primary} size={28} />
        </TouchableOpacity>
      </View>

      {/* GRID CONTAINER */}
      <View style={styles.gridContainer}>
          {/* #9: Wrap both header + rows in a horizontal ScrollView so they scroll in sync */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              {/* STICKY HEADER ROW (Habit Icons) */}
              <View style={styles.headerRow}>
                <View style={styles.cornerCell} />
                {dailyHabits.map((habit: any) => (
                  <View key={habit.id} style={styles.columnHeader}>
                     {getIconComponent(habit.icon, 18, Colors.textSecondary)}
                  </View>
                ))}
              </View>

              {/* MAIN GRID BODY */}
              <ScrollView 
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
              >
                {daysInMonth.map((date, index) => {
                  const dateKey = date.toDateString();
                  const dayData = habitHistory[dateKey] || {};
                  const dayNum = date.getDate().toString().padStart(2, '0');
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                  const isToday = dateKey === new Date().toDateString();

                  return (
                    <View key={dateKey} style={[styles.row, isToday && styles.rowToday]}>
                      {/* DATE COLUMN */}
                      <View style={styles.dateCell}>
                        <Text style={[styles.dayNum, isToday && { color: Colors.primary }]}>{dayNum}</Text>
                        <Text style={styles.dayName}>{dayName}</Text>
                      </View>

                      {/* HABIT COLUMNS */}
                      {dailyHabits.map((habit: any) => {
                        const isCompleted = dayData[habit.id] === true;
                        return (
                          <TouchableOpacity 
                            key={habit.id} 
                            style={[
                              styles.gridCell,
                              isCompleted ? styles.cellActive : styles.cellInactive
                            ]}
                            onPress={() => toggleHistoryHabit(dateKey, habit.id)}
                            activeOpacity={0.7}
                          >
                             {isCompleted && <Check size={14} color={Colors.white} strokeWidth={4} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
                <View style={{height: 100}} /> 
              </ScrollView>
            </View>
          </ScrollView>
      </View>


      {/* MONTH PICKER MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMonthPickerVisible}
        onRequestClose={() => setIsMonthPickerVisible(false)}
      >
         <BlurView intensity={20} tint="dark" style={styles.modalOverlay}>
            <View style={[styles.modalContent, { minHeight: 'auto' }]}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Select Month ({new Date().getFullYear()})</Text>
                    <TouchableOpacity onPress={() => setIsMonthPickerVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.monthGrid}>
                    {Array.from({ length: 12 }).map((_, index) => {
                        const date = new Date(new Date().getFullYear(), index, 1);
                        const mName = date.toLocaleString('default', { month: 'short' });
                        const isSelected = selectedMonth.getMonth() === index;
                        
                        return (
                            <TouchableOpacity 
                                key={index} 
                                style={[styles.monthItem, isSelected && styles.monthItemSelected]}
                                onPress={() => {
                                    setSelectedMonth(date);
                                    setIsMonthPickerVisible(false);
                                }}
                            >
                                <Text style={[styles.monthItemText, isSelected && styles.monthItemTextSelected]}>
                                    {mName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
         </BlurView>
      </Modal>

      {/* ADD HABIT MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <BlurView intensity={30} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>New Habit</Text>
                    <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.label}>Name</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="e.g. Read 10 pages" 
                    placeholderTextColor={Colors.textMuted}
                    value={newHabitTitle}
                    onChangeText={setNewHabitTitle}
                />
                
                <Text style={styles.label}>Choose Icon</Text>
                <View style={{ height: 60, marginTop: 10 }}>
                     <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {AVAILABLE_ICONS.map((item) => {
                             const Icon = item.component;
                             const isSelected = newHabitIcon === item.name;
                             return (
                                 <TouchableOpacity 
                                    key={item.name} 
                                    onPress={() => setNewHabitIcon(item.name)}
                                    style={[
                                        styles.iconOption,
                                        isSelected && styles.iconOptionSelected
                                    ]}
                                 >
                                    <Icon size={24} color={isSelected ? '#FFF' : Colors.textSecondary} />
                                 </TouchableOpacity>
                             )
                        })}
                     </ScrollView>
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={handleAddHabit}>
                    <Text style={styles.saveButtonText}>Create Habit</Text>
                </TouchableOpacity>
            </View>
        </BlurView>
      </Modal>

      {/* WEB SIMULATION: INFO MODAL (SCHEDULE TAB) */}
      <WebInfoOverlay 
          isVisible={showWebInfoOverlay}
          onClose={() => setShowWebInfoOverlay(false)}
          title="Schedule Assistant"
          introHighlightText="Schedule"
          introRestText="tab turns your habits into actionable timelines using integrated device calendars and local push notifications."
          features={[
              {
                  title: "Smart Reminders",
                  description: "Schedule specific times for habits and receive rich push notifications directly on your mobile device lock screen.",
                  icon: "arrow"
              }
          ]}
          nativeDisclaimerDesc="Because this feature mandates background execution tasks and native calendar synchronisation, it is uniquely built for the HabitMarket Mobile App!"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 50 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 20 
  },
  dateSelector: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.surface, 
    paddingVertical: 8, 
    paddingHorizontal: 15, 
    borderRadius: 8 
  },
  dateText: { color: Colors.text, fontWeight: 'bold' },
  
  gridContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', marginBottom: 15, paddingLeft: 20 },
  cornerCell: { width: DATE_COL_WIDTH, marginRight: 15 },
  columnHeader: { width: COLUMN_WIDTH, alignItems: 'center', justifyContent: 'center' },
  headerIcon: { fontSize: 20 }, // Fallback size for text emojis

  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, height: 48, paddingLeft: 20 },
  rowToday: { backgroundColor: 'rgba(129, 140, 248, 0.08)' },
  dateCell: { 
    width: DATE_COL_WIDTH, 
    marginRight: 15, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)'
  },
  dayNum: { color: Colors.text, fontWeight: 'bold', fontSize: 13 },
  dayName: { color: Colors.textSecondary, fontSize: 8, fontWeight: 'bold', marginTop: 1 },
  
  gridCell: { 
    width: COLUMN_WIDTH - 10, // Leave some room for gap
    height: '80%', 
    marginHorizontal: 5, 
    borderRadius: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  cellActive: { backgroundColor: Colors.primary },
  cellInactive: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.surface, padding: 30, borderTopLeftRadius: 25, borderTopRightRadius: 25, minHeight: 400 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold' },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: Colors.background, color: Colors.text, padding: 15, borderRadius: 12, fontSize: 16 },
  // ... inside Modal styles
  saveButton: { backgroundColor: Colors.primary, padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  // Icon Selector
  iconOption: {
      width: 50,
      height: 50,
      borderRadius: 12,
      backgroundColor: Colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      borderWidth: 1,
      borderColor: Colors.border
  },
  iconOptionSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary
  },

  // MONTH PICKER STYLES
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
  monthItem: { 
      width: '30%', 
      backgroundColor: Colors.background, 
      paddingVertical: 15, 
      borderRadius: 12, 
      alignItems: 'center', 
      marginBottom: 15,
      borderWidth: 1,
      borderColor: Colors.border
  },
  monthItemSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary
  },
  monthItemText: { color: Colors.textSecondary, fontWeight: '600' },
  monthItemTextSelected: { color: '#FFF', fontWeight: 'bold' },
});