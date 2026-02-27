import React from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { useMediaUpload } from '../../context/hooks/useMediaUpload';
import { VideoItem, MEDIA_ITEM_SIZE } from './MediaItems';

interface NoteEditorProps {
    editorTitle: string;
    setEditorTitle: (val: string) => void;
    editorContent: string;
    setEditorContent: (val: string) => void;
    editorType: string;
    // LOW #16: Human-readable label instead of raw folder ID
    typeLabel?: string;
    activeNote: any;
    addNoteMedia: (noteId: string, mediaItem: { url: string; type: 'image' | 'video'; uploadedBy: string; uploadedAt: string }) => void;
    userName: string;
}

export const NoteEditor = ({
    editorTitle,
    setEditorTitle,
    editorContent,
    setEditorContent,
    editorType,
    typeLabel,
    activeNote,
    addNoteMedia,
    userName
}: NoteEditorProps) => {
    const { uploading, uploadMedia } = useMediaUpload();
    const media = activeNote?.media || [];

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow media library access to upload files.');
            return false;
        }
        return true;
    };

    const handlePickImage = async () => {
        if (!(await requestPermission())) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
        });
        if (!result.canceled && result.assets[0]) {
            await handleUpload(result.assets[0].uri, 'image');
        }
    };

    const handlePickVideo = async () => {
        if (!(await requestPermission())) return;
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            quality: 0.8,
            allowsEditing: false,
            videoMaxDuration: 120,
        });
        if (!result.canceled && result.assets[0]) {
            await handleUpload(result.assets[0].uri, 'video');
        }
    };

    const handleUpload = async (uri: string, type: 'image' | 'video') => {
        const downloadUrl = await uploadMedia(uri, type, activeNote.id);
        if (downloadUrl) {
            addNoteMedia(activeNote.id, {
                url: downloadUrl,
                type,
                uploadedBy: userName || 'You',
                uploadedAt: new Date().toISOString(),
            });
        } else {
            Alert.alert('Upload failed', 'Could not upload the file. Please try again.');
        }
    };

    return (
        <ScrollView
            style={styles.canvas}
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >

            <TextInput
            style={styles.canvasTitle}
            placeholder="Untitled"
            placeholderTextColor={Colors.textMuted}
            value={editorTitle}
            onChangeText={setEditorTitle}
            multiline
            />

            {/* Metadata Tags */}
            <View style={styles.tagsContainer}>
            <View style={styles.tag}>
                {/* LOW #16: Show human-readable label, fallback to editorType if no label */}
                <Text style={styles.tagText}>#{typeLabel || editorType}</Text>
            </View>
            <View style={styles.tag}>
                <Text style={styles.tagText}>
                Created {new Date(activeNote?.date || Date.now()).toLocaleDateString()}
                </Text>
            </View>
            </View>

            <View style={styles.canvasSeparator} />

            <TextInput
            style={styles.canvasContent}
            placeholder="Type something..."
            placeholderTextColor={Colors.textMuted}
            value={editorContent}
            onChangeText={setEditorContent}
            multiline
            textAlignVertical="top"
            />

            {/* Media Block */}
            <View style={styles.mediaBlock}>
                <View style={styles.mediaHeader}>
                    <Text style={styles.mediaLabel}>Media ({media.length})</Text>
                    {uploading && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>
                
                <View style={styles.mediaRow}>
                    <TouchableOpacity 
                        style={[styles.mediaBtn, uploading && { opacity: 0.5 }]} 
                        onPress={handlePickImage}
                        disabled={uploading}
                    >
                        <ImageIcon color={Colors.primary} size={20} />
                        <Text style={styles.mediaBtnText}>Add Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.mediaBtn, uploading && { opacity: 0.5 }]} 
                        onPress={handlePickVideo}
                        disabled={uploading}
                    >
                        <VideoIcon color={Colors.primary} size={20} />
                        <Text style={styles.mediaBtnText}>Add Video</Text>
                    </TouchableOpacity>
                </View>

                {/* MEDIA GRID */}
                {media.length > 0 && (
                    <View style={styles.mediaGrid}>
                        {media.map((item: any, idx: number) => (
                            <Animated.View 
                                key={idx} 
                                style={styles.mediaWrapper}
                                entering={FadeIn.delay(idx * 100).duration(400).springify()}
                            >
                                <TouchableOpacity activeOpacity={0.9}>
                                    {item.type === 'image' ? (
                                        <Image
                                            source={{ uri: item.url }}
                                            style={styles.mediaItem}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <VideoItem url={item.url} />
                                    )}
                                </TouchableOpacity>
                                <View style={styles.mediaFooter}>
                                    <Text style={styles.mediaUploadedBy} numberOfLines={1}>
                                         {item.uploadedBy}
                                    </Text>
                                    <Text style={styles.mediaTime}>
                                        {new Date(item.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </Animated.View>
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
  canvas: { flex: 1, paddingHorizontal: 25 },
  coverPlaceholder: { height: 150, backgroundColor: '#1E293B', borderRadius: 12, marginBottom: 20, opacity: 0.5 },
  canvasTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  tagsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: Colors.textSecondary, fontSize: 12 },
  canvasSeparator: { height: 1, backgroundColor: '#1E293B', marginBottom: 20 },
  canvasContent: { fontSize: 16, color: Colors.text, lineHeight: 24, minHeight: 200 },
  
  // Media Block
  mediaBlock: { marginTop: 30, padding: 20, backgroundColor: '#1E293B', borderRadius: 12, marginBottom: 40 },
  mediaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  mediaLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  mediaRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, flex: 1, justifyContent: 'center' },
  mediaBtnText: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  
  // Media Grid
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 10 },
  mediaWrapper: { width: MEDIA_ITEM_SIZE },
  mediaItem: { width: MEDIA_ITEM_SIZE, height: MEDIA_ITEM_SIZE, borderRadius: 10, backgroundColor: '#0F172A' },
  mediaFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 2 },
  mediaUploadedBy: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1 },
  mediaTime: { color: Colors.textMuted, fontSize: 10 },
});
