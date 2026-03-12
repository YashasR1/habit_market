import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ChevronRight, MoreVertical, Trash2, Save, CloudDownload } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';

interface PodTopBarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    activeProject: any;
    activeCategory: string;
    folders: any[];
    selectedNote: any;
    isCreating: boolean;
    handleDelete: () => void;
    handleSave: () => void;
    handleFetchCloud?: () => void;
    isCloudLoading?: boolean;
}

export const PodTopBar = ({
    isSidebarOpen,
    toggleSidebar,
    activeProject,
    activeCategory,
    folders,
    selectedNote,
    isCreating,
    handleDelete,
    handleSave,
    handleFetchCloud,
    isCloudLoading,
}: PodTopBarProps) => {
    return (
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
            {!activeProject && !selectedNote && !isCreating && handleFetchCloud && (
              <TouchableOpacity onPress={handleFetchCloud} style={styles.iconBtn} disabled={isCloudLoading}>
                {isCloudLoading ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <CloudDownload color={Colors.primary} size={22} />
                )}
              </TouchableOpacity>
            )}
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
          </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});
