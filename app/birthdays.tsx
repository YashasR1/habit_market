import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Cake, CalendarClock, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../constants/Colors';
import { useBirthdays } from '../hooks/useBirthdays';
import { scheduleBirthdayNotification, cancelBirthdayNotification } from '../services/notificationService';

// ─── Date Picker Data ─────────────────────────────────────────────────────────
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const CURRENT_YEAR = new Date().getFullYear();
// Only current and previous year — if you forgot to add someone, they can still get
// a reminder next year. Both values update automatically as years advance.
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1];

const PICKER_ITEM_H = 48;
const VISIBLE_ITEMS = 5;

// ─── Scroll-Wheel Picker Column ───────────────────────────────────────────────
function PickerColumn<T extends string | number>({
  items,
  selected,
  onSelect,
  formatItem,
}: {
  items: T[];
  selected: T;
  onSelect: (v: T) => void;
  formatItem?: (v: T) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const selectedIdx = items.indexOf(selected);

  useEffect(() => {
    if (scrollRef.current && selectedIdx >= 0) {
      scrollRef.current.scrollTo({
        y: selectedIdx * PICKER_ITEM_H,
        animated: false,
      });
    }
  }, [selectedIdx]);

  const handleScroll = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / PICKER_ITEM_H);
    if (idx >= 0 && idx < items.length && items[idx] !== selected) {
      onSelect(items[idx]);
    }
  };

  return (
    <View style={pickerStyles.column}>
      {/* Highlight strip */}
      <View pointerEvents="none" style={pickerStyles.highlight} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={PICKER_ITEM_H}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        contentContainerStyle={{ paddingVertical: PICKER_ITEM_H * 2 }}
        style={{ height: PICKER_ITEM_H * VISIBLE_ITEMS }}
      >
        {items.map((item, idx) => {
          const isSelected = idx === selectedIdx;
          return (
            <TouchableOpacity
              key={String(item)}
              style={pickerStyles.item}
              onPress={() => {
                onSelect(item);
                scrollRef.current?.scrollTo({ y: idx * PICKER_ITEM_H, animated: true });
              }}
              activeOpacity={0.7}
            >
              <Text style={[pickerStyles.itemText, isSelected && pickerStyles.itemTextSelected]}>
                {formatItem ? formatItem(item) : String(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BirthdaysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { birthdays, fetchBirthdays, addBirthday, deleteBirthday } = useBirthdays();

  useEffect(() => { fetchBirthdays(); }, [fetchBirthdays]);

  // ── Add Modal State ──
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newInfo, setNewInfo] = useState('');

  // ── Date Picker State ──
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(0);           // 0-indexed
  const [pickerDay, setPickerDay] = useState(1);
  const [pickerYear, setPickerYear] = useState(CURRENT_YEAR - 25);
  const [dateConfirmed, setDateConfirmed] = useState(false);

  // ── Delete Confirm Modal State ──
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // ── Derived date string ──
  const selectedDate = dateConfirmed
    ? `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-${String(pickerDay).padStart(2, '0')}`
    : '';

  const displayDate = dateConfirmed
    ? `${MONTHS[pickerMonth]} ${pickerDay}, ${pickerYear}`
    : '';

  const openAddModal = () => {
    setNewName('');
    setNewInfo('');
    setDateConfirmed(false);
    setPickerMonth(new Date().getMonth());
    setPickerDay(new Date().getDate());
    setPickerYear(CURRENT_YEAR);
    setIsAddModalVisible(true);
  };

  const handleAddBirthday = async () => {
    if (!newName.trim() || !dateConfirmed) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = await addBirthday(newName.trim(), selectedDate, newInfo.trim());

    if (id && Platform.OS !== 'web') {
      await scheduleBirthdayNotification(id, newName.trim(), selectedDate);
    }

    setIsAddModalVisible(false);
  };

  const handleDeleteBirthday = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDeleteTarget({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await deleteBirthday(deleteTarget.id);
    await cancelBirthdayNotification(deleteTarget.id);
    setDeleteTarget(null);
  };

  const renderBirthdayItem = ({ item }: { item: any }) => {
    const [, month, day] = item.date.split('-').map(Number);
    const today = new Date();
    let nextBday = new Date(today.getFullYear(), month - 1, day);
    if (today.getTime() > nextBday.getTime()) nextBday.setFullYear(today.getFullYear() + 1);

    const diffMs = nextBday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const isToday = diffDays === 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Cake color={Colors.primary} size={20} />
            <Text style={styles.cardName}>{item.name}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteBirthday(item.id, item.name)} style={styles.deleteBtn}>
            <Trash2 color={Colors.error} size={18} />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardDate}>
          {MONTHS[month - 1]} {day}
        </Text>

        <View style={styles.countdownRow}>
          <CalendarClock color={isToday ? Colors.primary : Colors.textSecondary} size={14} />
          <Text style={[styles.countdownText, isToday && styles.countdownToday]}>
            {isToday ? '🎉 Today!' : `${diffDays} day${diffDays !== 1 ? 's' : ''} away`}
          </Text>
        </View>

        {!!item.info && (
          <View style={styles.infoWrapper}>
            <Text style={styles.cardInfo}>{item.info}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Birthdays</Text>
        <View style={{ width: 34 }} />
      </View>

      {/* ── List ── */}
      <FlatList
        data={birthdays}
        keyExtractor={(item) => item.id}
        renderItem={renderBirthdayItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Cake color={Colors.textSecondary} size={48} style={{ marginBottom: 15 }} opacity={0.5} />
            <Text style={styles.emptyTitle}>No Birthdays Yet</Text>
            <Text style={styles.emptySubtitle}>Add important birthdays to get annual reminders the day before.</Text>
          </View>
        }
      />

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 20 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openAddModal(); }}
      >
        <Plus color={Colors.white} size={28} />
      </TouchableOpacity>

      {/* ════════════════════════════════════════
          ADD BIRTHDAY MODAL
      ════════════════════════════════════════ */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent onRequestClose={() => setIsAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Birthday</Text>

            {/* Name */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Person's name"
              placeholderTextColor={Colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />

            {/* Date */}
            <Text style={styles.fieldLabel}>Birthday</Text>
            <TouchableOpacity
              style={[styles.datePickerBtn, dateConfirmed && styles.datePickerBtnFilled]}
              onPress={() => setIsDatePickerVisible(true)}
            >
              <Calendar color={dateConfirmed ? Colors.primary : Colors.textSecondary} size={18} />
              <Text style={[styles.datePickerText, dateConfirmed && styles.datePickerTextFilled]}>
                {dateConfirmed ? displayDate : 'Select date of birth'}
              </Text>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={styles.fieldLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Gift ideas, favorites…"
              placeholderTextColor={Colors.textSecondary}
              value={newInfo}
              onChangeText={setNewInfo}
              multiline
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.saveBtn, (!newName.trim() || !dateConfirmed) && styles.saveBtnDisabled]}
                onPress={handleAddBirthday}
                disabled={!newName.trim() || !dateConfirmed}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════
          DATE PICKER MODAL
      ════════════════════════════════════════ */}
      <Modal visible={isDatePickerVisible} animationType="fade" transparent onRequestClose={() => setIsDatePickerVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setIsDatePickerVisible(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>Select Birthday</Text>
            <Text style={styles.datePickerSubtitle}>
              {MONTHS[pickerMonth]} {pickerDay}, {pickerYear}
            </Text>

            <View style={styles.pickerRow}>
              {/* Month */}
              <PickerColumn<string>
                items={MONTHS}
                selected={MONTHS[pickerMonth]}
                onSelect={(m) => setPickerMonth(MONTHS.indexOf(m))}
              />
              {/* Day */}
              <PickerColumn<number>
                items={DAYS}
                selected={pickerDay}
                onSelect={setPickerDay}
                formatItem={(d) => String(d).padStart(2, '0')}
              />
              {/* Year */}
              <PickerColumn<number>
                items={YEARS}
                selected={pickerYear}
                onSelect={setPickerYear}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsDatePickerVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.saveBtn]}
                onPress={() => {
                  setDateConfirmed(true);
                  setIsDatePickerVisible(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.saveBtnText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ════════════════════════════════════════
          CUSTOM DELETE CONFIRM MODAL
      ════════════════════════════════════════ */}
      <Modal visible={!!deleteTarget} animationType="fade" transparent onRequestClose={() => setDeleteTarget(null)}>
        <View style={styles.alertOverlay}>
          <View style={styles.alertBox}>
            {/* Icon */}
            <View style={styles.alertIconWrap}>
              <Trash2 color={Colors.error} size={28} />
            </View>
            <Text style={styles.alertTitle}>Delete Birthday</Text>
            <Text style={styles.alertBody}>
              Are you sure you want to delete <Text style={styles.alertName}>{deleteTarget?.name}</Text>?
              {'\n'}This will also cancel the scheduled reminder.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={[styles.alertBtn, styles.alertCancelBtn]} onPress={() => setDeleteTarget(null)}>
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.alertBtn, styles.alertDeleteBtn]} onPress={confirmDelete}>
                <Trash2 color={Colors.white} size={16} />
                <Text style={styles.alertDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Picker Styles ────────────────────────────────────────────────────────────
const pickerStyles = StyleSheet.create({
  column: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: PICKER_ITEM_H * 2,
    left: 4,
    right: 4,
    height: PICKER_ITEM_H,
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: 10,
    zIndex: 0,
  },
  item: {
    height: PICKER_ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '400',
  },
  itemTextSelected: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 5, marginLeft: -5 },
  title: { fontSize: 20, fontWeight: 'bold', color: Colors.text },
  listContent: { padding: 20, paddingBottom: 120 },

  // ── Card ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { color: Colors.text, fontSize: 18, fontWeight: 'bold' },
  deleteBtn: { padding: 4 },
  cardDate: { color: Colors.textSecondary, fontSize: 14, marginBottom: 12 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  countdownText: { color: Colors.textSecondary, fontWeight: '600', fontSize: 13 },
  countdownToday: { color: Colors.primary },
  infoWrapper: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  cardInfo: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // ── Empty ──
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptySubtitle: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  // ── FAB ──
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // ── Shared Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 6 },

  // ── Form ──
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.8, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  optional: { color: Colors.textMuted, fontWeight: '400', textTransform: 'none' },
  input: {
    backgroundColor: Colors.background,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
  },
  textArea: { height: 90, textAlignVertical: 'top', marginTop: 0 },

  // ── Date Picker Trigger ──
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 15,
  },
  datePickerBtnFilled: { borderColor: Colors.primary },
  datePickerText: { color: Colors.textSecondary, fontSize: 16 },
  datePickerTextFilled: { color: Colors.text },

  // ── Date Picker Modal ──
  datePickerModal: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  datePickerSubtitle: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },

  // ── Alert Modal ──
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  alertBox: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  alertIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.errorDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.error + '40',
  },
  alertTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  alertBody: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, fontSize: 14, marginBottom: 24 },
  alertName: { color: Colors.text, fontWeight: '700' },
  alertActions: { flexDirection: 'row', gap: 12, width: '100%' },
  alertBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  alertCancelBtn: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  alertDeleteBtn: { backgroundColor: Colors.error },
  alertCancelText: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  alertDeleteText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },

  // ── Shared Buttons ──
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary },
  saveBtnDisabled: { opacity: 0.4 },
  cancelBtnText: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  saveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
