export const useProjectMedia = (
    db: any,
    setClientProjects: React.Dispatch<React.SetStateAction<any[]>>,
    queueSync: (operation: string, tableName: string, recordId: string, payload: any, triggerSyncFn?: () => void) => Promise<void>,
    triggerSync?: () => void
) => {

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
        if (db) {
            const row = await db.getFirstAsync(
              "SELECT media FROM client_projects WHERE id = ?",
              projectId,
            );
            if (row) {
              const arr = row.media ? JSON.parse(row.media) : [];
              arr.push(mediaItem);
              await db.runAsync(
                "UPDATE client_projects SET media=? WHERE id=?",
                JSON.stringify(arr),
                projectId,
              );
              await queueSync(
                "UPDATE",
                "client_projects",
                projectId,
                { ...row, media: JSON.stringify(arr) },
                triggerSync,
              );
            }
        }

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
        if (!db) return;
        const row = await db.getFirstAsync(
          "SELECT media FROM client_projects WHERE id = ?",
          projectId,
        );
        if (row) {
          const arr = row.media ? JSON.parse(row.media) : [];
          // Filter out the media by matching URL
          const newArr = arr.filter((m: any) => m.url !== mediaUrl);
          
          await db.runAsync(
            "UPDATE client_projects SET media=? WHERE id=?",
            JSON.stringify(newArr),
            projectId,
          );
          await queueSync(
            "UPDATE",
            "client_projects",
            projectId,
            { ...row, media: JSON.stringify(newArr) },
            triggerSync,
          );
        }

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

  const removeProjectMedia = async (
    projectId: string,
    urlIndex: number, // Use index to safely remove exact item if URLs are same
    actor: string,
  ) => {
    try {
        if (!db) return;
        const row = await db.getFirstAsync(
          "SELECT media FROM client_projects WHERE id = ?",
          projectId,
        );
        if (row) {
          const arr = row.media ? JSON.parse(row.media) : [];
          // Filter out the media by matching URL
          const newArr = arr.filter((_: any, idx: number) => idx !== urlIndex);
          
          await db.runAsync(
            "UPDATE client_projects SET media=? WHERE id=?",
            JSON.stringify(newArr),
            projectId,
          );
          await queueSync(
            "UPDATE",
            "client_projects",
            projectId,
            { ...row, media: JSON.stringify(newArr) },
            triggerSync,
          );
        }

      setClientProjects((prev) =>
        prev.map((p) => {
          if (p.id === projectId) {
            return {
              ...p,
              media: (p.media || []).filter((_: any, idx: number) => idx !== urlIndex),
            };
          }
          return p;
        }),
      );
    } catch (e) {
      console.error("Error deleting media: ", e);
    }
  };

  return { addProjectMedia, deleteProjectMedia, removeProjectMedia };
};
