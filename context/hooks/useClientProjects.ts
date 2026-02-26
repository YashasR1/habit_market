import { useState, useEffect } from "react";
import { db } from "../db";

export const useClientProjects = (triggerSync?: () => void) => {
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [sharedFolders, setSharedFolders] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFromSQLite();
  }, []);

  const loadFromSQLite = () => {
    try {
      const projects = db.getAllSync<any>("SELECT * FROM client_projects;");
      const parsedProjects = projects.map((p) => ({
        ...p,
        checklist: p.checklist ? JSON.parse(p.checklist) : [],
        media: p.media ? JSON.parse(p.media) : [],
      }));
      setClientProjects(parsedProjects);

      // Folders with section='assign' are shared folders in the UI
      const folders = db.getAllSync<any>(
        'SELECT * FROM folders WHERE section = "assign";',
      );
      setSharedFolders(folders);
    } catch (e) {
      console.error("Error loading projects from SQLite", e);
    } finally {
      setIsLoaded(true);
    }
  };

  const queueSync = (
    operation: string,
    tableName: string,
    recordId: string,
    payload: any,
    triggerSyncFn?: () => void,
  ) => {
    try {
      const syncId =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      db.runSync(
        "INSERT INTO sync_queue (id, operation, tableName, recordId, payload, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        syncId,
        operation,
        tableName,
        recordId,
        JSON.stringify(payload),
        new Date().toISOString(),
        "pending",
      );
      if (triggerSyncFn) triggerSyncFn();
    } catch (e) {
      console.error("Failed to queue sync", e);
    }
  };

  const addClientProject = async (
    name: string,
    folderId: string,
    actor: string,
  ) => {
    const newProject = {
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      name,
      folderId,
      content: "",
      checklist: [],
      media: [],
      lastEditedBy: actor,
      lastEditedAt: new Date().toISOString(),
    };

    try {
      db.withTransactionSync(() => {
        db.runSync(
          "INSERT INTO client_projects (id, name, type, folderId, content, checklist, media, lastEditedBy, lastEditedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          newProject.id,
          newProject.name,
          null,
          newProject.folderId,
          newProject.content,
          "[]",
          "[]",
          newProject.lastEditedBy,
          newProject.lastEditedAt,
        );
        queueSync("INSERT", "projects", newProject.id, newProject);
      });
      setClientProjects((prev) => [...prev, newProject]);
      return newProject.id;
    } catch (e) {
      console.error("Error adding project: ", e);
      return null;
    }
  };

  const deleteClientProject = async (
    id: string,
    name: string,
    actor: string,
  ) => {
    try {
      db.withTransactionSync(() => {
        db.runSync("DELETE FROM client_projects WHERE id = ?", id);
        queueSync("DELETE", "projects", id, { id, name }, triggerSync);
      });
      setClientProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Error deleting project: ", e);
    }
  };

  const updateClientProject = async (
    id: string,
    name: string,
    updates: any,
    actor: string,
  ) => {
    try {
      db.withTransactionSync(() => {
        // Fetch existing first to merge (lazy approach since updates might be partial)
        const row = db.getFirstSync<any>(
          "SELECT * FROM client_projects WHERE id = ?",
          id,
        );
        if (row) {
          const merged = {
            ...row,
            ...updates,
            checklist:
              updates.checklist !== undefined
                ? JSON.stringify(updates.checklist)
                : row.checklist,
            media:
              updates.media !== undefined
                ? JSON.stringify(updates.media)
                : row.media,
          };
          db.runSync(
            "UPDATE client_projects SET name=?, type=?, folderId=?, content=?, checklist=?, media=?, lastEditedBy=?, lastEditedAt=? WHERE id=?",
            merged.name,
            merged.type,
            merged.folderId,
            merged.content,
            merged.checklist,
            merged.media,
            actor,
            new Date().toISOString(),
            id,
          );
          queueSync(
            "UPDATE",
            "projects",
            id,
            {
              ...updates,
              lastEditedBy: actor,
              lastEditedAt: new Date().toISOString(),
            },
            triggerSync,
          );
        }
      });

      setClientProjects((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              ...updates,
              lastEditedBy: actor,
              lastEditedAt: new Date().toISOString(),
            };
          }
          return p;
        }),
      );
    } catch (e) {
      console.error("Error updating project: ", e);
    }
  };

  const addProjectMedia = async (
    projectId: string,
    projectName: string,
    mediaItem: {
      url: string;
      type: "image" | "video";
      uploadedBy: string;
      uploadedAt: string;
    },
    actor: string,
  ) => {
    try {
      db.withTransactionSync(() => {
        const row = db.getFirstSync<any>(
          "SELECT media FROM client_projects WHERE id = ?",
          projectId,
        );
        if (row) {
          const arr = row.media ? JSON.parse(row.media) : [];
          arr.push(mediaItem);
          db.runSync(
            "UPDATE client_projects SET media=? WHERE id=?",
            JSON.stringify(arr),
            projectId,
          );
          queueSync(
            "UPDATE",
            "projects",
            projectId,
            { media: arr },
            triggerSync,
          );
        }
      });

      setClientProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            return { ...p, media: [...(p.media || []), mediaItem] };
          }
          return p;
        }),
      );
    } catch (e) {
      console.error("Error adding media: ", e);
    }
  };

  const addSharedFolder = async (name: string, actor: string) => {
    const newFolder = {
      id: Math.random().toString(36).substring(2),
      label: name,
      icon: "Folder",
      type: "user",
      section: "assign",
    };

    try {
      db.withTransactionSync(() => {
        db.runSync(
          "INSERT INTO folders (id, label, icon, type, section) VALUES (?, ?, ?, ?, ?)",
          newFolder.id,
          newFolder.label,
          newFolder.icon,
          newFolder.type,
          newFolder.section,
        );
        queueSync("INSERT", "folders", newFolder.id, newFolder, triggerSync);
      });
      setSharedFolders((prev) => [...prev, newFolder]);
    } catch (e) {
      console.error("Error adding shared folder: ", e);
    }
  };

  const migrateSharedFolder = async (folder: any) => {
    // No-op for now in the offline-first context since UI will just run standard inserts
  };

  const deleteSharedFolder = async (
    id: string,
    name: string,
    actor: string,
  ) => {
    try {
      db.withTransactionSync(() => {
        db.runSync("DELETE FROM folders WHERE id = ?", id);
        queueSync("DELETE", "folders", id, { id, name }, triggerSync);
      });
      setSharedFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error("Error deleting shared folder: ", e);
    }
  };

  return {
    clientProjects,
    sharedFolders,
    isLoaded,
    addClientProject,
    deleteClientProject,
    updateClientProject,
    addProjectMedia,
    addSharedFolder,
    migrateSharedFolder,
    deleteSharedFolder,
  };
};
