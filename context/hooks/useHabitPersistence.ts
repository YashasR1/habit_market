import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Candle } from '../../utils/habitMarketEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_FOLDERS = [
    { id: 'all', label: 'All Notes', icon: 'Folder', type: 'system', section: 'library' }, 
    { id: 'idea', label: 'Ideas', icon: 'PenTool', type: 'user', section: 'library' },
    { id: 'note', label: 'Daily', icon: 'FileText', type: 'user', section: 'library' },
    { id: 'todo', label: 'To-Do', icon: 'FileText', type: 'user', section: 'library' },
];

const DEFAULT_WEB_HABITS = [
    { id: 'web-habit-1', title: 'Read 10 Pages', icon: 'BookOpen', completed: false, status: 'active', streak: 0 },
    { id: 'web-habit-2', title: 'Drink Water', icon: 'Droplets', completed: false, status: 'active', streak: 0 },
    { id: 'web-habit-3', title: 'Workout', icon: 'Dumbbell', completed: false, status: 'active', streak: 0 }
];

export const useHabitPersistence = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const db = Platform.OS === 'web' ? null : useSQLiteContext();
  const [dailyHabits, setDailyHabits] = useState<any[]>([]);
  const [userName, setUserName] = useState('Trader');
  const [isUsernameClaimed, setIsUsernameClaimed] = useState(false);
  const [userAvatar, setUserAvatar] = useState('TrendingUp');

  // Historical chart data
  const [chartData, setChartData] = useState<Candle[]>([]);
  const [habitHistory, setHabitHistory] = useState<Record<string, Record<string, any>>>({});
  
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toDateString());
  const [isLoaded, setIsLoaded] = useState(false);

  // --- POD / NOTES LOGIC ---
  const [notes, setNotes] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>(DEFAULT_FOLDERS);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  // Load data on mount
  useEffect(() => {
    loadDataFromSQLite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveDataToSQLite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyHabits, chartData, lastUpdated, habitHistory, userName, isUsernameClaimed, userAvatar, notes, folders, soundEnabled, hapticsEnabled, isLoaded]);

  const loadDataFromSQLite = async () => {
    if (Platform.OS === 'web') {
      try {
        const storedName = sessionStorage.getItem('web_userName');
        if (storedName) {
            setUserName(storedName);
            setIsUsernameClaimed(true);
        }
        
        const storedHabits = sessionStorage.getItem('web_dailyHabits');
        if (storedHabits) {
            setDailyHabits(JSON.parse(storedHabits));
        } else {
            setDailyHabits(DEFAULT_WEB_HABITS);
            sessionStorage.setItem('web_dailyHabits', JSON.stringify(DEFAULT_WEB_HABITS));
        }
      } catch (e) {
        console.warn('Failed to access sessionStorage', e);
        setDailyHabits(DEFAULT_WEB_HABITS);
      }
      setIsLoaded(true);
      return;
    }
    
    try {
      if (!db) return;
      
      const settingsRows = await db.getAllAsync<{key: string, value: string}>('SELECT * FROM settings;');
      const settingsMap = settingsRows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as any);
      
      setUserName(settingsMap['userName'] || 'Trader');
      setIsUsernameClaimed(settingsMap['isUsernameClaimed'] === 'true');
      setUserAvatar(settingsMap['userAvatar'] || 'TrendingUp');
      setSoundEnabled(settingsMap['soundEnabled'] !== 'false');
      setHapticsEnabled(settingsMap['hapticsEnabled'] !== 'false');
      const storedLastUpdated = settingsMap['lastUpdated'] || new Date().toDateString();

      const today = new Date();
      const todayStr = today.toDateString();
      const lastUpdateDate = new Date(storedLastUpdated);

      // 2. Habits
      const loadedHabits = await db.getAllAsync<any>('SELECT * FROM habits;');
      let processedHabits = loadedHabits.map((h: any) => ({
          ...h,
          completed: h.completed === 1
      }));

      // Yearly/Daily Resets
      if (lastUpdateDate.getFullYear() < today.getFullYear()) {
          processedHabits = processedHabits.map((h: any) => ({ ...h, completed: false }));
          setHabitHistory({}); 
          setChartData([]);
          setLastUpdated(todayStr);
      } else if (storedLastUpdated !== todayStr) {
          processedHabits = processedHabits.map((h: any) => ({ ...h, completed: false }));
          setLastUpdated(todayStr);
      } else {
          setLastUpdated(storedLastUpdated);
      }
      
      if (processedHabits.length === 0) {
          // Default habits on first install
          processedHabits = [
              { id: '1', title: 'Sport', icon: 'Activity', completed: false, status: 'active' },
              { id: '2', title: 'Deepwork', icon: 'Monitor', completed: false, status: 'active' },
              { id: '3', title: 'Instrument', icon: 'Music', completed: false, status: 'active' },
          ];
      }
      setDailyHabits(processedHabits);

      // 3. Chart Data
      const loadedChart = await db.getAllAsync<any>('SELECT * FROM chart_data ORDER BY timestamp ASC;');
      setChartData(loadedChart);

      // 4. Habit History
      const loadedHistoryRows = await db.getAllAsync<{dateKey: string, payload: string}>('SELECT * FROM habit_history;');
      const historyMap: any = {};
      loadedHistoryRows.forEach(r => {
          historyMap[r.dateKey] = JSON.parse(r.payload);
      });
      setHabitHistory(historyMap);

      // 5. Folders
      const loadedFolders = await db.getAllAsync<any>('SELECT * FROM folders;');
      if (loadedFolders.length > 0) {
          setFolders(loadedFolders);
      } else {
          setFolders(DEFAULT_FOLDERS);
      }

      // 6. Notes
      const loadedNotes = await db.getAllAsync<any>('SELECT * FROM notes ORDER BY date DESC;');
      const parsedNotes = loadedNotes.map(n => ({
          ...n,
          media: n.media ? JSON.parse(n.media) : []
      }));
      setNotes(parsedNotes);

    } catch (e) {
      console.error("Failed to load data from SQLite", e);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveDataToSQLite = async () => {
    if (Platform.OS === 'web') {
        try {
            sessionStorage.setItem('web_dailyHabits', JSON.stringify(dailyHabits));
            sessionStorage.setItem('web_userName', userName);
            sessionStorage.setItem('web_isUsernameClaimed', String(isUsernameClaimed));
        } catch (e) {
            console.warn('Failed to save to sessionStorage', e);
        }
        return; // We do not alert on save in web since it triggers constantly. Mutations themselves will alert.
    }
    
    try {
        if (!db) return;
        // 1. Settings Upsert
        const settingsToSave = [
            { key: 'userName', val: userName },
            { key: 'isUsernameClaimed', val: isUsernameClaimed ? 'true' : 'false' },
            { key: 'userAvatar', val: userAvatar },
            { key: 'soundEnabled', val: soundEnabled ? 'true' : 'false' },
            { key: 'hapticsEnabled', val: hapticsEnabled ? 'true' : 'false' },
            { key: 'lastUpdated', val: lastUpdated }
        ];
        for (const s of settingsToSave) {
            await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', s.key, s.val);
        }

        // 2. Habits
        await db.runAsync('DELETE FROM habits');
        for (const h of dailyHabits) {
            await db.runAsync('INSERT OR REPLACE INTO habits (id, title, icon, completed, status, streak) VALUES (?, ?, ?, ?, ?, ?)', h.id, h.title, h.icon, h.completed ? 1 : 0, h.status || 'active', h.streak || 0);
        }

        // 3. Chart Data
        await db.runAsync('DELETE FROM chart_data');
        const trimmedChartData = chartData.length > 90 ? chartData.slice(-90) : chartData;
        for (const c of trimmedChartData) {
            await db.runAsync('INSERT OR REPLACE INTO chart_data (timestamp, actualRate, open, high, low, close) VALUES (?, ?, ?, ?, ?, ?)', c.timestamp, c.actualRate || 0, c.open, c.high, c.low, c.close);
        }

        // 4. Habit History
        await db.runAsync('DELETE FROM habit_history');
        for (const [dateKey, payload] of Object.entries(habitHistory)) {
            await db.runAsync('INSERT OR REPLACE INTO habit_history (dateKey, payload) VALUES (?, ?)', dateKey, JSON.stringify(payload));
        }

        // 5. Folders
        await db.runAsync('DELETE FROM folders');
        for (const f of folders.filter((f: any) => f.section === 'library')) {
            await db.runAsync('INSERT OR REPLACE INTO folders (id, label, icon, type, section) VALUES (?, ?, ?, ?, ?)', f.id, f.label, f.icon, f.type, f.section);
        }

        // 6. Notes
        await db.runAsync('DELETE FROM notes');
        for (const n of notes) {
            await db.runAsync('INSERT OR REPLACE INTO notes (id, title, content, type, date, media) VALUES (?, ?, ?, ?, ?, ?)', n.id, n.title, n.content, n.type, n.date, n.media ? JSON.stringify(n.media) : '[]');
        }
    } catch (e) {
      console.error("Failed to save data to SQLite", e);
    }
  };

  const resetAppData = async () => {
      if (Platform.OS === 'web' || !db) {
          setDailyHabits([]);
          setHabitHistory({});
          setChartData([]);
          setNotes([]);
          setFolders(DEFAULT_FOLDERS);
          return;
      }
      
      try {
              await db.runAsync('DELETE FROM habits');
              await db.runAsync('DELETE FROM chart_data');
              await db.runAsync('DELETE FROM habit_history');
              await db.runAsync('DELETE FROM settings');
              await db.runAsync('DELETE FROM folders');
              await db.runAsync('DELETE FROM notes');
              await db.runAsync('DELETE FROM client_projects');
              await db.runAsync('DELETE FROM sync_queue');
          
          setDailyHabits([]);
          setHabitHistory({});
          setChartData([]);
          setNotes([]);
          setFolders(DEFAULT_FOLDERS);
          setUserName('Trader');
          setIsUsernameClaimed(false);
          setUserAvatar('TrendingUp');
          setSoundEnabled(true);
          setHapticsEnabled(true);
          
          await AsyncStorage.removeItem('MARHABS_DATA_V1');
          return true;
      } catch (e) {
          console.error("Failed to reset app data", e);
          return false;
      }
  };

  return {
    dailyHabits, setDailyHabits,
    chartData, setChartData,
    habitHistory, setHabitHistory,
    userName, setUserName,
    isUsernameClaimed, setIsUsernameClaimed,
    userAvatar, setUserAvatar,
    notes, setNotes,
    folders, setFolders,
    soundEnabled, setSoundEnabled,
    hapticsEnabled, setHapticsEnabled,
    isLoaded,
    resetAppData
  };
};
