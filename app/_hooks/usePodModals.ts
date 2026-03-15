import { useState, useEffect } from "react";
import { Platform, Alert } from "react-native";

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
  const [targetSection, setTargetSection] = useState<'library' | 'assign'>('library');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderAssignee, setNewFolderAssignee] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<any>(null);
  const [folderToEdit, setFolderToEdit] = useState<any>(null);

  // Client Project State
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<any>(null);
  
  const confirmDeleteFolder = (folders: any[], id: string) => {
      const folder = folders.find((f: any) => f.id === id);
      setFolderToDelete(folder);
  };

  const confirmDeleteProject = (clientProjects: any[], id: string) => {
      const project = clientProjects.find((p: any) => p.id === id);
      setProjectToDelete(project);
  }

  const handleEditFolder = (folder: any) => {
      setFolderToEdit(folder);
      setNewFolderName(folder.label);
      setNewFolderAssignee(folder.assignedTo || '');
      setTargetSection(folder.section);
      setIsFolderModalVisible(true);
  };

  const handleCreateNewProject = (folderId: string) => {
      if (Platform.OS === 'web') {
          Alert.alert("Native Feature", "Creating Shared Projects in the ASSIGN section is only available in the HabitMarket Mobile App.");
          return;
      }
      setTargetFolderId(folderId);
      setIsProjectModalVisible(true);
  };

  const handleAddFolder = (section: 'library' | 'assign') => {
      if (Platform.OS === 'web' && section === 'assign') {
          Alert.alert("Native Feature", "Creating Shared Folders in the ASSIGN section is only available in the HabitMarket Mobile App.");
          return;
      }
      setTargetSection(section);
      setIsFolderModalVisible(true);
  };

  return {
    showWebInfoOverlay, setShowWebInfoOverlay,
    isFolderModalVisible, setIsFolderModalVisible,
    targetSection, setTargetSection,
    newFolderName, setNewFolderName,
    newFolderAssignee, setNewFolderAssignee,
    folderToDelete, setFolderToDelete,
    folderToEdit, setFolderToEdit,
    isProjectModalVisible, setIsProjectModalVisible,
    targetFolderId, setTargetFolderId,
    newProjectName, setNewProjectName,
    projectToDelete, setProjectToDelete,
    confirmDeleteFolder, confirmDeleteProject,
    handleEditFolder, handleCreateNewProject, handleAddFolder
  };
};
