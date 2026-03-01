import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  Modal
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { usePod } from "../../context/PodContext";
import { useHabits } from "../../context/HabitContext";
import {
  Save,
  Trash2,
  ChevronRight,
  MoreVertical,
} from "lucide-react-native";
import { useLocalSearchParams } from 'expo-router';

// Components
import { PodSidebar } from "../../components/pod/PodSidebar";
import { ProjectCanvas } from "../../components/pod/ProjectCanvas";
import { NoteEditor } from "../../components/pod/NoteEditor";
import { TodoEditor } from "../../components/pod/TodoEditor";

const { width } = Dimensions.get("window");

export default function PodScreen() {
  const insets = useSafeAreaInsets();
  const { notes, addNote, updateNote, deleteNote, folders, addFolder, deleteFolder, clientProjects, addClientProject, deleteClientProject, updateClientProject, addProjectMedia, deleteProjectMedia, addNoteMedia, deleteNoteMedia } = usePod();
  const { userName } = useHabits();
  const params = useLocalSearchParams();

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all"); // 'all', folderId, or 'project_ID'
  const [activeProject, setActiveProject] = useState<any>(null); // For Client Projects

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

  // Re-sync activeProject whenever clientProjects updates (e.g. after addProjectMedia)
  // Intentionally omits activeProject from deps to avoid infinite update loops.
  useEffect(() => {
    if (activeProject?.id) {
      const updated = clientProjects.find((p: any) => p.id === activeProject.id);
      if (updated) setActiveProject(updated);
    }
  }, [clientProjects, activeProject?.id]);

  // Folder Management State
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [targetSection, setTargetSection] = useState<'library' | 'assign'>('library');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderAssignee, setNewFolderAssignee] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<any>(null);

  // Client Project State
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  
  const confirmDeleteFolder = (id: string) => {
      const folder = folders.find((f: any) => f.id === id);
      setFolderToDelete(folder);
  };

  const confirmDeleteProject = (id: string) => {
      const project = clientProjects.find((p: any) => p.id === id);
      setProjectToDelete(project);
  }

  // Editor State
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorType, setEditorType] = useState("note");
  const [isCreating, setIsCreating] = useState(false);

  // Re-sync selectedNote whenever notes updates (e.g. after addNoteMedia)
  // Intentionally omits selectedNote from deps to avoid infinite update loops.
  useEffect(() => {
    if (selectedNote?.id) {
      const updated = notes.find((n: any) => n.id === selectedNote.id);
      if (updated) setSelectedNote(updated);
    }
  }, [notes, selectedNote?.id]);

  // Handle Note Selection
  const handleSelectNote = (note: any) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorType(note.type);
    setIsCreating(false);
    setActiveProject(null); // Ensure we aren't in project mode
    // Bug fix: sync sidebar highlight to the note's folder
    setActiveCategory(note.type || 'all');
    if (width < 768) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsSidebarOpen(false);
    }
  };

  const handleSelectProject = (project: any) => {
      setActiveProject(project);
      setActiveCategory(`project_${project.id}`);
      setSelectedNote(null);
      setIsCreating(false);
       if (width < 768) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsSidebarOpen(false);
      }
  };

  const handleCreateNew = () => {
    // Logic: If active category is a folder in Library, add note there.
    // If 'all', add to 'note' (Daily) by default.
    const newType = (activeCategory === "all" || activeCategory.startsWith('project_')) ? "note" : activeCategory;
    
    setIsCreating(true);
    setSelectedNote(null);
    setActiveProject(null);
    setEditorTitle("");
    setEditorContent("");
    setEditorType(newType);
    // Automatically "open" the editor
    if (width < 768) setIsSidebarOpen(false);
  };

  const handleCreateNewProject = (folderId: string) => {
      setTargetFolderId(folderId);
      setIsProjectModalVisible(true);
  };

  const handleAddFolder = (section: 'library' | 'assign') => {
      setTargetSection(section);
      setIsFolderModalVisible(true);
  };

  const handleSave = () => {
    if (selectedNote) {
      updateNote(selectedNote.id, {
        title: editorTitle,
        content: editorContent,
        type: editorType,
      });
    } else {
      addNote(editorTitle, editorContent, editorType);
      setIsCreating(false);
    }
  };

  const handleDelete = () => {
    if (selectedNote) {
      deleteNote(selectedNote.id);
      setSelectedNote(null);
      if (width < 768) setIsSidebarOpen(true);
    }
  };

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
        selectedNote={selectedNote}
        handleSelectNote={handleSelectNote}
        activeProject={activeProject}
        handleSelectProject={handleSelectProject}
        handleAddFolder={handleAddFolder}
        handleCreateNew={handleCreateNew}
        handleCreateNewProject={handleCreateNewProject}
        confirmDeleteFolder={confirmDeleteFolder}
        confirmDeleteProject={confirmDeleteProject}
      />

      {/* --- MOBILE OVERLAY --- */}
      {isSidebarOpen && width < 768 && (
        <TouchableOpacity 
           activeOpacity={1} 
           onPress={toggleSidebar} 
           style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 90 }]}
        />
      )}

      {/* --- ADD FOLDER MODAL --- */}
      <Modal visible={isFolderModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>New {targetSection === 'library' ? 'Folder' : 'Assign Group'}</Text>
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
                    <TouchableOpacity onPress={() => setIsFolderModalVisible(false)}>
                        <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => {
                            if (newFolderName.trim()) {
                                addFolder(newFolderName.trim(), targetSection, newFolderAssignee.trim());
                                setNewFolderName('');
                                setNewFolderAssignee('');
                                setIsFolderModalVisible(false);
                            }
                        }}
                    >
                        <Text style={styles.createBtnText}>Create</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- ADD PROJECT MODAL --- */}
      <Modal visible={isProjectModalVisible} transparent animationType="fade">
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
                    <TouchableOpacity onPress={() => setIsProjectModalVisible(false)}>
                        <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.createBtn}
                        onPress={() => {
                            if (newProjectName.trim() && targetFolderId) {
                                addClientProject(newProjectName.trim(), targetFolderId);
                                setNewProjectName('');
                                setIsProjectModalVisible(false);
                            }
                        }}
                    >
                        <Text style={styles.createBtnText}>Create</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- DELETE FOLDER CONFIRMATION MODAL --- */}
       <Modal visible={!!folderToDelete} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Delete Folder?</Text>
                    <Text style={{ color: Colors.textSecondary, marginBottom: 20 }}>
                        This will delete the folder and everything inside it.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setFolderToDelete(null)}>
                            <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.createBtn, { backgroundColor: Colors.error }]}
                            onPress={() => {
                                if (folderToDelete) {
                                    deleteFolder(folderToDelete.id, folderToDelete.label);
                                    setFolderToDelete(null);
                                    setActiveCategory('all');
                                }
                            }}
                        >
                            <Text style={styles.createBtnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
       </Modal>
       
       {/* --- DELETE PROJECT CONFIRMATION MODAL --- */}
       <Modal visible={!!projectToDelete} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Delete Project?</Text>
                    <Text style={{ color: Colors.textSecondary, marginBottom: 20 }}>
                        This will delete the project history. This action cannot be undone.
                    </Text>
                    <View style={styles.modalButtons}>
                        <TouchableOpacity onPress={() => setProjectToDelete(null)}>
                            <Text style={{ color: Colors.textSecondary, padding: 10 }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.createBtn, { backgroundColor: Colors.error }]}
                            onPress={() => {
                                if (projectToDelete) {
                                    deleteClientProject(projectToDelete.id, projectToDelete.name);
                                    setProjectToDelete(null);
                                    setActiveProject(null);
                                    setActiveCategory('all');
                                }
                            }}
                        >
                            <Text style={styles.createBtnText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
       </Modal>

      {/* --- MAIN CONTENT AREA --- */}
      <View style={styles.mainContent}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {!isSidebarOpen && (
            <TouchableOpacity onPress={toggleSidebar} style={styles.iconBtn}>
                <MoreVertical color={Colors.textSecondary} size={24} />
            </TouchableOpacity>
          )}
          
          {/* Breadcrumbs */}
          <View style={styles.breadcrumbs}>
            <Text style={styles.breadcrumbText}>Pod</Text>
            <ChevronRight size={14} color={Colors.textMuted} />
            {activeProject ? (
                 <Text style={[styles.breadcrumbText, { color: Colors.primary, fontWeight: 'bold' }]}>
                    {activeProject.name}
                 </Text>
            ) : (
                <Text style={styles.breadcrumbText}>
                {activeCategory === "all"
                    ? "Library"
                    : folders.find((c: any) => c.id === activeCategory)?.label || "Folder"}
                </Text>
            )}
            
            {selectedNote && !activeProject && (
              <>
                <ChevronRight size={14} color={Colors.textMuted} />
                <Text
                  style={[styles.breadcrumbText, { color: Colors.text }]}
                  numberOfLines={1}
                >
                  {selectedNote.title || "Untitled"}
                </Text>
              </>
            )}
            
            {activeProject && (
                <>
                    <ChevronRight size={14} color={Colors.textMuted} />
                    <Text style={[styles.breadcrumbText, { color: Colors.text }]}>Live Log</Text>
                </>
            )}
          </View>

            <View style={styles.topActions}>
             {(selectedNote || isCreating) && !activeProject && (
               <>
                 {selectedNote && (
                   <TouchableOpacity
                     onPress={handleDelete}
                     style={styles.iconBtn}
                   >
                     <Trash2 color={Colors.error} size={18} />
                   </TouchableOpacity>
                 )}
                 <TouchableOpacity onPress={handleSave} style={styles.iconBtn}>
                   <Save color={Colors.primary} size={20} />
                 </TouchableOpacity>
               </>
             )}
              {/* Canvas is now the only project view — Live Log removed */}
            </View>
          </View>

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
            selectedNote || isCreating ? (
                editorType === 'todo' ? (
                    <TodoEditor 
                        editorContent={editorContent}
                        setEditorContent={setEditorContent}
                    />
                ) : (
                    <NoteEditor 
                        editorTitle={editorTitle}
                        setEditorTitle={setEditorTitle}
                        editorContent={editorContent}
                        setEditorContent={setEditorContent}
                        editorType={editorType}
                        typeLabel={folders.find((f: any) => f.id === editorType)?.label || editorType}
                        activeNote={selectedNote}
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
                onPress={handleCreateNew}
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  breadcrumbs: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  breadcrumbText: { color: Colors.textSecondary, fontSize: 13 },
  topActions: { flexDirection: "row", gap: 10 },
  iconBtn: { padding: 8 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 2,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabBtnActive: { backgroundColor: "#334155" },
  tabText: { fontSize: 12, color: Colors.textSecondary },
  tabTextActive: { color: Colors.text, fontWeight: "bold" },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1E293B",
    padding: 25,
    borderRadius: 15,
    width: 300,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  input: {
    backgroundColor: "#0F1523",
    color: Colors.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 15,
  },
});
