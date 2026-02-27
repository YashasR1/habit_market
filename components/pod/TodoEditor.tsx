import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X, Plus, CalendarPlus, Trash2 } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface TodoItem {
    id: string;
    text: string;
    status: 'empty' | 'tick' | 'cross';
}

interface TodoData {
    day: string;
    month: string;
    year: string;
    items: TodoItem[];
}

interface TodoEditorProps {
    editorContent: string;
    setEditorContent: (val: string) => void;
}

export const TodoEditor = ({ editorContent, setEditorContent }: TodoEditorProps) => {
    const [daysList, setDaysList] = useState<TodoData[]>([]);
    
    useEffect(() => {
        let parsedData: TodoData[] | TodoData | null = null;
        try {
            if (editorContent) {
                parsedData = JSON.parse(editorContent);
            }
        } catch {
            // ignore parse error
        }

        const todayDate = new Date();
        // Reset time to midnight for accurate day comparisons
        todayDate.setHours(0, 0, 0, 0);

        let initialList: TodoData[] = [];

        if (Array.isArray(parsedData)) {
            initialList = parsedData;
        } else if (parsedData && Array.isArray((parsedData as TodoData).items)) {
            // Migrate old single object structure to array
            initialList = [parsedData as TodoData];
        } else {
            // Default empty state for today
            initialList = [createNewDay(todayDate)];
        }

        // AUTO-DELETE PAST DAYS
        const filteredList = initialList.filter(data => {
            const dayNum = parseInt(data.day, 10);
            const monthNum = parseInt(data.month, 10) - 1; // 0-indexed month
            // Assuming 20xx for year shorthand (e.g. 25 = 2025)
            const yearNum = parseInt(data.year, 10) + 2000;
            
            if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return true; // Keep malformed dates just in case
            
            const itemDate = new Date(yearNum, monthNum, dayNum);
            itemDate.setHours(0, 0, 0, 0);

            // Keep if date is >= today
            return itemDate.getTime() >= todayDate.getTime();
        });

        // Always ensure at least today exists conceptually if list got emptied
        if (filteredList.length === 0) {
            filteredList.push(createNewDay(todayDate));
        }

        setDaysList(filteredList);
        
        // Auto-save if we cleaned up past days
        if (editorContent && filteredList.length !== (Array.isArray(parsedData) ? parsedData.length : 1)) {
            setEditorContent(JSON.stringify(filteredList));
        }
    }, [editorContent, setEditorContent]);

    const createNewDay = (date: Date): TodoData => {
        return {
            day: String(date.getDate()).padStart(2, '0'),
            month: String(date.getMonth() + 1).padStart(2, '0'),
            year: String(date.getFullYear()).slice(-2),
            items: [
                { id: Date.now().toString() + '1', text: '', status: 'empty' },
                { id: Date.now().toString() + '2', text: '', status: 'empty' },
                { id: Date.now().toString() + '3', text: '', status: 'empty' },
            ]
        };
    };

    const save = (newList: TodoData[]) => {
        setDaysList(newList);
        setEditorContent(JSON.stringify(newList));
    };

    const updateDate = (dayIndex: number, field: 'day' | 'month' | 'year', val: string) => {
        const newList = [...daysList];
        newList[dayIndex] = { ...newList[dayIndex], [field]: val };
        save(newList);
    };

    const updateItemText = (dayIndex: number, itemId: string, text: string) => {
        const newList = [...daysList];
        newList[dayIndex] = {
            ...newList[dayIndex],
            items: newList[dayIndex].items.map(it => it.id === itemId ? { ...it, text } : it)
        };
        save(newList);
    };

    const lastPressMap = useRef<Record<string, number>>({});

    const handleBoxPress = (dayIndex: number, itemId: string) => {
        const now = Date.now();
        const lastPress = lastPressMap.current[itemId] || 0;
        
        let newStatus: 'empty' | 'tick' | 'cross' = 'tick';
        
        if (now - lastPress < 400) {
            newStatus = 'cross';
        } else {
            const currentItem = daysList[dayIndex].items.find(it => it.id === itemId);
            if (currentItem?.status === 'tick' || currentItem?.status === 'cross') {
                newStatus = 'empty';
            } else {
                newStatus = 'tick';
            }
        }
        
        lastPressMap.current[itemId] = now;
        
        const newList = [...daysList];
        newList[dayIndex] = {
            ...newList[dayIndex],
            items: newList[dayIndex].items.map(it => it.id === itemId ? { ...it, status: newStatus } : it)
        };
        save(newList);
    };

    const addNewItem = (dayIndex: number) => {
        const newList = [...daysList];
        newList[dayIndex] = {
            ...newList[dayIndex],
            items: [...newList[dayIndex].items, { id: Date.now().toString(), text: '', status: 'empty' }]
        };
        save(newList);
    };

    const addNextDay = () => {
        // Try to figure out the date of the last block to increment it
        let nextDate = new Date();
        if (daysList.length > 0) {
            const lastDay = daysList[daysList.length - 1];
            const d = parseInt(lastDay.day, 10);
            const m = parseInt(lastDay.month, 10) - 1;
            const y = parseInt(lastDay.year, 10) + 2000;
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
                nextDate = new Date(y, m, d + 1);
            }
        } else {
            nextDate.setDate(nextDate.getDate() + 1);
        }
        
        save([...daysList, createNewDay(nextDate)]);
    };

    const deleteDay = (dayIndex: number) => {
        const newList = daysList.filter((_, idx) => idx !== dayIndex);
        save(newList);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
            <View style={styles.paper}>
                
                {daysList.map((data, dayIndex) => (
                    <View key={`day-${dayIndex}`} style={[styles.dayBlock, dayIndex > 0 && styles.dayBlockBorder]}>
                        
                        <View style={styles.dateRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput 
                                    style={styles.dateInputBox}
                                    maxLength={2}
                                    value={data.day}
                                    onChangeText={(val) => updateDate(dayIndex, 'day', val)}
                                    keyboardType="number-pad"
                                    placeholderTextColor={Colors.textMuted}
                                />
                                <Text style={styles.slash}>/</Text>
                                <TextInput 
                                    style={styles.dateInputBox}
                                    maxLength={2}
                                    value={data.month}
                                    onChangeText={(val) => updateDate(dayIndex, 'month', val)}
                                    keyboardType="number-pad"
                                    placeholderTextColor={Colors.textMuted}
                                />
                                <Text style={styles.slash}>/</Text>
                                <TextInput 
                                    style={styles.dateInputBox}
                                    maxLength={2}
                                    value={data.year}
                                    onChangeText={(val) => updateDate(dayIndex, 'year', val)}
                                    keyboardType="number-pad"
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                            
                            {daysList.length > 1 && (
                                <TouchableOpacity onPress={() => deleteDay(dayIndex)} style={{ padding: 8 }}>
                                    <Trash2 size={20} color={Colors.error} opacity={0.7} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {data.items.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                                <TouchableOpacity 
                                    style={styles.checkbox}
                                    activeOpacity={0.7}
                                    onPress={() => handleBoxPress(dayIndex, item.id)}
                                >
                                    {item.status === 'tick' && <Check size={18} color={Colors.success} strokeWidth={3} />}
                                    {item.status === 'cross' && <X size={18} color={Colors.error} strokeWidth={3} />}
                                </TouchableOpacity>
                                <TextInput 
                                    style={styles.textInput}
                                    value={item.text}
                                    onChangeText={(val) => updateItemText(dayIndex, item.id, val)}
                                    placeholderTextColor={Colors.textMuted}
                                />
                            </View>
                        ))}

                        <TouchableOpacity style={styles.addButton} onPress={() => addNewItem(dayIndex)}>
                            <Plus size={20} color={Colors.primary} />
                            <Text style={styles.addText}>Add new line</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                <TouchableOpacity style={styles.addDayButton} onPress={addNextDay}>
                    <CalendarPlus size={20} color={Colors.text} />
                    <Text style={styles.addDayText}>Plan Next Day</Text>
                </TouchableOpacity>

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 25 },
    paper: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 30,
        minHeight: 500,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 50,
    },
    dateInputBox: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.border,
        width: 45,
        textAlign: 'center',
        fontSize: 20,
        color: Colors.text,
        fontWeight: 'bold',
        paddingBottom: 2,
    },
    slash: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.border,
        marginHorizontal: 12,
        transform: [{ rotate: '15deg' }]
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 35,
    },
    checkbox: {
        width: 26,
        height: 38,
        borderWidth: 2.5,
        borderColor: Colors.border,
        marginRight: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'transparent',
    },
    textInput: {
        flex: 1,
        borderBottomWidth: 2,
        borderBottomColor: Colors.border,
        fontSize: 20,
        color: Colors.text,
        fontWeight: '500',
        paddingBottom: 4,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        opacity: 0.8,
        padding: 10,
    },
    addText: {
        color: Colors.primary,
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 16,
    },
    dayBlock: {
        marginBottom: 40,
        paddingBottom: 20,
    },
    dayBlockBorder: {
        borderTopWidth: 2,
        borderTopColor: Colors.border,
        paddingTop: 40,
    },
    addDayButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        marginTop: 10,
        marginBottom: 20,
        opacity: 0.9,
    },
    addDayText: {
        color: Colors.white,
        marginLeft: 10,
        fontWeight: 'bold',
        fontSize: 16,
    }
});
