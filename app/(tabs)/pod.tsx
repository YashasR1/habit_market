import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { usePod } from "../../context/PodContext";
import { useHabits } from "../../context/HabitContext";
import { useLocalSearchParams } from 'expo-router';

// Components
import { PodSidebar } from "../../components/pod/PodSidebar";
import { ProjectCanvas } from "../../components/pod/ProjectCanvas";
import { NoteEditor } from "../../components/pod/NoteEditor";
import { TodoEditor } from "../../components/pod/TodoEditor";
import { PodTopBar } from "../../components/pod/PodTopBar";
import { PodModalsManager } from "../../components/pod/PodModalsManager";

// Hooks
import { usePodEditor } from "../hooks/usePodEditor";
import { usePodModals } from "../hooks/usePodModals";

const { width } = Dimensions.get("window");

export default function PodScreen() {
  const insets = useSafeAreaInsets();
  const { notes, addNote, updateNote, deleteNote, folders, addFolder, deleteFolder, clientProjects, addClientProject, deleteClientProject, updateClientProject, addProjectMedia, deleteProjectMedia, addNoteMedia, deleteNoteMedia, fetchFromCloud, updateSharedFolder } = usePod();
  const { userName } = useHabits();
  const params = useLocalSearchParams();

  // Core Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeProject, setActiveProject] = useState<any>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(false);

  // Extracted Hook Behaviors
  const editor = usePodEditor(notes, addNote, updateNote, deleteNote, activeCategory, setActiveCategory, setActiveProject, setIsSidebarOpen, width);
  const modals = usePodModals();

  // Handle Deep Linking / Widget Navigation
  useEffect(() => {
    if (params.projectId && clientProjects.length > 0) {
      const project = clientProjects.find((p: any) => p.id === params.projectId);
      if (project) {
        setActiveProject(project);
        setActiveCategory(`project_${project.id}`);
        if (width >= 768) setIsSidebarOpen(true);
      }
    }
  }, [params.projectId, clientProjects]);

  // Re-sync activeProject
  useEffect(() => {
    if (activeProject?.id) {
      const updated = clientProjects.find((p: any) => p.id === activeProject.id);
      if (updated) setActiveProject(updated);
    }
  }, [clientProjects, activeProject?.id]);

  const toggleSidebar = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* --- SIDEBAR --- */}
      <PodSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeCategory={activeCategory}
        onSelectFolder={(id) => {
          setActiveCategory(id);
          setActiveProject(null);
        }}
        notes={notes}
        folders={folders}
        clientProjects={clientProjects}
        selectedNote={editor.selectedNote}
        handleSelectNote={editor.handleSelectNote}
        activeProject={activeProject}
        handleSelectProject={editor.handleSelectProject}
        handleAddFolder={modals.handleAddFolder}
        handleCreateNew={editor.handleCreateNew}
        handleCreateNewProject={modals.handleCreateNewProject}
        confirmDeleteFolder={(id: string) => modals.confirmDeleteFolder(folders, id)}
        confirmDeleteProject={(id: string) => modals.confirmDeleteProject(clientProjects, id)}
        onEditFolder={modals.handleEditFolder}
      />

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && width < 768 && (
        <TouchableOpacity 
           activeOpacity={1} 
           onPress={toggleSidebar} 
           style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }]}
        />
      )}

      {/* --- MODALS MANAGER --- */}
      <PodModalsManager 
        modals={modals}
        addFolder={addFolder}
        updateSharedFolder={updateSharedFolder}
        deleteFolder={deleteFolder}
        addClientProject={addClientProject}
        deleteClientProject={deleteClientProject}
        setActiveCategory={setActiveCategory}
        setActiveProject={setActiveProject}
      />

      {/* --- MAIN CONTENT AREA --- */}
      <View style={styles.mainContent}>
        {/* Top Bar */}
        <PodTopBar 
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            activeProject={activeProject}
            activeCategory={activeCategory}
            folders={folders}
            selectedNote={editor.selectedNote}
            isCreating={editor.isCreating}
            handleDelete={editor.handleDelete}
            handleSave={editor.handleSave}
            handleFetchCloud={() => fetchFromCloud && fetchFromCloud(userName, setIsCloudLoading)}
            isCloudLoading={isCloudLoading}
        />

        {/* --- CONTENT SWITCHER --- */}
        {activeProject ? (
            <ProjectCanvas 
                activeProject={activeProject}
                updateClientProject={updateClientProject}
                addProjectMedia={addProjectMedia}
                deleteProjectMedia={deleteProjectMedia}
                userName={userName}
            />
        ) : (
            // --- NOTE/TODO EDITOR CANVAS ---
            editor.selectedNote || editor.isCreating ? (
                editor.editorType === 'todo' ? (
                    <TodoEditor 
                        editorContent={editor.editorContent}
                        setEditorContent={editor.setEditorContent}
                    />
                ) : (
                    <NoteEditor 
                        editorTitle={editor.editorTitle}
                        setEditorTitle={editor.setEditorTitle}
                        editorContent={editor.editorContent}
                        setEditorContent={editor.setEditorContent}
                        editorType={editor.editorType}
                        typeLabel={folders.find((f: any) => f.id === editor.editorType)?.label || editor.editorType}
                        activeNote={editor.selectedNote}
                        addNoteMedia={addNoteMedia}
                        deleteNoteMedia={deleteNoteMedia}
                        userName={userName}
                    />
                )
            ) : (
            // Empty State
            <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Writing is Thinking</Text>
                <Text style={styles.emptyDesc}>
                Select a note from the library or a client project to get started.
                </Text>
                <TouchableOpacity
                style={styles.createBtn}
                onPress={editor.handleCreateNew}
                >
                <Text style={styles.createBtnText}>Create New Page</Text>
                </TouchableOpacity>
            </View>
            )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    flexDirection: "row",
  },
  mainContent: {
    flex: 1,
    backgroundColor: Colors.background,
    display: "flex",
    flexDirection: "column",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  emptyDesc: { color: Colors.textSecondary, textAlign: "center", marginBottom: 30 },
  createBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createBtnText: { color: "#FFF", fontWeight: "bold" },
});
