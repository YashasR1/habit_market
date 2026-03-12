import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { Colors } from '../../../constants/Colors';

interface FolderModalProps {
    isVisible: boolean;
    onClose: () => void;
    targetSection: 'library' | 'assign';
    newFolderName: string;
    setNewFolderName: (val: string) => void;
    newFolderAssignee: string;
    setNewFolderAssignee: (val: string) => void;
    onAddFolder: () => void;
    isEditing?: boolean;
}

export const FolderModal = ({
    isVisible,
    onClose,
    targetSection,
    newFolderName,
    setNewFolderName,
    newFolderAssignee,
    setNewFolderAssignee,
    onAddFolder,
    isEditing
}: FolderModalProps) => {
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{isEditing ? 'Edit Folder' : `New ${targetSection === 'library' ? 'Folder' : 'Assign Group'}`}</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Name" 
                        placeholderTextColor={Colors.textMuted}
                        value={newFolderName}
                        onChangeText={setNewFolderName}
                        autoFocus
                    />
                    {targetSection === 'assign' && (
                        <TextInput 
                            style={styles.input} 
                            placeholder="Assign To (Username)" 
                            placeholderTextColor={Colors.textMuted}
                            value={newFolderAssignee}
                            onChangeText={setNewFolderAssignee}
                            autoCapitalize="none"
                        />
                    )}
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.createBtn}
                            onPress={onAddFolder}
                        >
                            <Text style={styles.createBtnText}>{isEditing ? 'Save' : 'Create'}</Text>
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
