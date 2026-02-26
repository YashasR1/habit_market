import React, { useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Send, Clock } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface ProjectLogProps {
    activeProject: any;
    logs: any[];
    addProjectLog: (projectId: string, content: string, author: string) => void;
    userName: string;
    logInput: string;
    setLogInput: (val: string) => void;
}

export const ProjectLog = ({ 
    activeProject, 
    logs, 
    addProjectLog, 
    userName, 
    logInput, 
    setLogInput 
}: ProjectLogProps) => {
    const flatListRef = useRef<FlatList>(null);

    const handleSendLog = () => {
        if (logInput.trim() && activeProject) {
            addProjectLog(activeProject.id, logInput.trim(), userName || 'Friend');
            setLogInput('');
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
             <FlatList
                ref={flatListRef}
                data={logs}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                renderItem={({ item }) => (
                    <View style={styles.logItem}>
                        <View style={styles.logHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={[styles.avatarSmall, { backgroundColor: item.author === 'You' ? Colors.primary : '#334155' }]}>
                                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: 'bold' }}>
                                        {item.author.charAt(0)}
                                    </Text>
                                </View>
                                <Text style={styles.logAuthor}>{item.author}</Text>
                            </View>
                            <Text style={styles.logTime}>
                                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                        <Text style={styles.logContent}>{item.content}</Text>
                    </View>
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: 'center', marginTop: 100, opacity: 0.5 }}>
                        <Clock size={40} color={Colors.textSecondary} />
                        <Text style={{ color: Colors.textSecondary, marginTop: 15 }}>No updates yet. Start the log!</Text>
                    </View>
                }
             />
             <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
                 <BlurView intensity={20} tint="dark" style={styles.chatInputContainer}>
                    <TextInput 
                        style={styles.chatInput}
                        placeholder="Add a realtime update..."
                        placeholderTextColor={Colors.textMuted}
                        value={logInput}
                        onChangeText={setLogInput}
                        multiline
                        // LOW #17: Submit on Enter key (tablet/web keyboard)
                        returnKeyType="send"
                        blurOnSubmit={false}
                        onSubmitEditing={handleSendLog}
                    />
                    <TouchableOpacity style={[styles.sendBtn, !logInput.trim() && { opacity: 0.5 }]} onPress={handleSendLog} disabled={!logInput.trim()}>
                        <Send size={18} color="#FFF" />
                    </TouchableOpacity>
                 </BlurView>
             </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
  logItem: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingBottom: 15 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  avatarSmall: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logAuthor: { color: Colors.text, fontSize: 13, fontWeight: 'bold' },
  logTime: { color: Colors.textMuted, fontSize: 11 },
  logContent: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  chatInputContainer: { 
      padding: 15, 
      borderTopWidth: 1, 
      borderTopColor: '#1E293B', 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 10, 
      backgroundColor: 'rgba(15, 23, 42, 0.9)'
  },
  chatInput: { 
      flex: 1, 
      backgroundColor: '#1E293B', 
      borderRadius: 20, 
      paddingHorizontal: 15, 
      paddingVertical: 10, 
      color: Colors.text,
      maxHeight: 100
  },
  sendBtn: { 
      width: 40, 
      height: 40, 
      borderRadius: 20, 
      backgroundColor: Colors.primary, 
      alignItems: 'center', 
      justifyContent: 'center' 
  },
});
