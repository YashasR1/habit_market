import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { db as firebaseDb } from '../firebaseConfig';
import { db as sqliteDb } from './db';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export const useSyncEngine = () => {
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        // Listen to network state changes
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = !!state.isConnected && !!state.isInternetReachable;
            setIsOnline(online);
            if (online) {
                processSyncQueue();
            }
        });

        // Trigger initial sync attempt
        processSyncQueue();

        return () => unsubscribe();
    }, []);

    const processSyncQueue = async () => {
        if (isSyncing) return;
        setIsSyncing(true);

        try {
            // Get all pending operations chronologically
            const queue = sqliteDb.getAllSync<any>('SELECT * FROM sync_queue WHERE status = "pending" ORDER BY timestamp ASC;');
            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            for (const item of queue) {
                // Mark as processing
                sqliteDb.runSync('UPDATE sync_queue SET status = "processing" WHERE id = ?', item.id);

                try {
                    const payload = JSON.parse(item.payload);
                    const docRef = doc(firebaseDb, item.tableName, item.recordId);

                    if (item.operation === 'INSERT' || item.operation === 'UPDATE') {
                        // Merge payload with existing FireStore data to achieve an upsert (Last-Write-Wins)
                        await setDoc(docRef, payload, { merge: true });
                    } else if (item.operation === 'DELETE') {
                        await deleteDoc(docRef);
                    }

                    // Delete from queue on success
                    sqliteDb.runSync('DELETE FROM sync_queue WHERE id = ?', item.id);
                } catch (err) {
                    console.error('Sync item failed:', err);
                    // Revert to pending
                    sqliteDb.runSync('UPDATE sync_queue SET status = "pending" WHERE id = ?', item.id);
                }
            }
        } catch (error) {
            console.error('Queue processing failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    return { isOnline, isSyncing, triggerSync: processSyncQueue };
};
