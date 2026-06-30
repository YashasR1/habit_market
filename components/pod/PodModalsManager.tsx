import React from 'react';
import { Platform } from 'react-native';

// Modal Components
import { FolderModal } from "./PodModals/FolderModal";
import { DeleteConfirmModal } from "./PodModals/DeleteConfirmModal";
import { WebInfoOverlay } from "../web-simulation/WebInfoOverlay";

export const PodModalsManager = ({
    modals,
    addFolder,
    deleteFolder,
    setActiveCategory,
}: any) => {

    return (
        <>
            {/* WEB SIMULATION WELCOME OVERLAY */}
            <WebInfoOverlay 
                isVisible={modals.showWebInfoOverlay}
                onClose={() => {
                    modals.setShowWebInfoOverlay(false);
                    if (Platform.OS === 'web') {
                        sessionStorage.setItem('has_seen_web_pod_welcome', 'true');
                    }
                }}
                title="POD Architecture"
                introHighlightText="Simulation Mode"
                introRestText="of HabitMarket. The POD (Proof of Daily) is your secure workspace to organize offline projects and store active files."
                features={[
                    {
                        title: "Library (Note-taking)",
                        description: "In the Native App, the Library provides local-first offline Markdown editors for Ideas, Todos, and Journals. Data persists to your secure SQLite vault instantly.",
                        icon: "arrow"
                    }
                ]}
                nativeDisclaimerDesc="For this Interactive Web Simulation, any Notes or Dummy Media you generate will stay actively cached until you close this browser tab!"
            />

            <FolderModal 
                isVisible={modals.isFolderModalVisible}
                onClose={() => {
                    modals.setIsFolderModalVisible(false);
                    modals.setFolderToEdit(null);
                    modals.setNewFolderName('');
                    modals.setNewFolderAssignee('');
                }}
                targetSection={modals.targetSection}
                newFolderName={modals.newFolderName}
                setNewFolderName={modals.setNewFolderName}
                newFolderAssignee={modals.newFolderAssignee}
                setNewFolderAssignee={modals.setNewFolderAssignee}
                isEditing={!!modals.folderToEdit}
                onAddFolder={() => {
                    if (modals.newFolderName.trim()) {
                        addFolder(modals.newFolderName.trim(), modals.targetSection);
                        modals.setNewFolderName('');
                        modals.setNewFolderAssignee('');
                        modals.setFolderToEdit(null);
                        modals.setIsFolderModalVisible(false);
                    }
                }}
            />

            {/* --- DELETE FOLDER CONFIRMATION MODAL --- */}
            <DeleteConfirmModal 
                isVisible={!!modals.folderToDelete}
                onClose={() => modals.setFolderToDelete(null)}
                title="Delete Folder?"
                description="This will delete the folder and everything inside it."
                onDelete={() => {
                    if (modals.folderToDelete) {
                        deleteFolder(modals.folderToDelete.id, modals.folderToDelete.label);
                        modals.setFolderToDelete(null);
                        setActiveCategory('all');
                    }
                }}
            />
        </>
    );
};
