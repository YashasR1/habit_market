import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../../../constants/Colors';

interface DeleteConfirmModalProps {
    isVisible: boolean;
    onClose: () => void;
    title: string;
    description: string;
    onDelete: () => void;
}

export const DeleteConfirmModal = ({
    isVisible,
    onClose,
    title,
    description,
    onDelete
}: DeleteConfirmModalProps) => {
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={{ color: Colors.textSecondary, marginBottom: 20 }}>
                        {description}
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.createBtn, { backgroundColor: Colors.error }]}
                            onPress={onDelete}
                        >
                            <Text style={styles.createBtnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    padding: 20,
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 15, marginTop: 10 },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
