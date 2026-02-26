import React, { createContext, useContext } from 'react';

import { calculateCandle } from '../utils/habitMarketEngine';
import * as Haptics from 'expo-haptics';
import { Sounds } from '../utils/sounds';
import { db } from '../firebaseConfig';

import { collection, onSnapshot, query, orderBy, limit, setDoc, doc, serverTimestamp } from 'firebase/firestore';

// Hooks
import { useHabitPersistence } from './hooks/useHabitPersistence';
import { useClientProjects } from './hooks/useClientProjects';
import { useWeeklyStats } from './hooks/useWeeklyStats';
import { NotificationService } from '../utils/NotificationService';
import { defaultHabitContext } from './HabitContextDefault';
import { useSyncEngine } from './syncEngine';

const HabitContext = createContext<any>(defaultHabitContext);

export const HabitProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Persistence Hook
  const {
      dailyHabits, setDailyHabits,
      chartData, setChartData,
      habitHistory, setHabitHistory,
      userName, setUserName,
      userAvatar, setUserAvatar,
      notes, setNotes,
      folders, setFolders,
      isLoaded,
      // #2: Settings from persistence
      soundEnabled, setSoundEnabled,
      hapticsEnabled, setHapticsEnabled,
      resetAppData: resetPersistence
  } = useHabitPersistence();

  // 4. Background Sync Engine
  const { isOnline, isSyncing, triggerSync } = useSyncEngine();

  // 2. Client Projects Hook
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

  // 3. Weekly Stats Hook
  const { calculateStreak, getWeeklyComparisonData, getWeeklyStats } = useWeeklyStats(dailyHabits, habitHistory);

  // --- MIGRATION: Local Assign folders -> Firestore ---
  React.useEffect(() => {
    if (isLoaded && folders.length > 0) {
        const localAssignFolders = folders.filter(f => f.section === 'assign');
        if (localAssignFolders.length > 0) {
            console.log("Migrating local ASSIGN folders to cloud...");
            localAssignFolders.forEach(async (folder) => {
                await migrateSharedFolder(folder);
            });
            // Clear them from local state so we don't migrate again
            setFolders(prev => prev.filter(f => f.section !== 'assign'));
        }
    }
  }, [isLoaded, folders, migrateSharedFolder, setFolders]);

  // --- NOTIFICATIONS: Listen for peer activity ---
  React.useEffect(() => {
    if (!isLoaded) return;

    // 1. Initialise Notification Permissions and get token
    NotificationService.registerForPushNotificationsAsync().then(async (token) => {
      if (token && userName) {
        // Save the token to Firestore to enable background push notifications
        try {
          await setDoc(doc(db, "user_tokens", userName), { 
            token, 
            updatedAt: serverTimestamp() 
          });
          console.log(`Token saved to cloud for ${userName}`);
        } catch (e) {
          console.error("Failed to save push token:", e);
        }
      }
    });

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
                
                // Only notify if:
                // - It's from another user
                // - It's AFTER we started listening
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


  const resetAppData = async () => {
    const success = await resetPersistence();
    if (success) {
      // #2: Guard with hapticsEnabled
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const updateUserName = (name: string) => {
    setUserName(name);
  };

  const updateUserAvatar = (avatar: string) => {
    setUserAvatar(avatar);
  };
  
  // Function to update the "Market" whenever a task is toggled
  const updateMarket = (currentHabits?: any[]) => {
    // #2: Guard haptics and sounds
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soundEnabled) Sounds.playPop();

    const habitsToUse = currentHabits || dailyHabits;
    const completedCount = habitsToUse.filter((h: any) => h.completed).length; 
    const completionRate = habitsToUse.length > 0 ? completedCount / habitsToUse.length : 0;

    // Get the current chart history up to today for accurate cumulative metrics
    const chartHistory = chartData;
    
    // HIGH #1: Generate today's live candle (no hardcoded gap times, cumulative market rules)
    const todayCandle = calculateCandle(
      chartHistory,
      completionRate,
      habitsToUse.length
    );

    // Update the last candle in the array with real-time data
    setChartData(prev => {
        const todayDate = new Date().toDateString();
        // Determine if we have any data
        if (!prev || prev.length === 0) return [todayCandle];

        const lastCandle = prev[prev.length - 1];
        const lastCandleDate = new Date(lastCandle.timestamp).toDateString();
        
        if (lastCandleDate === todayDate) {
            // Update today's candle (replace last element)
            return [...prev.slice(0, -1), todayCandle];
        } else {
            // It's a new day, push a new candle
            return [...prev, todayCandle];
        }
    });
  };

  // Toggle a habit for "Today" (Home Screen)
  const toggleHabit = (id: string) => {
    // #2: Guard haptics and sounds
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soundEnabled) Sounds.playPop();

    // 1. Update Daily Habits + #4: Compute streak
    const baseCompleted = !dailyHabits.find((h: any) => h.id === id)?.completed;
    const updated = dailyHabits.map((h: any) =>
       h.id === id
         ? { ...h, completed: baseCompleted, streak: calculateStreak(id, habitHistory, baseCompleted) }
         : h
    );
    setDailyHabits(updated);

    // 2. Update Market
    updateMarket(updated);

    // 3. Sync with History
    const todayKey = new Date().toDateString();
    setHabitHistory((prev) => {
        const dayData = prev[todayKey] || {};
        const newDayData: Record<string, any> = { ...dayData };
        if (baseCompleted) {
            newDayData[id] = true;
        } else {
            delete newDayData[id];
        }
        // Store total active habits so historical bars are accurate
        const activeCount = updated.filter((h: any) => h.status === 'active' || !h.status).length;
        newDayData.__total = activeCount;
        return { ...prev, [todayKey]: newDayData };
    });
  };

  const toggleHistoryHabit = (dateKey: string, habitId: string) => {
    // #2: Guard haptics and sounds
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soundEnabled) Sounds.playPop();

    setHabitHistory((prev) => {
        const dayData = prev[dateKey] || {};
        const isCompleted = dayData[habitId];
        
        const newDayData = { ...dayData };
        if (isCompleted) {
            delete newDayData[habitId];
        } else {
            newDayData[habitId] = true;
        }
        
        const newHistory = { ...prev, [dateKey]: newDayData };

        return newHistory;
    });
    
    // Perform Sync for Today *outside* the setter to be safe with side effects
    const todayKey = new Date().toDateString();
    if (dateKey === todayKey) {
        // We act on the *current* known state of dailyHabits
        // This assumes dailyHabits is up to date when this function is called.
        const habitStr = dailyHabits.find((h:any) => h.id === habitId);
        if (habitStr) {
           const updated = dailyHabits.map((h: any) => 
               h.id === habitId ? { ...h, completed: !h.completed } : h
           );
           setDailyHabits(updated);
           updateMarket(updated);
        }
    }
  };

  const pauseHabit = (id: string) => {
      setDailyHabits((prev: any) => prev.map((h: any) => h.id === id ? { ...h, status: 'paused', completed: false } : h));
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resumeHabit = (id: string) => {
      setDailyHabits((prev: any) => prev.map((h: any) => h.id === id ? { ...h, status: 'active' } : h));
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const archiveHabit = (id: string) => {
      setDailyHabits((prev: any) => prev.map((h: any) => h.id === id ? { ...h, status: 'archived', completed: false } : h));
      if (hapticsEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addHabit = (title: string, icon: string) => {
    const newHabit = {
      // Bug fix: concat two random strings to guarantee a reliably long unique ID
      id: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      title,
      icon: icon || 'Dumbbell',
      completed: false,
      status: 'active'
    };
    setDailyHabits((prev: any) => [...prev, newHabit]);
  };

  const removeHabit = (id: string) => {
    setDailyHabits((prev: any) => prev.filter((h: any) => h.id !== id));
    // #10: Purge this habit's ID from all historical records so it doesn't ghost
    setHabitHistory((prev) => {
        const cleaned: Record<string, Record<string, any>> = {};
        Object.entries(prev).forEach(([day, dayData]) => {
            const newDay = { ...dayData };
            delete newDay[id];
            cleaned[day] = newDay;
        });
        return cleaned;
    });
  };


  const addNote = (title: string, content: string, type: string = 'note') => {
      const newNote = {
          id: Math.random().toString(36).substring(7),
          title: title || 'Untitled',
          content: content || '',
          type,
          date: new Date().toISOString(),
          media: []
      };
      setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id: string, updates: any) => {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, date: new Date().toISOString() } : n));
  };

  const addNoteMedia = (noteId: string, mediaItem: { url: string; type: 'image' | 'video'; uploadedBy: string; uploadedAt: string }) => {
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, media: [...(n.media || []), mediaItem], date: new Date().toISOString() } : n));
  };

  const deleteNote = (id: string) => {
      setNotes(prev => prev.filter(n => n.id !== id));
  };


  const addFolder = (name: string, section: string = 'library') => {
      if (section === 'assign') {
          addSharedFolder(name, userName);
      } else {
          const newFolder = {
              id: Math.random().toString(36).substring(7),
              label: name,
              icon: 'Folder', // Default icon
              type: 'user',
              section // 'library' or 'assign'
          };
          setFolders(prev => [...prev, newFolder]);
      }
  };

  const deleteFolder = (id: string, name: string) => {
      // 1. Check if it's a shared folder or local one
      const isShared = sharedFolders.some(f => f.id === id);

      if (isShared) {
          deleteSharedFolder(id, name, userName);
      } else {
          setFolders(prev => prev.filter(f => f.id !== id));
      }

      // 2. Delete all notes/projects in that folder
      setNotes(prev => prev.filter(n => n.type !== id));
      
      const projectsToDelete = clientProjects.filter(p => p.folderId === id);
      projectsToDelete.forEach(p => {
          deleteClientProject(p.id, p.name, userName);
      });
  };

  return (
    <HabitContext.Provider value={{ 
      dailyHabits, 
      setDailyHabits, 
      chartData, 
      setChartData, 
      habitHistory,
      updateMarket, 
      toggleHabit,
      toggleHistoryHabit,
      addHabit,
      removeHabit,
      resetAppData,
      isLoaded: isLoaded && isProjectsLoaded,
      isOnline,
      isSyncing,
      userName,
      updateUserName,
      userAvatar,
      updateUserAvatar,
      pauseHabit,
      resumeHabit,
      archiveHabit,
      notes,
      addNote,
      updateNote,
      deleteNote,
      getWeeklyComparisonData,
      getWeeklyStats,
      folders: [...folders.filter(f => f.section !== 'assign'), ...sharedFolders],
      addFolder,
      deleteFolder,
      clientProjects,
      sharedFolders,
      addClientProject: (name: string, folderId: string) => addClientProject(name, folderId, userName),
      deleteClientProject: (id: string, name: string) => deleteClientProject(id, name, userName),
      updateClientProject: (id: string, name: string, updates: any) => updateClientProject(id, name, updates, userName),
      addProjectMedia: (projectId: string, projectName: string, mediaItem: any) => addProjectMedia(projectId, projectName, mediaItem, userName),
      addSharedFolder,
      migrateSharedFolder,
      addNoteMedia,
      // #2: Expose settings for profile screen
      soundEnabled, setSoundEnabled,
      hapticsEnabled, setHapticsEnabled,
    }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => useContext(HabitContext);
