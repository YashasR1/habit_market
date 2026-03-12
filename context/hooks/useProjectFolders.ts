import { Platform, Alert } from "react-native";

export const useProjectFolders = (
    db: any,
    setSharedFolders: React.Dispatch<React.SetStateAction<any[]>>,
    queueSync: (operation: string, tableName: string, recordId: string, payload: any, triggerSyncFn?: () => void) => Promise<void>,
    triggerSync?: () => void
) => {

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

    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        "Creating folder!\n\nIn the Mobile App, this creates a new folder entry in your local SQLite Database and queues it for cloud synchronization."
      );
      // Fallthrough to mutate local state for sessionStorage
    }

    try {
        if (!db) return;
        await db.runAsync(
          "INSERT INTO folders (id, label, icon, type, section, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
          newFolder.id,
          newFolder.label,
          newFolder.icon,
          newFolder.type,
          newFolder.section,
          newFolder.assignedTo,
          newFolder.createdBy,
        );
        await queueSync("INSERT", "folders", newFolder.id, newFolder, triggerSync);
        setSharedFolders((prev: any) => [...prev, newFolder]);
    } catch (e) {
      console.error("Error adding shared folder: ", e);
    }
  };

  const migrateSharedFolder = async (folder: any) => {
    // No-op for now in the offline-first context since UI will just run standard inserts
  };

  const updateSharedFolder = async (id: string, name: string, assignedTo?: string) => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        "Updating folder!\n\nIn the Mobile App, this updates the folder entry in your local SQLite Database and queues it for cloud synchronization."
      );
    }

    try {
        if (!db) return;
        await db.runAsync(
          "UPDATE folders SET label = ?, assignedTo = ? WHERE id = ?",
          name,
          assignedTo || null,
          id
        );
        const updatedFields = { label: name, assignedTo: assignedTo || null };
        await queueSync("UPDATE", "folders", id, updatedFields, triggerSync);
        
        setSharedFolders((prev: any) => 
          prev.map((f: any) => f.id === id ? { ...f, ...updatedFields } : f)
        );
    } catch (e) {
      console.error("Error updating shared folder: ", e);
    }
  };

  const deleteSharedFolder = async (
    id: string,
    name: string,
    actor: string,
  ) => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        `Deleting folder "${name}"!\n\nCurrent projects inside will be preserved, but the structural hierarchy is permanently erased from your device.`
      );
      // Fallthrough to mutate local state for sessionStorage
    }

    try {
        if (!db) return;
        await db.runAsync("DELETE FROM folders WHERE id = ?", id);
        await queueSync("DELETE", "folders", id, { id, name }, triggerSync);
      setSharedFolders((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error("Error deleting shared folder: ", e);
    }
  };

  return { addSharedFolder, migrateSharedFolder, updateSharedFolder, deleteSharedFolder };
};
