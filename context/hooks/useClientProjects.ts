import { useState, useEffect } from "react";
import { Platform } from "react-native";
import { useSQLiteContext } from "expo-sqlite";

// Extracted Sub-Hooks
import { useProjectCloudSync } from "./useProjectCloudSync";
import { useProjectFolders } from "./useProjectFolders";
import { useProjectActions } from "./useProjectActions";
import { useProjectMedia } from "./useProjectMedia";
export const useClientProjects = (userName: string, triggerSync?: () => void) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const db = Platform.OS === 'web' ? null : useSQLiteContext();
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [sharedFolders, setSharedFolders] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFromSQLite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Cloud Deletion Listeners abstracted to useProjectCloudSync ---

  const loadFromSQLite = async () => {
    if (Platform.OS === 'web') {
      try {
        const storedProjects = sessionStorage.getItem('web_clientProjects');
        if (storedProjects) setClientProjects(JSON.parse(storedProjects));
        
        const storedFolders = sessionStorage.getItem('web_sharedFolders');
        if (storedFolders) setSharedFolders(JSON.parse(storedFolders));
      } catch (e) {
        console.warn('Failed to access sessionStorage', e);
      }
      setIsLoaded(true);
      return;
    }

    if (!db) {
      setIsLoaded(true);
      return;
    }
    
    try {
      const projects = await db.getAllAsync<any>("SELECT * FROM client_projects;");
      const parsedProjects = projects.map((p) => ({
        ...p,
        checklist: p.checklist ? JSON.parse(p.checklist) : [],
        media: p.media ? JSON.parse(p.media) : [],
      }));
      setClientProjects(parsedProjects);

      // Folders with section='assign' are shared folders in the UI
      const folders = await db.getAllAsync<any>(
        "SELECT * FROM folders WHERE section = 'assign';"
      );
      setSharedFolders(folders);
    } catch (e) {
      console.error("Error loading projects from SQLite", e);
    } finally {
      setIsLoaded(true);
    }
  };

  // Keep Web sessionStorage up to date
  useEffect(() => {
    if (Platform.OS === 'web' && isLoaded) {
      try {
        sessionStorage.setItem('web_clientProjects', JSON.stringify(clientProjects));
        sessionStorage.setItem('web_sharedFolders', JSON.stringify(sharedFolders));
      } catch (e) {
        console.warn('Failed to save to sessionStorage', e);
      }
    }
  }, [clientProjects, sharedFolders, isLoaded]);

  const queueSync = async (
    operation: string,
    tableName: string,
    recordId: string,
    payload: any,
    triggerSyncFn?: () => void,
  ) => {
    try {
      const syncId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      if (db) {
        await db.runAsync(
          "INSERT INTO sync_queue (id, operation, tableName, recordId, payload, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
          syncId,
          operation,
          tableName,
          recordId,
          JSON.stringify(payload),
          new Date().toISOString(),
          "pending",
        );
      }
    } catch (e) {
      console.error("Failed to queue sync", e);
    }
  };

  // --- COMPOSITE HOOKS ---
  const { fetchFromCloud } = useProjectCloudSync(userName, db, isLoaded, setClientProjects, setSharedFolders, loadFromSQLite);
  const { addSharedFolder, migrateSharedFolder, updateSharedFolder, deleteSharedFolder } = useProjectFolders(db, setSharedFolders, queueSync, triggerSync);
  const { addClientProject, deleteClientProject, updateClientProject } = useProjectActions(db, setClientProjects, queueSync, triggerSync);
  const { addProjectMedia, deleteProjectMedia, removeProjectMedia } = useProjectMedia(db, setClientProjects, queueSync, triggerSync);

  return {
    clientProjects,
    sharedFolders,
    isLoaded,
    addClientProject,
    deleteClientProject,
    updateClientProject,
    addProjectMedia,
    removeProjectMedia,
    deleteProjectMedia,
    addSharedFolder,
    migrateSharedFolder,
    updateSharedFolder,
    deleteSharedFolder,
    fetchFromCloud,
  };
};
