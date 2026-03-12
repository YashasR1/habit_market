import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { auth, db as firebaseDb } from '../firebaseConfig';
import { Platform } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const MAX_RETRIES = 3;

export const useSyncEngine = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const sqliteDb = Platform.OS === 'web' ? null : useSQLiteContext();
    const [isOnline, setIsOnline] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const isSyncingRef = useRef(false);

    useEffect(() => {
        //Listen to network state changes to track the `isOnline` boolean natively
        const unsubscribeNet = NetInfo.addEventListener(state => {
            const online = !!state.isConnected && !!state.isInternetReachable;
            setIsOnline(online);
        });

        // Listen to Firebase Auth state just to trigger the very first boot sync
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
            if (user && isOnline) {
                processSyncQueue();
            }
        });

        return () => {
            unsubscribeNet();
            unsubscribeAuth();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOnline]);

    const processSyncQueue = useCallback(async () => {
        // Wait for Firebase Auth to be ready before writing to Firestore.
        // Without this, syncs that fire on mount race against signInAnonymously
        // and fail with "Missing or insufficient permissions".
        if (Platform.OS === 'web' || !auth.currentUser || !sqliteDb) {
            console.log('[SYNC] Deferring sync (Web/Auth/DB not ready)...');
            return;
        }
        if (isSyncingRef.current) return;
        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            // Get all pending operations chronologically (skip permanently failed ones)
            const queue = await sqliteDb.getAllAsync<any>(
                "SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY timestamp ASC;"
            );
            if (queue.length === 0) {
                setIsSyncing(false);
                return;
            }

            for (const item of queue) {
                // Mark as processing
                await sqliteDb.runAsync("UPDATE sync_queue SET status = 'processing' WHERE id = ?", item.id);

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
                    await sqliteDb.runAsync('DELETE FROM sync_queue WHERE id = ?', item.id);
                } catch (err: any) {
                    const retryCount = (item.retryCount || 0) + 1;
                    
                    if (retryCount >= MAX_RETRIES) {
                        // Permanently mark as failed so it stops retrying
                        if (!err.message?.includes('permissions')) {
                            console.warn(`[SYNC] Item ${item.id} (${item.tableName}) permanently failed after ${MAX_RETRIES} attempts:`, err.message);
                        }
                        await sqliteDb.runAsync(
                            "UPDATE sync_queue SET status = 'failed', retryCount = ? WHERE id = ?",
                            retryCount, item.id
                        );
                    } else {
                        // Revert to pending for next attempt
                        if (!err.message?.includes('permissions')) {
                            console.warn(`[SYNC] Item ${item.id} failed (attempt ${retryCount}/${MAX_RETRIES}):`, err.message);
                        }
                        
                        await sqliteDb.runAsync(
                            "UPDATE sync_queue SET status = 'pending', retryCount = ? WHERE id = ?",
                            retryCount, item.id
                        );
                    }
                }
            }
        } catch (error) {
            console.error('Queue processing failed:', error);
        } finally {
            // Force the UI spinner off even if there are pending items waiting for permissions
            setIsSyncing(false);
            
            // Add a mandatory 10-second cooldown before the next sync loop can begin 
            // This prevents the infinite "Syncing..." UI spinner from thrashing if Firebase is locked
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 10000);
        }
    }, [sqliteDb]);

    return { isOnline, isSyncing, triggerSync: processSyncQueue };
};
