import React from 'react';
import { View, Text, TextInput, Modal, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { AVAILABLE_ICONS } from '../../constants/Icons';

interface AddHabitModalProps {
    visible: boolean;
    onClose: () => void;
    onAdd: () => void;
    newTaskTitle: string;
    setNewTaskTitle: (val: string) => void;
    newHabitIcon: string;
    setNewHabitIcon: (val: string) => void;
    bottomInset: number;
}

export const AddHabitModal = ({
    visible,
    onClose,
    onAdd,
    newTaskTitle,
    setNewTaskTitle,
    newHabitIcon,
    setNewHabitIcon,
    bottomInset
}: AddHabitModalProps) => {

    return (
        <Modal visible={visible} transparent={true} animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: 40 + bottomInset }]}>
                <Text style={styles.modalTitle}>New Routine</Text>
                <TextInput
                style={styles.input}
                placeholder="Task Name"
                placeholderTextColor={Colors.textMuted}
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
                autoFocus
                />
                
                <Text style={styles.label}>Choose Icon</Text>
                <View style={styles.iconPicker}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {AVAILABLE_ICONS.map((item) => {
                        const Icon = item.component;
                        const isSelected = newHabitIcon === item.name;
                        return (
                            <Pressable 
                                key={item.name} 
                                onPress={() => setNewHabitIcon(item.name)} 
                                style={[styles.iconOption, isSelected && styles.selectedIconOption]}
                            >
                                <Icon size={24} color={isSelected ? Colors.primary : Colors.textSecondary} />
                            </Pressable>
                        );
                    })}
                </ScrollView>
                </View>

                <View style={styles.modalButtons}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                    <Text style={{color: Colors.textSecondary}}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.addBtn} onPress={onAdd}>
                    <Text style={{color: Colors.background, fontWeight: 'bold'}}>Add Task</Text>
                </Pressable>
                </View>
            </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.8)', justifyContent: 'flex-end', alignItems: 'center' }, 
  modalContent: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30, width: '100%' },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { backgroundColor: Colors.background, color: Colors.text, padding: 15, borderRadius: 12, fontSize: 16, marginBottom: 20 },
  label: { color: Colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 15 },
  cancelBtn: { padding: 15 },
  addBtn: { backgroundColor: Colors.white, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 12 },
  iconPicker: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, flexWrap: 'wrap' },
  iconOption: { padding: 10, borderRadius: 10, backgroundColor: Colors.background, marginBottom: 10 },
  selectedIconOption: { borderWidth: 2, borderColor: Colors.primary },
});
