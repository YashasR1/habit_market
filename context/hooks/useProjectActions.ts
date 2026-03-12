import { Platform, Alert } from "react-native";

export const useProjectActions = (
    db: any,
    setClientProjects: React.Dispatch<React.SetStateAction<any[]>>,
    queueSync: (operation: string, tableName: string, recordId: string, payload: any, triggerSyncFn?: () => void) => Promise<void>,
    triggerSync?: () => void
) => {

  const addClientProject = async (
    name: string,
    folderId: string,
    actor: string,
    assignedTo?: string,
  ) => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        `Creating project "${name}"!\n\nIn the Mobile App, this provisions a live synchronized database segment where you can upload attachments, manage subtasks, and collaborate with your Assigned trader in real-time.`
      );
      return Math.random().toString(36).substring(2); // Fake ID
    }

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
        if (db) {
            await db.runAsync(
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
            await queueSync("INSERT", "client_projects", newProject.id, newProject);
        }
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
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        `Deleting project "${name}"!\n\nIn the Mobile App, this permanently scrubs the project and all attached native file media from your device and the cloud.`
      );
      // Fallthrough to mutate local state for sessionStorage
    }

    try {
        if (db) {
            await db.runAsync("DELETE FROM client_projects WHERE id = ?", id);
            await queueSync("DELETE", "client_projects", id, { id, name }, triggerSync);
        }
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
    silent: boolean = false
  ) => {
    if (Platform.OS === "web" && !silent) {
      Alert.alert(
        "Simulation Mode",
        "Updating project details!\n\nIn the Mobile App, changes map directly to your local SQLite Database for instantaneous offline access while syncing silently in the background."
      );
      // Fallthrough to mutate local state for sessionStorage
    }

    // 1. Instantly locally mutate for snappy DOM performance
    setClientProjects((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, ...updates, lastEditedBy: actor, lastEditedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    if (!db) {
        return;
    }
    
    try {
        // Fetch existing first to merge (lazy approach since updates might be partial)
        const row = await db.getFirstAsync(
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
          await db.runAsync(
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
          await queueSync(
            "UPDATE",
            "client_projects",
            id,
            merged,
            triggerSync,
          );
        }

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

  return { addClientProject, deleteClientProject, updateClientProject };
};
