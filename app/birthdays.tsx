import React, { useState, useEffect } from 'react';
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
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Plus, Cake, CalendarClock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { Colors } from '../constants/Colors';
import { useBirthdays } from './hooks/useBirthdays';
import { scheduleBirthdayNotification, cancelBirthdayNotification } from '../services/notificationService';

export default function BirthdaysScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { birthdays, fetchBirthdays, addBirthday, deleteBirthday } = useBirthdays();

  // Initialization
  useEffect(() => {
    fetchBirthdays();
  }, [fetchBirthdays]);

  // Modal State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDate, setNewDate] = useState(''); // Simple format constraint (YYYY-MM-DD)
  const [newInfo, setNewInfo] = useState('');

  const handleAddBirthday = async () => {
    // Validate date format YYYY-MM-DD roughly
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!newName.trim() || !newDate.trim() || !dateRegex.test(newDate)) {
        Alert.alert("Invalid Input", "Please enter a valid name and date (YYYY-MM-DD).");
        return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const id = await addBirthday(newName.trim(), newDate.trim(), newInfo.trim());
    
    if (id && Platform.OS !== 'web') {
        await scheduleBirthdayNotification(id, newName.trim(), newDate.trim());
    }
    
    setNewName('');
    setNewDate('');
    setNewInfo('');
    setIsModalVisible(false);
  };

  const handleDeleteBirthday = (id: string, name: string) => {
      Alert.alert(
          "Delete Birthday",
          `Are you sure you want to delete ${name}?`,
          [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  await deleteBirthday(id);
                  await cancelBirthdayNotification(id);
              }}
          ]
      )
  };

  const renderBirthdayItem = ({ item }: { item: any }) => {
      // Calculate next birthday date logic 
      const [, month, day] = item.date.split('-').map(Number);
      const today = new Date();
      let nextBday = new Date(today.getFullYear(), month - 1, day);
      if (today.getTime() > nextBday.getTime()) {
          nextBday.setFullYear(today.getFullYear() + 1);
      }
      
      const diffTime = Math.abs(nextBday.getTime() - today.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
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
              <Text style={styles.cardDate}>{item.date}</Text>
              
              <View style={styles.countdownRow}>
                  <CalendarClock color={Colors.textSecondary} size={14} />
                  <Text style={styles.countdownText}>
                      {diffDays === 0 ? "Today!" : `${diffDays} days away`}
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Birthdays</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      {/* List */}
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

      {/* FAB */}
      <TouchableOpacity 
          style={[styles.fab, { bottom: insets.bottom + 20 }]} 
          onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsModalVisible(true);
          }}
      >
          <Plus color={Colors.white} size={28} />
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
      >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}
          >
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Add Birthday</Text>
                  
                  <TextInput
                    style={styles.input}
                    placeholder="Person's Name"
                    placeholderTextColor={Colors.textSecondary}
                    value={newName}
                    onChangeText={setNewName}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Date (YYYY-MM-DD)"
                    placeholderTextColor={Colors.textSecondary}
                    value={newDate}
                    onChangeText={setNewDate}
                    keyboardType="numeric"
                  />
                  <Text style={styles.hintText}>Example: 1995-12-25</Text>

                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Gift ideas, favorites, etc. (Optional)"
                    placeholderTextColor={Colors.textSecondary}
                    value={newInfo}
                    onChangeText={setNewInfo}
                    multiline
                  />

                  <View style={styles.modalActions}>
                    <TouchableOpacity 
                        style={[styles.btn, styles.cancelBtn]} 
                        onPress={() => setIsModalVisible(false)}
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.btn, styles.saveBtn]} 
                        onPress={handleAddBirthday}
                    >
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>    

    </View>
  );
}

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
  listContent: { padding: 20, paddingBottom: 100 },
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
  countdownText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
  infoWrapper: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
  },
  cardInfo: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 30 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  emptySubtitle: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
  },
  modalContent: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: {
      backgroundColor: Colors.background,
      color: Colors.text,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 12,
      padding: 15,
      fontSize: 16,
      marginBottom: 8,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  hintText: { color: Colors.textSecondary, fontSize: 12, marginBottom: 16, marginLeft: 5 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtn: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  saveBtn: { backgroundColor: Colors.primary },
  cancelBtnText: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  saveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
});
