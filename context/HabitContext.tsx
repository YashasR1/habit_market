import React, { createContext, useContext } from "react";
import { Platform, Alert } from "react-native";

import { calculateCandle } from "../utils/habitMarketEngine";
import * as Haptics from "expo-haptics";
import { Sounds } from "../utils/sounds";
import { db, auth } from "../firebaseConfig";
import { signInAnonymously } from "firebase/auth";
import { setDoc, doc, serverTimestamp, getDoc } from "firebase/firestore";

// Hooks
import { useHabitPersistence } from "./hooks/useHabitPersistence";
import { useWeeklyStats } from "./hooks/useWeeklyStats";
import { defaultHabitContext } from "./HabitContextDefault";

const HabitContext = createContext<any>(defaultHabitContext);

export const HabitProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Persistence Hook
  const {
    dailyHabits,
    setDailyHabits,
    chartData,
    setChartData,
    habitHistory,
    setHabitHistory,
    userName,
    setUserName,
    isUsernameClaimed,
    setIsUsernameClaimed,
    userAvatar,
    setUserAvatar,
    isLoaded,
    notes,
    setNotes,
    folders,
    setFolders,
    // #2: Settings from persistence
    soundEnabled,
    setSoundEnabled,
    hapticsEnabled,
    setHapticsEnabled,
    resetAppData: resetPersistence,
  } = useHabitPersistence();

  const { calculateStreak, getWeeklyComparisonData, getWeeklyStats } =
    useWeeklyStats(dailyHabits, habitHistory);

  const resetAppData = async () => {
    const success = await resetPersistence();
    if (success) {
      // #2: Guard with hapticsEnabled
      if (hapticsEnabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const updateUserName = async (name: string) => {
    const formattedName = name.trim().toLowerCase();

    // WEB SIMULATION: Bypass Firebase auth completely and store temporarily
    if (Platform.OS === 'web') {
      setUserName(formattedName);
      setIsUsernameClaimed(true);
      try {
        sessionStorage.setItem('web_userName', formattedName);
      } catch (e) {
        console.warn("Could not save to sessionStorage", e);
      }
      return { success: true };
    }

    // Fallback if not specifically online
    try {
      if (!auth.currentUser) await signInAnonymously(auth);

      const userRef = doc(db, "users", formattedName);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists() && docSnap.data().uid !== auth.currentUser?.uid) {
        return { success: false, error: "Username is already taken globally." };
      }

      await setDoc(
        userRef,
        { uid: auth.currentUser?.uid, claimedAt: serverTimestamp() },
        { merge: true },
      );
      setUserName(formattedName);
      setIsUsernameClaimed(true);
      return { success: true };
    } catch (e: any) {
      console.warn("Firebase Sync Warning:", e.message);
      // Gracefully fallback to local storage if Firebase rejects the connection (e.g. Missing permissions rule)
      setUserName(formattedName);
      setIsUsernameClaimed(true);
      return { success: true, error: "Saved locally. Cloud sync is currently unavailable." };
    }
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
    const completionRate =
      habitsToUse.length > 0 ? completedCount / habitsToUse.length : 0;

    // Get the current chart history up to today for accurate cumulative metrics
    const chartHistory = chartData;

    // HIGH #1: Generate today's live candle (no hardcoded gap times, cumulative market rules)
    const todayCandle = calculateCandle(
      chartHistory,
      completionRate,
      habitsToUse.length,
    );

    // Update the last candle in the array with real-time data
    setChartData((prev) => {
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
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        "On the Mobile app, completing a habit permanently boosts your Streak score and affects your dynamic Market Cap on the Chart!\n\nDownload the App to start trading habits."
      );
      // We do not return early here anymore because we want sessionStorage to persist this state.
    }

    // #2: Guard haptics and sounds
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (soundEnabled) Sounds.playPop();

    // 1. Update Daily Habits + #4: Compute streak
    const baseCompleted = !dailyHabits.find((h: any) => h.id === id)?.completed;
    const updated = dailyHabits.map((h: any) =>
      h.id === id
        ? {
            ...h,
            completed: baseCompleted,
            streak: calculateStreak(id, habitHistory, baseCompleted),
          }
        : h,
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
      const activeCount = updated.filter(
        (h: any) => h.status === "active" || !h.status,
      ).length;
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
      const habitStr = dailyHabits.find((h: any) => h.id === habitId);
      if (habitStr) {
        const updated = dailyHabits.map((h: any) =>
          h.id === habitId ? { ...h, completed: !h.completed } : h,
        );
        setDailyHabits(updated);
        updateMarket(updated);
      }
    }
  };

  const pauseHabit = (id: string) => {
    setDailyHabits((prev: any) =>
      prev.map((h: any) =>
        h.id === id ? { ...h, status: "paused", completed: false } : h,
      ),
    );
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const resumeHabit = (id: string) => {
    setDailyHabits((prev: any) =>
      prev.map((h: any) => (h.id === id ? { ...h, status: "active" } : h)),
    );
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const archiveHabit = (id: string) => {
    setDailyHabits((prev: any) =>
      prev.map((h: any) =>
        h.id === id ? { ...h, status: "archived", completed: false } : h,
      ),
    );
    if (hapticsEnabled)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const addHabit = (title: string, icon: string) => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Simulation Mode",
        `Creating a new habit called "${title}"! In the real app, this will permanently sit on your dashboard and contribute to your Daily Closing Price.`
      );
      // Let local state mutate to allow sessionStorage to persist Web habits
    }

    const newHabit = {
      // Bug fix: concat two random strings to guarantee a reliably long unique ID
      id:
        Math.random().toString(36).substring(2) +
        Math.random().toString(36).substring(2),
      title,
      icon: icon || "Dumbbell",
      completed: false,
      status: "active",
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

  return (
    <HabitContext.Provider
      value={{
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
        userName,
        isUsernameClaimed,
        updateUserName,
        userAvatar,
        updateUserAvatar,
        pauseHabit,
        resumeHabit,
        archiveHabit,
        getWeeklyComparisonData,
        getWeeklyStats,
        isLoaded,
        // #2: Expose settings for profile screen
        soundEnabled,
        setSoundEnabled,
        hapticsEnabled,
        setHapticsEnabled,
        notes,
        setNotes,
        folders,
        setFolders,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = () => useContext(HabitContext);
