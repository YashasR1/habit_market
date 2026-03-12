import React from 'react';
import { Platform } from 'react-native';

// Modal Components
import { FolderModal } from "./PodModals/FolderModal";
import { ProjectModal } from "./PodModals/ProjectModal";
import { DeleteConfirmModal } from "./PodModals/DeleteConfirmModal";
import { WebInfoOverlay } from "../web-simulation/WebInfoOverlay";

export const PodModalsManager = ({
    modals,
    addFolder,
    updateSharedFolder,
    deleteFolder,
    addClientProject,
    deleteClientProject,
    setActiveCategory,
    setActiveProject,
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
                introRestText="of HabitMarket. The POD (Proof of Daily) is your secure workspace to organize offline projects, store active files, and collaborate."
                features={[
                    {
                        title: "Library (Note-taking)",
                        description: "In the Native App, the Library provides local-first offline Markdown editors for Ideas, Todos, and Journals. Data persists to your secure SQLite vault instantly.",
                        icon: "arrow"
                    },
                    {
                        title: "Assign (Collaboration)",
                        description: "Create structured Canvas Projects here! On Mobile, you can assign folders to friends, securely compress and upload immense photo/video files from your gallery, and build complex Checklists that sync effortlessly via the cloud.",
                        icon: "arrow"
                    }
                ]}
                nativeDisclaimerDesc="For this Interactive Web Simulation, any Projects, Notes, or Dummy Media you generate will stay actively cached until you close this browser tab!"
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
                        if (modals.folderToEdit) {
                            updateSharedFolder(modals.folderToEdit.id, modals.newFolderName.trim(), modals.newFolderAssignee.trim());
                        } else {
                            addFolder(modals.newFolderName.trim(), modals.targetSection, modals.newFolderAssignee.trim());
                        }
                        modals.setNewFolderName('');
                        modals.setNewFolderAssignee('');
                        modals.setFolderToEdit(null);
                        modals.setIsFolderModalVisible(false);
                    }
                }}
            />

            {/* --- ADD PROJECT MODAL --- */}
            <ProjectModal 
                isVisible={modals.isProjectModalVisible}
                onClose={() => modals.setIsProjectModalVisible(false)}
                newProjectName={modals.newProjectName}
                setNewProjectName={modals.setNewProjectName}
                onAddProject={() => {
                    if (modals.newProjectName.trim() && modals.targetFolderId) {
                        addClientProject(modals.newProjectName.trim(), modals.targetFolderId);
                        modals.setNewProjectName('');
                        modals.setIsProjectModalVisible(false);
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
            
            {/* --- DELETE PROJECT CONFIRMATION MODAL --- */}
            <DeleteConfirmModal 
                isVisible={!!modals.projectToDelete}
                onClose={() => modals.setProjectToDelete(null)}
                title="Delete Project?"
                description="This will delete the project history. This action cannot be undone."
                onDelete={() => {
                    if (modals.projectToDelete) {
                        deleteClientProject(modals.projectToDelete.id, modals.projectToDelete.name);
                        modals.setProjectToDelete(null);
                        setActiveProject(null);
                        setActiveCategory('all');
                    }
                }}
            />
        </>
    );
};
