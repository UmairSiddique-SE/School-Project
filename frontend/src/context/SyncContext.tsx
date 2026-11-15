import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '@/api/apiClient';
import { toast } from 'sonner';
import {
  getQueuedOperations,
  removeQueuedOperation,
  type QueuedOperation,
} from '@/services/offlineQueue';

interface SyncContextType {
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
  pendingQueue: QueuedOperation[];
}

const SyncContext = createContext<SyncContextType>({
  isOnline: true,
  queuedCount: 0,
  isSyncing: false,
  syncNow: async () => {},
  pendingQueue: [],
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [pendingQueue, setPendingQueue] = useState<QueuedOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Refresh current queue state from IndexedDB
  const refreshQueue = useCallback(async () => {
    const ops = await getQueuedOperations();
    setPendingQueue(ops);
    setQueuedCount(ops.length);
  }, []);

  // Process and sync all queued operations to the cloud
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    const ops = await getQueuedOperations();
    if (ops.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    let failCount = 0;

    for (const op of ops) {
      try {
        await apiClient({
          method: op.method,
          url: op.url,
          data: op.payload,
        });
        await removeQueuedOperation(op.id);
        successCount++;
      } catch (err: any) {
        console.error(`[OfflineSync] Failed to sync ${op.label}:`, err);
        failCount++;
      }
    }

    await refreshQueue();
    setIsSyncing(false);

    if (successCount > 0) {
      toast.success(
        `✓ ${successCount} offline operation${successCount > 1 ? 's' : ''} synced to cloud!`
      );
    }
    if (failCount > 0) {
      toast.error(
        `${failCount} operation${failCount > 1 ? 's' : ''} could not sync yet. Will retry automatically.`
      );
    }
  }, [isSyncing, refreshQueue]);

  // Listen to network status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet connection restored. Synchronizing pending operations...');
      void syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Any changes will be saved locally and synced when online.');
    };

    const handleQueueUpdated = () => {
      void refreshQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('schoolos:offline-queue-updated', handleQueueUpdated);

    void refreshQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('schoolos:offline-queue-updated', handleQueueUpdated);
    };
  }, [refreshQueue, syncNow]);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        queuedCount,
        isSyncing,
        syncNow,
        pendingQueue,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};
