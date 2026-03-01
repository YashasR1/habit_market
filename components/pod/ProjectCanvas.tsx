import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Check,
  CheckSquare,
} from "lucide-react-native";
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Colors } from "../../constants/Colors";
import { useMediaUpload } from "../../context/hooks/useMediaUpload";
import { ProjectChecklist } from "./ProjectChecklist";
import { ProjectMediaGallery } from "./ProjectMediaGallery";
import { useHabits } from "../../context/HabitContext";

interface ProjectCanvasProps {
  activeProject: any;
  updateClientProject: (id: string, name: string, updates: any) => void;
  addProjectMedia: (
    projectId: string,
    projectName: string,
    mediaItem: {
      url: string;
      type: "image" | "video";
      uploadedBy: string;
      uploadedAt: string;
    },
  ) => Promise<void>;
  userName: string;
}

export const ProjectCanvas = ({
  activeProject,
  updateClientProject,
  addProjectMedia,
  userName,
}: ProjectCanvasProps) => {
  const { uploading, uploadMedia } = useMediaUpload();
  const [tempContent, setTempContent] = useState(activeProject.content || "");
  const [tempChecklist, setTempChecklist] = useState<any[]>(activeProject.checklist || []);
  const [isSaving, setIsSaving] = useState(false);
  const media: any[] = activeProject.media || [];
  
  // Rich Text Editor Ref
  const richText = useRef<RichEditor>(null);

  // Sync tempContent when activeProject changes (e.g. switching projects)
  useEffect(() => {
    setTempContent(activeProject.content || "");
    setTempChecklist(activeProject.checklist || []);
  }, [activeProject.id, activeProject.content, activeProject.checklist]);

  // AUTO-RESET SAVING STATE: If activeProject catches up to temp state, we are synced.
  useEffect(() => {
    const isContentSynced = activeProject.content === tempContent;
    const isChecklistSynced = JSON.stringify(activeProject.checklist || []) === JSON.stringify(tempChecklist);
    
    if (isSaving && isContentSynced && isChecklistSynced) {
      setIsSaving(false);
    }
  }, [activeProject.content, activeProject.checklist, isSaving, tempContent, tempChecklist]);


  const lastPressMap = useRef<Record<string, number>>({});

  const handleBoxPress = (id: string) => {
      const now = Date.now();
      const lastPress = lastPressMap.current[id] || 0;
      let newStatus: 'empty' | 'tick' | 'cross' = 'tick';
      if (now - lastPress < 400) {
          newStatus = 'cross';
      } else {
          const currentStatus = tempChecklist.find(it => it.id === id)?.status;
          if (currentStatus === 'tick' || currentStatus === 'cross') {
              newStatus = 'empty';
          } else {
              newStatus = 'tick';
          }
      }
      lastPressMap.current[id] = now;
      setTempChecklist(tempChecklist.map(it => it.id === id ? { ...it, status: newStatus } : it));
  };

  const updateChecklistText = (id: string, text: string) => {
      setTempChecklist(tempChecklist.map(it => it.id === id ? { ...it, text } : it));
  };

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow media library access to upload files.",
      );
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    if (!(await requestPermission())) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Compress image before uploading
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1080 } }], // Resize to max 1080p width
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compress to 70% quality JPEG
        );
        await handleUpload(manipResult.uri, "image");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert('Error', 'Something went wrong while selecting the image.');
    }
  };

  const handlePickVideo = async () => {
    if (!(await requestPermission())) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.8,
        allowsEditing: false,
        videoMaxDuration: 120,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleUpload(result.assets[0].uri, "video");
      }
    } catch (error) {
       console.error("Error picking video:", error);
       Alert.alert('Error', 'Something went wrong while selecting the video.');
    }
  };

  const [isSavingLocally, setIsSavingLocally] = useState(false);

  // Auto-save debouncing for content changes
  useEffect(() => {
    setIsSavingLocally(true);
    const timeoutId = setTimeout(() => {
       updateClientProject(activeProject.id, activeProject.name, {
         content: tempContent,
         checklist: tempChecklist,
       });
       setIsSavingLocally(false);
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [tempContent, tempChecklist, activeProject.id, activeProject.name, updateClientProject]);

  // Read network state from context
  const { isOnline, isSyncing } = useHabits();

  const handleUpload = async (uri: string, type: "image" | "video") => {
    const url = await uploadMedia(uri, type, activeProject.id);
    if (url) {
      await addProjectMedia(activeProject.id, activeProject.name, {
        url,
        type,
        uploadedBy: userName || "You",
        uploadedAt: new Date().toISOString(),
      });
      // Update last edited metadata to refresh home screen widget
      updateClientProject(activeProject.id, activeProject.name, {
        lastEditedBy: userName || "You",
        lastEditedAt: new Date().toISOString(),
      });
    } else {
      Alert.alert(
        "Upload failed",
        "Could not upload the file. Please try again.",
      );
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
    <View style={{ flex: 1 }}>
      {/* STICKY HEADER ACTIONS */}
      <View style={[styles.stickyHeader, { top: 0 }]}>
        {!isOnline ? (
          <View style={[styles.savedBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
             <Check size={14} color={Colors.error} />
             <Text style={[styles.savedBadgeText, { color: Colors.error }]}>Offline (Saving Locally)</Text>
          </View>
        ) : isSyncing || isSavingLocally ? (
          <View style={[styles.savedBadge, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
             <ActivityIndicator size="small" color={Colors.primary} />
             <Text style={[styles.savedBadgeText, { color: Colors.primary }]}>Syncing...</Text>
          </View>
        ) : (
          <View style={styles.savedBadge}>
            <Check size={14} color={Colors.success} />
            <Text style={styles.savedBadgeText}>Synced to Cloud</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.canvas}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TextInput
            style={[styles.canvasTitle, { flex: 1 }]}
            value={activeProject.name}
            editable={false}
            multiline
          />
        </View>

        <View style={styles.tagsContainer}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>#project</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Shared Canvas</Text>
          </View>
        </View>

        {/* PRIMARY ACTIONS (PREVIOUSLY HIDDEN AT BOTTOM) */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, uploading && { opacity: 0.5 }]}
            onPress={handlePickImage}
            disabled={uploading}
          >
            <ImageIcon size={18} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Add Image</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, uploading && { opacity: 0.5 }]}
            onPress={handlePickVideo}
            disabled={uploading}
          >
            <VideoIcon size={18} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Add Video</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => setTempChecklist([...tempChecklist, { id: Date.now().toString(), text: '', status: 'empty' }])}
          >
            <CheckSquare size={18} color={Colors.primary} />
            <Text style={styles.actionBtnText}>Add Checkbox</Text>
          </TouchableOpacity>
          {uploading && (
            <ActivityIndicator size="small" color={Colors.primary} />
          )}
        </View>

        {/* LAST EDITED TIMESTAMP (Moved higher) */}
        {activeProject.lastEditedAt && (
          <Text style={styles.lastEditedText}>
            Last edited by {activeProject.lastEditedBy || "Unknown"} •{" "}
            {new Date(activeProject.lastEditedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}

        <View style={styles.canvasSeparator} />

        {/* CHECKLIST SECTION */}
        <ProjectChecklist 
            tempChecklist={tempChecklist}
            handleBoxPress={handleBoxPress}
            updateChecklistText={updateChecklistText}
            setTempChecklist={setTempChecklist}
        />

        {/* RICH TEXT TOOLBAR */}
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

        {/* TEXT CONTENT */}
        <View style={styles.editorContainer}>
            <RichEditor
                ref={richText}
                initialContentHTML={tempContent}
                onChange={(descriptionText) => {
                    setTempContent(descriptionText);
                }}
                placeholder="Write project specs, notes, or ideas here..."
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
        </View>

        {/* MEDIA SECTION */}
        <ProjectMediaGallery media={media} />
      </ScrollView>
    </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  canvas: { flex: 1, paddingHorizontal: 25 },
  coverPlaceholder: {
    height: 150,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    marginBottom: 20,
    opacity: 0.5,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  canvasTitle: { fontSize: 32, fontWeight: "bold", color: Colors.text },
  tagsContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#1E293B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: { color: Colors.textSecondary, fontSize: 12 },
  canvasSeparator: {
    height: 1,
    backgroundColor: "#1E293B",
    marginVertical: 20,
  },
  richToolbar: { backgroundColor: 'transparent', height: 44, marginBottom: 10 },
  editorContainer: { minHeight: 300, flex: 1 },
  canvasContent: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 300,
  },
  lastEditedText: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 20,
    fontStyle: "italic",
  },

  topActionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 5,
    alignItems: "center",
    flexWrap: "wrap",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
  },
  actionBtnText: { color: Colors.text, fontSize: 13, fontWeight: "600" },

  // Header Actions
  stickyHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 25,
    paddingVertical: 10,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: { color: "#FFF", fontSize: 13, fontWeight: "bold" },
  savedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(74, 222, 128, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  savedBadgeText: { color: Colors.success, fontSize: 12, fontWeight: "600" }
});
