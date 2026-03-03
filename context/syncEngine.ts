import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { auth, db as firebaseDb } from '../firebaseConfig';
import { useSQLiteContext } from 'expo-sqlite';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const MAX_RETRIES = 3;

export const useSyncEngine = () => {
    const sqliteDb = useSQLiteContext();
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const isSyncingRef = useRef(false);

    useEffect(() => {
        // Listen to Firebase Auth state instead of just triggering immediately
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user && isOnline) {
                processSyncQueue();
            }
        });

        // Listen to network state changes
        const unsubscribeNet = NetInfo.addEventListener(state => {
            const online = !!state.isConnected && !!state.isInternetReachable;
            setIsOnline(online);
            if (online && auth.currentUser) {
                processSyncQueue();
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeNet();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const processSyncQueue = useCallback(async () => {
        // Wait for Firebase Auth to be ready before writing to Firestore.
        // Without this, syncs that fire on mount race against signInAnonymously
        // and fail with "Missing or insufficient permissions".
        if (!auth.currentUser) {
            console.log('[SYNC] Auth not ready, deferring sync...');
            return;
        }
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            // Get all pending operations chronologically (skip permanently failed ones)
            const queue = sqliteDb.getAllSync<any>(
                'SELECT * FROM sync_queue WHERE status = "pending" ORDER BY timestamp ASC;'
            );
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
                        // Conflict Resolution: Last-Writer-Wins
                        const currentDoc = await getDoc(docRef);
                        let shouldSync = true;
                        
                        if (currentDoc.exists() && payload.lastEditedAt) {
                            const cloudData = currentDoc.data();
                            if (cloudData.lastEditedAt && new Date(cloudData.lastEditedAt) > new Date(payload.lastEditedAt)) {
                                console.log(`[SYNC] Conflict detected for ${item.recordId}. Cloud version is newer. Skipping local update.`);
                                shouldSync = false;
                            }
                        }

                        if (shouldSync) {
                            // Merge payload with existing FireStore data to achieve an upsert
                            await setDoc(docRef, payload, { merge: true });
                        }
                    } else if (item.operation === 'DELETE') {
                        await deleteDoc(docRef);
                    }

                    // Delete from queue on success
                    sqliteDb.runSync('DELETE FROM sync_queue WHERE id = ?', item.id);
                } catch (err: any) {
                    const retryCount = (item.retryCount || 0) + 1;
                    
                    if (retryCount >= MAX_RETRIES) {
                        // Permanently mark as failed so it stops retrying
                        console.warn(`[SYNC] Item ${item.id} (${item.tableName}) permanently failed after ${MAX_RETRIES} attempts:`, err.message);
                        sqliteDb.runSync(
                            'UPDATE sync_queue SET status = "failed", retryCount = ? WHERE id = ?',
                            retryCount, item.id
                        );
                    } else {
                        // Revert to pending for next attempt
                        console.warn(`[SYNC] Item ${item.id} failed (attempt ${retryCount}/${MAX_RETRIES}):`, err.message);
                        sqliteDb.runSync(
                            'UPDATE sync_queue SET status = "pending", retryCount = ? WHERE id = ?',
                            retryCount, item.id
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Queue processing failed:', error);
        } finally {
            setIsSyncing(false);
            isSyncingRef.current = false;
        }
    }, [sqliteDb]);

    return { isOnline, isSyncing, triggerSync: processSyncQueue };
};
