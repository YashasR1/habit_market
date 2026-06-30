import { useState, useEffect } from "react";
import { Platform } from "react-native";

export const usePodModals = () => {
  // Simulation Mode Welcome Modal State
  const [showWebInfoOverlay, setShowWebInfoOverlay] = useState(false);

  // Check if we've seen the welcome modal on Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const hasSeen = sessionStorage.getItem('has_seen_web_pod_welcome');
      if (!hasSeen) {
        setShowWebInfoOverlay(true);
      }
    }
  }, []);

  // Folder Management State
  const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
  const [targetSection, setTargetSection] = useState<'library'>('library');
  const [newFolderName, setNewFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<any>(null);
  const [folderToEdit, setFolderToEdit] = useState<any>(null);
  
  const confirmDeleteFolder = (folders: any[], id: string) => {
      const folder = folders.find((f: any) => f.id === id);
      setFolderToDelete(folder);
  };

  const handleEditFolder = (folder: any) => {
      setFolderToEdit(folder);
      setNewFolderName(folder.label);
      setTargetSection(folder.section || 'library');
      setIsFolderModalVisible(true);
  };

  const handleAddFolder = (section: 'library') => {
      setTargetSection(section);
      setIsFolderModalVisible(true);
  };

  return {
    showWebInfoOverlay, setShowWebInfoOverlay,
    isFolderModalVisible, setIsFolderModalVisible,
    targetSection, setTargetSection,
    newFolderName, setNewFolderName,
    folderToDelete, setFolderToDelete,
    folderToEdit, setFolderToEdit,
    confirmDeleteFolder,
    handleEditFolder, handleAddFolder
  };
};
