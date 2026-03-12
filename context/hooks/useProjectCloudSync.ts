import { useEffect } from "react";
import { Platform, Alert } from "react-native";
import { collection, onSnapshot, query, where, getDocs, or } from "firebase/firestore";
import { db as firebaseDb } from "../../firebaseConfig";

export const useProjectCloudSync = (
    userName: string, 
    db: any, 
    isLoaded: boolean, 
    setClientProjects: React.Dispatch<React.SetStateAction<any[]>>,
    setSharedFolders: React.Dispatch<React.SetStateAction<any[]>>,
    loadFromSQLite: () => Promise<void>
) => {

  // --- CLOUD DELETION LISTENER: Prune Local SQLite directly when peers delete docs ---
  useEffect(() => {
    if (Platform.OS === 'web' || !db || !userName || userName === 'Trader' || !isLoaded) return;

    const projectsRef = collection(firebaseDb, "client_projects");
    const foldersRef = collection(firebaseDb, "folders");

    const projectsQuery = query(projectsRef, or(where("createdBy", "==", userName), where("assignedTo", "==", userName)));
    const foldersQuery = query(foldersRef, or(where("createdBy", "==", userName), where("assignedTo", "==", userName)));

    const unsubscribeProjects = onSnapshot(projectsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "removed") {
                const docId = change.doc.id;
                console.log(`[SYNC] Cloud deletion detected for project ${docId}. Scrubbing local SQLite.`);
                await db.runAsync("DELETE FROM client_projects WHERE id = ?", docId);
                setClientProjects((prev) => prev.filter((p) => p.id !== docId));
            }
        });
    });

    const unsubscribeFolders = onSnapshot(foldersQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "removed") {
                const docId = change.doc.id;
                console.log(`[SYNC] Cloud deletion detected for folder ${docId}. Scrubbing local SQLite.`);
                await db.runAsync("DELETE FROM folders WHERE id = ?", docId);
                setSharedFolders((prev) => prev.filter((f) => f.id !== docId));
            }
        });
    });

    return () => {
        unsubscribeProjects();
        unsubscribeFolders();
    };
  }, [userName, isLoaded, db, setClientProjects, setSharedFolders]);

  const fetchFromCloud = async (setCloudLoading: (loading: boolean) => void) => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        "Fetching from Cloud!\n\nIn the Mobile App, this connects to Firebase and securely pulls down any Folders or Projects where you are the Creator or the Assigned Trader, instantly populating your local SQLite database."
      );
      return;
    }
    
    if (!db || !userName || userName === 'Trader') return;
    
    setCloudLoading(true);
    try {
        // Fetch Projects
        const projectsRef = collection(firebaseDb, "client_projects");
        const projectsQuery = query(
            projectsRef,
            or(
                where("createdBy", "==", userName),
                where("assignedTo", "==", userName)
            )
        );
        const projectDocs = await getDocs(projectsQuery);
        
        let newProjectsFound = 0;
        for (const pt of projectDocs.docs) {
            const data = pt.data();
            // Check if it already exists locally
            const exists = await db.getFirstAsync("SELECT id FROM client_projects WHERE id = ?", data.id);
            if (!exists) {
                await db.runAsync(
                  "INSERT INTO client_projects (id, name, type, folderId, content, checklist, media, lastEditedBy, lastEditedAt, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  data.id, data.name, data.type || null, data.folderId, data.content || "", 
                  JSON.stringify(data.checklist || []), JSON.stringify(data.media || []), 
                  data.lastEditedBy || userName, data.lastEditedAt || new Date().toISOString(), 
                  data.assignedTo || null, data.createdBy || userName
                );
                newProjectsFound++;
            }
        }

        // Fetch Folders 
        const foldersRef = collection(firebaseDb, "folders");
        const foldersQuery = query(
            foldersRef,
            or(
                where("createdBy", "==", userName),
                where("assignedTo", "==", userName)
            )
        );
        const folderDocs = await getDocs(foldersQuery);
        
        for (const ft of folderDocs.docs) {
            const data = ft.data();
            const exists = await db.getFirstAsync("SELECT id FROM folders WHERE id = ?", data.id);
            if (!exists) {
                await db.runAsync(
                  "INSERT INTO folders (id, label, icon, type, section, assignedTo, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
                  data.id, data.label, data.icon || "Folder", data.type || "user", 
                  data.section || "assign", data.assignedTo || null, data.createdBy || userName
                );
            }
        }
        
        // Refresh local UI state after downloading
        if (newProjectsFound > 0 || folderDocs.size > 0) {
            await loadFromSQLite();
        }
    } catch (e: any) {
        console.error("Failed to fetch from cloud: ", e.message);
        if (e.message?.includes("index")) {
            Alert.alert("Database Index Required", "Firebase requires a composite index to run this query. Check your console logs for the build link.");
        }
    } finally {
        setCloudLoading(false);
    }
  };

  return { fetchFromCloud };
};
