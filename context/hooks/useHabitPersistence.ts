import { useState, useEffect } from 'react';
import { db } from '../db';
import { Candle } from '../../utils/habitMarketEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_FOLDERS = [
    { id: 'all', label: 'All Notes', icon: 'Folder', type: 'system', section: 'library' }, 
    { id: 'idea', label: 'Ideas', icon: 'PenTool', type: 'user', section: 'library' },
    { id: 'note', label: 'Daily', icon: 'FileText', type: 'user', section: 'library' },
    { id: 'todo', label: 'To-Do', icon: 'FileText', type: 'user', section: 'library' },
];

export const useHabitPersistence = () => {
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
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (isLoaded) {
      saveDataToSQLite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyHabits, chartData, lastUpdated, habitHistory, userName, isUsernameClaimed, userAvatar, notes, folders, soundEnabled, hapticsEnabled, isLoaded]);

  const loadDataFromSQLite = () => {
    try {
      // 1. Settings
      const settingsRows = db.getAllSync<{key: string, value: string}>('SELECT * FROM settings;');
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
      const loadedHabits = db.getAllSync<any>('SELECT * FROM habits;');
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
      const loadedChart = db.getAllSync<any>('SELECT * FROM chart_data ORDER BY timestamp ASC;');
      setChartData(loadedChart);

      // 4. Habit History
      const loadedHistoryRows = db.getAllSync<{dateKey: string, payload: string}>('SELECT * FROM habit_history;');
      const historyMap: any = {};
      loadedHistoryRows.forEach(r => {
          historyMap[r.dateKey] = JSON.parse(r.payload);
      });
      setHabitHistory(historyMap);

      // 5. Folders
      const loadedFolders = db.getAllSync<any>('SELECT * FROM folders;');
      if (loadedFolders.length > 0) {
          setFolders(loadedFolders);
      } else {
          setFolders(DEFAULT_FOLDERS);
      }

      // 6. Notes
      const loadedNotes = db.getAllSync<any>('SELECT * FROM notes ORDER BY date DESC;');
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

  const saveDataToSQLite = () => {
    try {
      db.withTransactionSync(() => {
        // 1. Settings Upsert
        const settingsToSave = [
            { key: 'userName', val: userName },
            { key: 'isUsernameClaimed', val: isUsernameClaimed ? 'true' : 'false' },
            { key: 'userAvatar', val: userAvatar },
            { key: 'soundEnabled', val: soundEnabled ? 'true' : 'false' },
            { key: 'hapticsEnabled', val: hapticsEnabled ? 'true' : 'false' },
            { key: 'lastUpdated', val: lastUpdated }
        ];
        settingsToSave.forEach(s => {
            db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', s.key, s.val);
        });

        // 2. Habits (clear and insert to handle deletions cleanly for now)
        db.runSync('DELETE FROM habits');
        const stmtHabit = db.prepareSync('INSERT INTO habits (id, title, icon, completed, status, streak) VALUES (?, ?, ?, ?, ?, ?)');
        dailyHabits.forEach(h => {
            stmtHabit.executeSync([h.id, h.title, h.icon, h.completed ? 1 : 0, h.status || 'active', h.streak || 0]);
        });

        // 3. Chart Data
        db.runSync('DELETE FROM chart_data');
        const trimmedChartData = chartData.length > 90 ? chartData.slice(-90) : chartData;
        const stmtChart = db.prepareSync('INSERT INTO chart_data (timestamp, actualRate, open, high, low, close) VALUES (?, ?, ?, ?, ?, ?)');
        trimmedChartData.forEach(c => {
            stmtChart.executeSync([c.timestamp, c.actualRate || 0, c.open, c.high, c.low, c.close]);
        });

        // 4. Habit History
        db.runSync('DELETE FROM habit_history');
        const stmtHist = db.prepareSync('INSERT INTO habit_history (dateKey, payload) VALUES (?, ?)');
        Object.entries(habitHistory).forEach(([dateKey, payload]) => {
            stmtHist.executeSync([dateKey, JSON.stringify(payload)]);
        });

        // 5. Folders
        db.runSync('DELETE FROM folders');
        const stmtFolder = db.prepareSync('INSERT INTO folders (id, label, icon, type, section) VALUES (?, ?, ?, ?, ?)');
        folders.filter((f: any) => f.section === 'library').forEach(f => {
            stmtFolder.executeSync([f.id, f.label, f.icon, f.type, f.section]);
        });

        // 6. Notes
        db.runSync('DELETE FROM notes');
        const stmtNote = db.prepareSync('INSERT INTO notes (id, title, content, type, date, media) VALUES (?, ?, ?, ?, ?, ?)');
        notes.forEach(n => {
            stmtNote.executeSync([n.id, n.title, n.content, n.type, n.date, n.media ? JSON.stringify(n.media) : '[]']);
        });
      });
    } catch (e) {
      console.error("Failed to save data to SQLite", e);
    }
  };

  const resetAppData = async () => {
      try {
          db.withTransactionSync(() => {
              db.runSync('DELETE FROM habits');
              db.runSync('DELETE FROM chart_data');
              db.runSync('DELETE FROM habit_history');
              db.runSync('DELETE FROM settings');
              db.runSync('DELETE FROM folders');
              db.runSync('DELETE FROM notes');
              db.runSync('DELETE FROM client_projects');
              db.runSync('DELETE FROM sync_queue');
          });
          
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
