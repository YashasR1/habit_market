import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { 
    ChevronDown, ChevronRight, Trash2, FileText, Briefcase, Plus, MoreVertical,
    Folder, PenTool
} from 'lucide-react-native';
import { EmptyState } from '../common/EmptyState';

const { width } = Dimensions.get("window");

interface PodSidebarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    activeCategory: string;
    onSelectFolder: (id: string) => void;
    notes: any[];
    folders: any[];
    clientProjects: any[];
    selectedNote: any;
    handleSelectNote: (note: any) => void;
    activeProject: any;
    handleSelectProject: (project: any) => void;
    handleAddFolder: (section: 'library' | 'assign') => void;
    handleCreateNew: () => void;
    handleCreateNewProject: (folderId: string) => void;
    confirmDeleteFolder: (id: string) => void;
    confirmDeleteProject: (id: string) => void;
}

export const PodSidebar = ({
    isSidebarOpen,
    toggleSidebar,
    activeCategory,
    onSelectFolder,
    notes,
    folders,
    clientProjects,
    selectedNote,
    handleSelectNote,
    activeProject,
    handleSelectProject,
    handleAddFolder,
    handleCreateNew,
    handleCreateNewProject,
    confirmDeleteFolder,
    confirmDeleteProject
}: PodSidebarProps) => {

    if (!isSidebarOpen) return null;

    const libraryFolders = folders.filter((f: any) => !f.section || f.section === 'library');
    const assignFolders = folders.filter((f: any) => f.section === 'assign');

    const renderFolderList = (folderList: any[], isLibrary: boolean) => {
        return folderList.map((cat: any) => {
          const isActive = activeCategory === cat.id; 
          // Protect core default folders from deletion even if their type was historically set to 'user'
          const isSystem = cat.type === 'system' || ['all', 'idea', 'note', 'todo'].includes(cat.id);
          
          let items = [];
          if (isLibrary) {
              items = notes.filter((n: any) => n.type === cat.id);
          } else {
              items = (clientProjects || []).filter((p: any) => p.folderId === cat.id);
          }
  
          return (
              <View key={cat.id}>
                  <TouchableOpacity 
                      style={[styles.sidebarItem, isActive && styles.sidebarItemActive]}
                      onPress={() => onSelectFolder(cat.id)}
                  >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          {isActive ? 
                              <ChevronDown size={14} color={Colors.textSecondary} /> : 
                              <ChevronRight size={14} color={Colors.textSecondary} />
                          }
                          <Text style={[styles.sidebarItemText, isActive && styles.sidebarItemTextActive]}>{cat.label}</Text>
                      </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={{ color: Colors.textMuted, fontSize: 11 }}>{items.length}</Text>
                          {!isSystem && isActive && (
                              <TouchableOpacity onPress={() => confirmDeleteFolder(cat.id)}>
                                  <Trash2 size={12} color={Colors.error} />
                              </TouchableOpacity>
                          )}
                      </View>
                  </TouchableOpacity>
                  
                  {/* Nested Items */}
                  {isActive && (
                      <View style={{ paddingLeft: 24 }}>
                          {items.length === 0 ? (
                              <View style={{ paddingVertical: 8, paddingHorizontal: 15 }}>
                                  <Text style={{ color: Colors.textMuted, fontSize: 12, fontStyle: 'italic' }}>Empty</Text>
                              </View>
                          ) : (
                              items.map((item: any) => {
                                  if (isLibrary) {
                                      // Render Note
                                      return (
                                          <TouchableOpacity 
                                              key={item.id} 
                                              style={[styles.noteItem, selectedNote?.id === item.id && styles.noteItemActive]}
                                              onPress={() => handleSelectNote(item)}
                                          >
                                              <FileText size={14} color={selectedNote?.id === item.id ? Colors.text : Colors.textSecondary} />
                                              <Text style={[styles.noteItemText, selectedNote?.id === item.id && styles.noteItemTextActive]} numberOfLines={1}>
                                                  {item.title || 'Untitled'}
                                              </Text>
                                          </TouchableOpacity>
                                      );
                                  } else {
                                      // Render Client Project (Live Log)
                                      const isProjectActive = activeProject?.id === item.id;
                                      return (
                                          <TouchableOpacity 
                                              key={item.id} 
                                              style={[styles.noteItem, isProjectActive && styles.noteItemActive]}
                                              onPress={() => handleSelectProject(item)}
                                          >
                                              <Briefcase size={14} color={isProjectActive ? Colors.primary : Colors.textSecondary} />
                                              <Text style={[styles.noteItemText, isProjectActive && styles.noteItemTextActive]} numberOfLines={1}>
                                                  {item.name}
                                              </Text>
                                              {isProjectActive && (
                                                  <TouchableOpacity onPress={() => confirmDeleteProject(item.id)} style={{ marginLeft: 'auto' }}>
                                                      <Trash2 size={12} color={Colors.error} />
                                                  </TouchableOpacity>
                                              )}
                                          </TouchableOpacity>
                                      );
                                  }
                              })
                          )}
                          
                          {/* Quick Add Button inside Folder */}
                          <TouchableOpacity 
                              style={[styles.noteItem, { opacity: 0.6 }]}
                              onPress={() => isLibrary ? handleCreateNew() : handleCreateNewProject(cat.id)}
                          >
                              <Plus size={14} color={Colors.textSecondary} />
                              <Text style={styles.noteItemText}>{isLibrary ? 'New Page' : 'New Project'}</Text>
                          </TouchableOpacity>
                      </View>
                  )}
              </View>
          );
      });
    };

    return (
        <View style={styles.sidebar}>
          {/* Sidebar Header */}
          <View style={styles.sidebarHeader}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <TouchableOpacity onPress={toggleSidebar} style={{ padding: 5 }}>
                    <MoreVertical color={Colors.textSecondary} size={24} />
                </TouchableOpacity>
            </View>
          </View>

          {/* Nested Tree View */}
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            {/* LIBRARY SECTION */}
            <View style={{ marginTop: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 15, alignItems: 'center' }}>
                     <Text style={styles.sectionTitle}>Library</Text>
                     <TouchableOpacity onPress={() => handleAddFolder('library')}>
                        <Plus size={14} color={Colors.textSecondary} />
                     </TouchableOpacity>
                </View>
                {renderFolderList(libraryFolders, true)}
                {libraryFolders.length === 0 && (
                     <EmptyState 
                         title="Empty Library"
                         description="Store your research and personal ideas."
                         icon="folder"
                         actionLabel="Create Folder"
                         onAction={() => handleAddFolder('library')}
                     />
                )}
            </View>

            {/* ASSIGN SECTION */}
            <View style={{ marginTop: 30 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingRight: 15, alignItems: 'center' }}>
                     {/* HIGH #6: Amber accent to visually distinguish ASSIGN from Library */}
                     <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>Assign</Text>
                     <TouchableOpacity onPress={() => handleAddFolder('assign')}>
                        <Plus size={14} color="#F59E0B" />
                     </TouchableOpacity>
                </View>
                {renderFolderList(assignFolders, false)}
                
                {assignFolders.length === 0 && (
                     <EmptyState 
                         title="No Shared Projects"
                         description="Organize collaborative missions with your clients."
                         icon="folder"
                         actionLabel="Create Folder"
                         onAction={() => handleAddFolder('assign')}
                     />
                 )}
            </View>
          </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
  sidebar: {
    // LOW #18: Responsive sidebar width — narrower on phones, wider on tablets
    width: width < 400 ? width * 0.7 : 300,
    maxWidth: width < 400 ? 260 : 300,
    backgroundColor: "#0F1523",
    borderRightWidth: 1,
    borderRightColor: "#1E293B",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    paddingTop: 10,
    position: width < 768 ? 'absolute' : 'relative',
    zIndex: 100,
    top: 0,
    left: 0,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  appName: { color: Colors.text, fontWeight: "bold", fontSize: 16 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 15,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 15,
    gap: 10,
  },
  sidebarItemActive: { backgroundColor: "#1E293B" },
  sidebarItemText: { color: Colors.textSecondary, fontSize: 13 },
  sidebarItemTextActive: { color: Colors.text, fontWeight: "600" },
  noteItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 25,
    gap: 8,
  },
  noteItemActive: { backgroundColor: "rgba(99, 102, 241, 0.1)" },
  noteItemText: { color: Colors.textSecondary, fontSize: 13 },
  noteItemTextActive: { color: Colors.primary, fontWeight: "500" },
  emptyText: { color: Colors.textMuted, fontSize: 12, paddingHorizontal: 15, fontStyle: 'italic' },
});
