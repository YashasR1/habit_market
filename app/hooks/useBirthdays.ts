import { useState, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

export interface Birthday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  info: string;
}

export const useBirthdays = () => {
  const db = useSQLiteContext();
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);

  const fetchBirthdays = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<Birthday>('SELECT * FROM birthdays ORDER BY date ASC');
      setBirthdays(rows);
    } catch (error) {
      console.error('Error fetching birthdays:', error);
    }
  }, [db]);

  const addBirthday = async (name: string, date: string, info: string): Promise<string | null> => {
    try {
      const id = Crypto.randomUUID();
      await db.runAsync(
        'INSERT INTO birthdays (id, name, date, info) VALUES (?, ?, ?, ?)',
        id, name, date, info || ''
      );
      await fetchBirthdays();
      return id;
    } catch (error) {
      console.error('Error adding birthday:', error);
      return null;
    }
  };

  const deleteBirthday = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM birthdays WHERE id = ?', id);
      await fetchBirthdays();
    } catch (error) {
      console.error('Error deleting birthday:', error);
    }
  };

  return {
    birthdays,
    fetchBirthdays,
    addBirthday,
    deleteBirthday
  };
};
