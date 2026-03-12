import React, { useRef } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Image as ImageIcon, Video as VideoIcon, Trash2 } from 'lucide-react-native';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
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
    deleteNoteMedia?: (noteId: string, mediaUrl: string) => void;
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
    deleteNoteMedia,
    userName
}: NoteEditorProps) => {
    const media = React.useMemo(() => activeNote?.media || [], [activeNote?.media]);

    // Local loading state just to prevent double taps
    const [isProcessing, setIsProcessing] = React.useState(false);
    
    // Sequential Image Loading State
    const [loadedIndex, setLoadedIndex] = React.useState(0);

    // Auto-advance if current media item is a video
    React.useEffect(() => {
      if (media.length > 0 && loadedIndex < media.length) {
        if (media[loadedIndex].type !== 'image') {
          handleMediaLoadNext();
        }
      }
    }, [loadedIndex, media]);

    const handleMediaLoadNext = () => {
      setLoadedIndex((prev) => prev + 1);
    };

    // Rich Text Editor Ref
    const richText = useRef<RichEditor>(null);

    const requestPermission = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow media library access to upload files.');
            return false;
        }
        return true;
    };

    const handlePickImage = async () => {
        if (Platform.OS === 'web') {
            Alert.alert("Native Feature", "Uploading images is only available in the HabitMarket Mobile App.");
            return;
        }
        if (!(await requestPermission())) return;
        setIsProcessing(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.8,
                allowsEditing: false,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                await handleUpload(result.assets[0].uri, 'image');
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert('Error', 'Something went wrong while selecting the image.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePickVideo = async () => {
        if (Platform.OS === 'web') {
            Alert.alert("Native Feature", "Uploading videos is only available in the HabitMarket Mobile App.");
            return;
        }
        if (!(await requestPermission())) return;
        setIsProcessing(true);
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['videos'],
                quality: 0.8,
                allowsEditing: false,
                videoMaxDuration: 120,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                await handleUpload(result.assets[0].uri, 'video');
            }
        } catch (error) {
            console.error("Error picking video:", error);
            Alert.alert('Error', 'Something went wrong while selecting the video.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUpload = async (uri: string, type: 'image' | 'video') => {
        if (!activeNote?.id) {
            Alert.alert('Hold on!', 'Please save or initialize the note before attaching media.');
            return;
        }

        // Since Library notes are private, we DO NOT upload to Firebase.
        // We just save the local file URI directly to the local SQLite database.
        addNoteMedia(activeNote.id, {
            url: uri,
            type,
            uploadedBy: userName || 'You',
            uploadedAt: new Date().toISOString(),
        });
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
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

            {Platform.OS !== 'web' && (
                <RichToolbar
                editor={richText}
                actions={[
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.heading1,
                    actions.heading2,
                ]}
                iconTint={Colors.textSecondary}
                selectedIconTint={Colors.primary}
                style={styles.richToolbar}
                />
            )}

            <View style={[styles.editorContainer, Platform.OS === 'web' && { padding: 10 }]}>
                {Platform.OS === 'web' ? (
                    <TextInput
                        style={{ flex: 1, minHeight: 300, color: Colors.text, fontSize: 16 }}
                        multiline
                        placeholder="Start typing your note here... (Rich Text disabled in Web Simulation)"
                        placeholderTextColor={Colors.textMuted}
                        value={editorContent.replace(/<[^>]*>?/gm, '')} // Strip HTML for plain text view
                        onChangeText={(text) => setEditorContent(text)}
                    />
                ) : (
                    <RichEditor
                        ref={richText}
                        initialContentHTML={editorContent}
                        onChange={(descriptionText) => {
                            setEditorContent(descriptionText);
                        }}
                        placeholder="Start typing your note here..."
                        editorStyle={{
                            backgroundColor: Colors.background,
                            color: Colors.text,
                            placeholderColor: Colors.textMuted,
                            cssText: `
                                body { font-family: sans-serif; font-size: 16px; margin: 0; padding: 10px 0; }
                                h1 { font-size: 24px; color: ${Colors.primary}; }
                                h2 { font-size: 20px; }
                            `
                        }}
                        useContainer={false} 
                    />
                )}
            </View>

            {/* Media Block */}
            <View style={styles.mediaBlock}>
                <View style={styles.mediaHeader}>
                    <Text style={styles.mediaLabel}>Media ({media.length})</Text>
                    {isProcessing && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>
                
                <View style={styles.mediaRow}>
                    <TouchableOpacity 
                        style={[styles.mediaBtn, isProcessing && { opacity: 0.5 }]} 
                        onPress={handlePickImage}
                        disabled={isProcessing}
                    >
                        <ImageIcon color={Colors.primary} size={20} />
                        <Text style={styles.mediaBtnText}>Add Image</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.mediaBtn, isProcessing && { opacity: 0.5 }]} 
                        onPress={handlePickVideo}
                        disabled={isProcessing}
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
                                key={`${item.url}-${idx}`} 
                                style={styles.mediaWrapper}
                                entering={FadeIn.delay(idx * 100).duration(400).springify()}
                            >
                                <TouchableOpacity activeOpacity={0.9}>
                                    {item.type === 'image' ? (
                                        <View style={styles.mediaItem}>
                                            {idx <= loadedIndex ? (
                                                <Image
                                                    source={{ uri: item.url }}
                                                    style={styles.mediaItemContent}
                                                    resizeMode="cover"
                                                    onLoad={idx === loadedIndex ? handleMediaLoadNext : undefined}
                                                    onError={idx === loadedIndex ? handleMediaLoadNext : undefined}
                                                />
                                            ) : (
                                                <View style={styles.loadingPlaceholder}>
                                                    <ActivityIndicator size="small" color={Colors.primary} />
                                                </View>
                                            )}
                                        </View>
                                    ) : (
                                        <View style={styles.mediaItem}>
                                            <VideoItem url={item.url} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                
                                {deleteNoteMedia && (
                                    <TouchableOpacity 
                                        style={styles.deleteMediaBtn}
                                        onPress={() => {
                                            Alert.alert(
                                                "Delete Media",
                                                "Are you sure you want to remove this?",
                                                [
                                                    { text: "Cancel", style: "cancel" },
                                                    { 
                                                        text: "Delete", 
                                                        style: "destructive",
                                                        onPress: () => deleteNoteMedia(activeNote.id, item.url)
                                                    }
                                                ]
                                            );
                                        }}
                                    >
                                        <Trash2 size={16} color={Colors.error} />
                                    </TouchableOpacity>
                                )}

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
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
  canvas: { flex: 1, paddingHorizontal: 25 },
  coverPlaceholder: { height: 150, backgroundColor: '#1E293B', borderRadius: 12, marginBottom: 20, opacity: 0.5 },
  canvasTitle: { fontSize: 32, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  tagsContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tag: { backgroundColor: '#1E293B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: Colors.textSecondary, fontSize: 12 },
  canvasSeparator: { height: 1, backgroundColor: '#1E293B', marginBottom: 10 },
  richToolbar: { backgroundColor: 'transparent', height: 44, marginBottom: 10 },
  editorContainer: { minHeight: 200, flex: 1 },
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
  mediaWrapper: { width: MEDIA_ITEM_SIZE, position: 'relative' },
  mediaItem: { width: MEDIA_ITEM_SIZE, height: MEDIA_ITEM_SIZE, borderRadius: 10, backgroundColor: '#0F172A', overflow: 'hidden' },
  mediaItemContent: { width: '100%', height: '100%' },
  loadingPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  mediaFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 2 },
  mediaUploadedBy: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600', flex: 1 },
  mediaTime: { color: Colors.textMuted, fontSize: 10 },
  deleteMediaBtn: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.6)',
      padding: 6,
      borderRadius: 15,
      zIndex: 10,
  }
});
