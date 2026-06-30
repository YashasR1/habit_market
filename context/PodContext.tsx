import React, { createContext, useContext } from 'react';
import { useHabits } from './HabitContext';

const PodContext = createContext<any>(null);

export const PodProvider = ({ children }: { children: React.ReactNode }) => {
    
    // Pull the truly live, globally synchronized user data from the HabitContext
    const {
        userName,
        notes, setNotes,
        folders, setFolders,
        isLoaded: isPersistenceLoaded
    } = useHabits();

    const isLoaded = isPersistenceLoaded;

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
    const addFolder = (name: string, section: string = 'library') => {
        const newFolder = {
            id: Math.random().toString(36).substring(7),
            label: name,
            icon: 'Folder',
            type: 'user',
            section
        };
        setFolders((prev: any) => [...prev, newFolder]);
    };

    const deleteFolder = (id: string, name: string) => {
        setFolders((prev: any) => prev.filter((f: any) => f.id !== id));
        setNotes((prev: any) => prev.filter((n: any) => n.type !== id));
    };

    return (
        <PodContext.Provider value={{
            notes,
            addNote,
            updateNote,
            deleteNote,
            addNoteMedia,
            deleteNoteMedia,
            folders: folders.filter((f: any) => f.section !== 'assign'),
            addFolder,
            deleteFolder,
            isLoaded
        }}>
            {children}
        </PodContext.Provider>
    );
};

export const usePod = () => useContext(PodContext);
