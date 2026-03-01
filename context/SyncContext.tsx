import React, { createContext, useContext, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { signInAnonymously } from 'firebase/auth';
import { useSyncEngine as useSyncEngineHook } from './syncEngine';

const SyncContext = createContext<any>(null);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
    // 1. Background Sync Engine
    const { isOnline, isSyncing, triggerSync } = useSyncEngineHook();

    // --- AUTHENTICATION ---
    useEffect(() => {
        signInAnonymously(auth).catch(err => console.error("Anonymous auth failed:", err));
    }, []);

    return (
        <SyncContext.Provider value={{
            isOnline,
            isSyncing,
            triggerSync
        }}>
            {children}
        </SyncContext.Provider>
    );
};

export const useSync = () => useContext(SyncContext);
