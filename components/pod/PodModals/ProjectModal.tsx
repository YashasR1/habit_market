import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Colors } from '../../../constants/Colors';

interface ProjectModalProps {
    isVisible: boolean;
    onClose: () => void;
    newProjectName: string;
    setNewProjectName: (val: string) => void;
    onAddProject: () => void;
}

export const ProjectModal = ({
    isVisible,
    onClose,
    newProjectName,
    setNewProjectName,
    onAddProject
}: ProjectModalProps) => {
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>New Assignment</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Project Name" 
                        placeholderTextColor={Colors.textMuted}
                        value={newProjectName}
                        onChangeText={setNewProjectName}
                        autoFocus
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.createBtn}
                            onPress={onAddProject}
                        >
                            <Text style={styles.createBtnText}>Create</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    color: Colors.text,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 15, marginTop: 10 },
  createBtn: { backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  createBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});
