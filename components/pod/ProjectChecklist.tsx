import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Check, X, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface ProjectChecklistProps {
  tempChecklist: any[];
  handleBoxPress: (id: string) => void;
  updateChecklistText: (id: string, text: string) => void;
  setTempChecklist: (newList: any[]) => void;
}

export const ProjectChecklist = ({ tempChecklist, handleBoxPress, updateChecklistText, setTempChecklist }: ProjectChecklistProps) => {
  if (tempChecklist.length === 0) return null;

  return (
    <View style={{ marginBottom: 20 }}>
      {tempChecklist.map((item) => (
        <View key={item.id} style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 15 }}>
          <TouchableOpacity 
              style={{ width: 24, height: 24, borderWidth: 2, borderColor: Colors.border, borderRadius: 4, marginRight: 15, justifyContent: 'center', alignItems: 'center' }}
              activeOpacity={0.7}
              onPress={() => handleBoxPress(item.id)}
          >
              {item.status === 'tick' && <Check size={16} color={Colors.success} strokeWidth={3} />}
              {item.status === 'cross' && <X size={16} color={Colors.error} strokeWidth={3} />}
          </TouchableOpacity>
          <TextInput 
              style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: Colors.border, fontSize: 16, color: Colors.text, paddingBottom: 4 }}
              value={item.text}
              onChangeText={(val) => updateChecklistText(item.id, val)}
              placeholder="Task description..."
              placeholderTextColor={Colors.textMuted}
          />
          <TouchableOpacity 
              style={{ padding: 5, marginLeft: 10 }}
              onPress={() => setTempChecklist(tempChecklist.filter(it => it.id !== item.id))}
          >
              <Trash2 size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
