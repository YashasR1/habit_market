import { useCallback } from 'react';

export const useWeeklyStats = (dailyHabits: any[], habitHistory: Record<string, Record<string, any>>) => {
  // #4: Helper to calculate streak for a habit from history
  const calculateStreak = useCallback((habitId: string, history: Record<string, Record<string, any>>, isCompletedToday: boolean): number => {
      let streak = isCompletedToday ? 1 : 0;
      const today = new Date();
      for (let i = 1; i <= 365; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toDateString();
          const dayData = history[key] || {};
          if (dayData[habitId] === true) {
              streak++;
          } else {
              break;
          }
      }
      return streak;
  }, []);

  // --- WEEKLY DATA AGGREGATION ---
  const getWeeklyComparisonData = useCallback(() => {
      const today = new Date();
      // Adjust to Monday (1) - Sunday (0)
      const day = today.getDay(); 
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      // Bug fix: use immutable constructor instead of mutating today with setDate
      const monday = new Date(today.getFullYear(), today.getMonth(), diff);
      
      const currentWeekData: number[] = [];
      const pastWeekData: number[] = [];

      // Helper to get score for a specific date string
      const getScore = (d: Date) => {
          const key = d.toDateString();
          const dayHistory = habitHistory[key] || {};
          // HIGH #3: Use stored __total for accurate historical denominator
          const completed = Object.keys(dayHistory).filter(k => k !== '__total').length;
          const total = (dayHistory as any).__total || dailyHabits.length || 1;
          return completed / total;
      };

      // Current Week (Mon -> Sun)
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          currentWeekData.push(getScore(d));
      }

      // Past Week (Mon - 7 -> Sun - 7)
      const pastMonday = new Date(monday);
      pastMonday.setDate(monday.getDate() - 7);
      
      for (let i = 0; i < 7; i++) {
          const d = new Date(pastMonday);
          d.setDate(pastMonday.getDate() + i);
          pastWeekData.push(getScore(d));
      }

      return { currentWeekData, pastWeekData };
  }, [dailyHabits, habitHistory]);

  const getWeeklyStats = useCallback(() => {
      const today = new Date();
      const currentDayIndex = today.getDay();
      const diff = today.getDate() - currentDayIndex + (currentDayIndex === 0 ? -6 : 1); 
      // Bug fix: use immutable constructor instead of mutating today with setDate
      const monday = new Date(today.getFullYear(), today.getMonth(), diff);

      let totalHabitsCount = 0;
      let completedCount = 0;
      // #11: Only track best/worst on days where there is actual tracked data
      let bestDay = { day: 'N/A', count: -1 };
      let worstDay = { day: 'N/A', count: Infinity };
      let daysWithData = 0;
      
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const key = d.toDateString();
          const dayHistory = habitHistory[key] || {};
          // #13: Filter out __total key when counting completions
          const count = Object.keys(dayHistory).filter(k => k !== '__total').length;
          
          if (d <= new Date()) {
             const dayTotal = (dayHistory as any).__total || dailyHabits.length || 1;
             totalHabitsCount += dayTotal;
             completedCount += count;

             // #11: Only compare days that have habit data at all
             if (count > 0 || (dayHistory as any).__total > 0) {
                 daysWithData++;
                 if (count > bestDay.count) bestDay = { day: dayNames[i], count };
                 if (count < worstDay.count) worstDay = { day: dayNames[i], count };
             }
          }
      }

      const completionRate = totalHabitsCount > 0 ? Math.round((completedCount / totalHabitsCount) * 100) : 0;

      // Calculate "Wins" (Top 3 Habits this week) — #13: exclude __total from iteration
      const habitScores: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const key = d.toDateString();
          const dayHistory = habitHistory[key] || {};
          Object.keys(dayHistory).filter(k => k !== '__total').forEach(habitId => {
              habitScores[habitId] = (habitScores[habitId] || 0) + 1;
          });
      }

      const wins = Object.entries(habitScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id, score]) => {
            const habit = dailyHabits.find((h:any) => h.id === id);
            return habit ? { ...habit, score } : null;
        })
        .filter(Boolean);

      return {
          completionRate,
          totalHabits: dailyHabits.filter((h:any) => h.status === 'active' || !h.status).length,
          // #11: Show 'N/A' when no data exists yet
          bestDay: daysWithData > 0 ? bestDay.day : 'N/A',
          worstDay: daysWithData > 0 ? worstDay.day : 'N/A',
          wins
      };
  }, [dailyHabits, habitHistory]);

  return { calculateStreak, getWeeklyComparisonData, getWeeklyStats };
};
