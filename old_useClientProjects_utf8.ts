import { useState, useEffect } from "react";
import { useSQLiteContext } from "expo-sqlite";

export const useClientProjects = (triggerSync?: () => void) => {
  const db = useSQLiteContext();
  const [clientProjects, setClientProjects] = useState<any[]>([]);
  const [sharedFolders, setSharedFolders] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadFromSQLite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Defer triggerSync to AFTER the current SQLite transaction closes.
      // Calling it synchronously inside withTransactionSync causes a NullPointerException
      // on Android because expo-sqlite doesn't allow nested transactions.
      if (triggerSyncFn) setTimeout(triggerSyncFn, 0);
    } catch (e) {
      console.error("Failed to queue sync", e);
    }
  };

  const addClientProject = async (
    name: string,
    folderId: string,
    actor: string,
    assignedTo?: string,
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
      assignedTo: assignedTo || null,
      createdBy: actor,
    };

    try {
      db.withTransactionSync(() => {
        db.runSync(
          "INSERT INTO client_projects (id, name, type, folderId, content, checklist, media, lastEditedBy, lastEditedAt, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          newProject.id,
          newProject.name,
          null,
          newProject.folderId,
          newProject.content,
          "[]",
          "[]",
          newProject.lastEditedBy,
          newProject.lastEditedAt,
          newProject.assignedTo,
          newProject.createdBy,
        );
        queueSync("INSERT", "client_projects", newProject.id, newProject);
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
        queueSync("DELETE", "client_projects", id, { id, name }, triggerSync);
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
            "client_projects",
            id,
            merged,
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
            "client_projects",
            projectId,
            { ...row, media: JSON.stringify(arr) },
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

  const deleteProjectMedia = async (
    projectId: string,
    projectName: string,
    mediaUrl: string,
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
          // Filter out the media by matching URL
          const newArr = arr.filter((m: any) => m.url !== mediaUrl);
          
          db.runSync(
            "UPDATE client_projects SET media=? WHERE id=?",
            JSON.stringify(newArr),
            projectId,
          );
          queueSync(
            "UPDATE",
            "client_projects",
            projectId,
            { ...row, media: JSON.stringify(newArr) },
            triggerSync,
          );
        }
      });

      setClientProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              media: (p.media || []).filter((m: any) => m.url !== mediaUrl),
            };
          }
          return p;
        }),
      );
    } catch (e) {
      console.error("Error deleting media: ", e);
    }
  };

  const addSharedFolder = async (name: string, actor: string, assignedTo?: string) => {
    const newFolder = {
      id: Math.random().toString(36).substring(2),
      label: name,
      icon: "Folder",
      type: "user",
      section: "assign",
      assignedTo: assignedTo || null,
      createdBy: actor,
    };

    try {
      db.withTransactionSync(() => {
        db.runSync(
          "INSERT INTO folders (id, label, icon, type, section, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
          newFolder.id,
          newFolder.label,
          newFolder.icon,
          newFolder.type,
          newFolder.section,
          newFolder.assignedTo,
          newFolder.createdBy,
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
    deleteProjectMedia,
    addSharedFolder,
    migrateSharedFolder,
    deleteSharedFolder,
  };
};
