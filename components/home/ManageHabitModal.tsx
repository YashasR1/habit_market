import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ManageHabitModalProps {
    habitId: string | null;
    onClose: () => void;
    onPause: (id: string) => void;
    onArchive: (id: string) => void;
    onDelete: () => void;
}

export const ManageHabitModal = ({
    habitId,
    onClose,
    onPause,
    onArchive,
    onDelete
}: ManageHabitModalProps) => {

    return (
        <Modal visible={!!habitId} transparent={true} animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.deleteModalContent}>
                    <Text style={styles.deleteTitle}>Manage Habit</Text>
                    <Text style={styles.deleteMessage}>What would you like to do with this habit?</Text>
                    
                    <View style={{ width: '100%', gap: 10 }}>
                        <TouchableOpacity 
                            style={[styles.deleteBtnCancel, { backgroundColor: '#334155' }]} 
                            onPress={() => {
                                if (habitId) {
                                    onPause(habitId);
                                    onClose();
                                }
                            }}
                        >
                            <Text style={styles.deleteBtnTextCancel}>Pause (Take a break)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.deleteBtnCancel, { backgroundColor: '#334155' }]} 
                            onPress={() => {
                                if (habitId) {
                                    onArchive(habitId);
                                    onClose();
                                }
                            }}
                        >
                            <Text style={styles.deleteBtnTextCancel}>Archive (Hide it)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.deleteBtnConfirm, { marginTop: 10 }]} 
                            onPress={() => { onDelete(); onClose(); }}
                        >
                            <Text style={styles.deleteBtnTextConfirm}>Delete Permanently</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={onClose}>
                        <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  deleteModalContent: { backgroundColor: Colors.surface, padding: 24, borderRadius: 20, width: '80%', alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  deleteTitle: { color: Colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  deleteMessage: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 25 },
  deleteBtnCancel: { width: '100%', padding: 15, borderRadius: 12, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  deleteBtnConfirm: { width: '100%', padding: 15, borderRadius: 12, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center' },
  deleteBtnTextCancel: { color: Colors.text, fontWeight: '600', fontSize: 16 },
  deleteBtnTextConfirm: { color: '#FFF', fontWeight: '600', fontSize: 16 },
});
