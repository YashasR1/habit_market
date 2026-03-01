import React, { createContext, useContext, useEffect } from 'react';
import { useHabitPersistence } from './hooks/useHabitPersistence';
import { useClientProjects } from './hooks/useClientProjects';
import { useSync } from './SyncContext';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { NotificationService } from '../utils/NotificationService';

const PodContext = createContext<any>(null);

export const PodProvider = ({ children }: { children: React.ReactNode }) => {
    
    // We still need userName and isLoaded from persistence for context
    const {
        userName,
        notes, setNotes,
        folders, setFolders,
        isLoaded: isPersistenceLoaded
    } = useHabitPersistence();

    const { triggerSync } = useSync();

    const {
        clientProjects,
        sharedFolders,
        isLoaded: isProjectsLoaded,
        addClientProject,
        deleteClientProject,
        updateClientProject,
        addProjectMedia,
        addSharedFolder,
        migrateSharedFolder,
        deleteSharedFolder
    } = useClientProjects(triggerSync);

    const isLoaded = isPersistenceLoaded && isProjectsLoaded;

    // --- MIGRATION: Local Assign folders -> Firestore ---
    useEffect(() => {
        if (isLoaded && folders.length > 0) {
            const localAssignFolders = folders.filter((f: any) => f.section === 'assign');
            if (localAssignFolders.length > 0) {
                console.log("Migrating local ASSIGN folders to cloud...");
                localAssignFolders.forEach(async (folder: any) => {
                    await migrateSharedFolder(folder);
                });
                // Clear them from local state so we don't migrate again
                setFolders((prev: any) => prev.filter((f: any) => f.section !== 'assign'));
            }
        }
    }, [isLoaded, folders, migrateSharedFolder, setFolders]);

    // --- NOTIFICATIONS: Listen for peer activity ---
    useEffect(() => {
        if (!isLoaded || !userName) return;

        // 2. Listen for NEW activity only (from now onwards)
        const startTime = new Date().toISOString();
        
        const activityQuery = query(
            collection(db, "collaborative_notifications"),
            orderBy("timestamp", "desc"),
            limit(1)
        );

        const unsubscribe = onSnapshot(activityQuery, (snapshot: any) => {
            snapshot.docChanges().forEach((change: any) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    
                    if (data.source !== userName && data.timestamp >= startTime) {
                        const icon = data.action.includes('folder') ? '📁' : 
                                    data.action.includes('project') ? '📝' : 
                                    data.action.includes('image') ? '🖼️' :
                                    data.action.includes('video') ? '🎥' : '🔔';
                                    
                        NotificationService.sendLocalNotification(
                            "MARHABS",
                            `${icon} ${data.source} ${data.action}: ${data.label}`
                        );
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [isLoaded, userName]);

    // Note operations
    const addNote = (title: string, content: string, type: string = 'note') => {
        const newNote = {
            id: Math.random().toString(36).substring(7),
            title: title || 'Untitled',
            content: content || '',
            type,
            date: new Date().toISOString(),
            media: []
        };
        setNotes((prev: any) => [newNote, ...prev]);
    };

    const updateNote = (id: string, updates: any) => {
        setNotes((prev: any) => prev.map((n: any) => n.id === id ? { ...n, ...updates, date: new Date().toISOString() } : n));
    };

    const deleteNote = (id: string) => {
        setNotes((prev: any) => prev.filter((n: any) => n.id !== id));
    };

    const addNoteMedia = (noteId: string, mediaItem: { url: string; type: 'image' | 'video'; uploadedBy: string; uploadedAt: string }) => {
        setNotes((prev: any) => prev.map((n: any) => n.id === noteId ? { ...n, media: [...(n.media || []), mediaItem], date: new Date().toISOString() } : n));
    };

    const deleteNoteMedia = (noteId: string, mediaUrl: string) => {
        setNotes((prev: any) => prev.map((n: any) => n.id === noteId ? { ...n, media: (n.media || []).filter((m: any) => m.url !== mediaUrl), date: new Date().toISOString() } : n));
    };

    // Folder operations
    const addFolder = (name: string, section: string = 'library', assignedTo?: string) => {
        if (section === 'assign') {
            addSharedFolder(name, userName, assignedTo);
        } else {
            const newFolder = {
                id: Math.random().toString(36).substring(7),
                label: name,
                icon: 'Folder',
                type: 'user',
                section
            };
            setFolders((prev: any) => [...prev, newFolder]);
        }
    };

    const deleteFolder = (id: string, name: string) => {
        const isShared = sharedFolders.some((f: any) => f.id === id);

        if (isShared) {
            deleteSharedFolder(id, name, userName);
        } else {
            setFolders((prev: any) => prev.filter((f: any) => f.id !== id));
        }

        setNotes((prev: any) => prev.filter((n: any) => n.type !== id));
        
        const projectsToDelete = clientProjects.filter((p: any) => p.folderId === id);
        projectsToDelete.forEach((p: any) => {
            deleteClientProject(p.id, p.name, userName);
        });
    };

    return (
        <PodContext.Provider value={{
            notes,
            addNote,
            updateNote,
            deleteNote,
            addNoteMedia,
            deleteNoteMedia,
            folders: [
                ...folders.filter((f: any) => f.section !== 'assign'), 
                ...sharedFolders.filter((f: any) => !f.createdBy || f.createdBy.toLowerCase() === userName.toLowerCase() || (f.assignedTo && f.assignedTo.toLowerCase() === userName.toLowerCase()))
            ],
            addFolder,
            deleteFolder,
            clientProjects: clientProjects.filter((p: any) => !p.createdBy || p.createdBy.toLowerCase() === userName.toLowerCase() || (p.assignedTo && p.assignedTo.toLowerCase() === userName.toLowerCase())),
            sharedFolders: sharedFolders.filter((f: any) => !f.createdBy || f.createdBy.toLowerCase() === userName.toLowerCase() || (f.assignedTo && f.assignedTo.toLowerCase() === userName.toLowerCase())),
            addClientProject: (name: string, folderId: string) => {
                const folder = sharedFolders.find((f: any) => f.id === folderId) || folders.find((f: any) => f.id === folderId);
                const assignedTo = folder?.assignedTo;
                addClientProject(name, folderId, userName, assignedTo);
            },
            deleteClientProject: (id: string, name: string) => deleteClientProject(id, name, userName),
            updateClientProject: (id: string, name: string, updates: any) => updateClientProject(id, name, updates, userName),
            addProjectMedia: (projectId: string, projectName: string, mediaItem: any) => addProjectMedia(projectId, projectName, mediaItem, userName),
            isLoaded
        }}>
            {children}
        </PodContext.Provider>
    );
};

export const usePod = () => useContext(PodContext);
