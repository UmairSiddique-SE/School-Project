/**
 * SchoolOS Offline Sync Engine
 * Uses browser IndexedDB to persist operations made while offline
 * and automatically drains & syncs them when the connection is restored.
 */

export interface QueuedOperation {
  id: string;
  /** Idempotency key — unique per mutation. Backend can use X-Idempotency-Key header to prevent duplicate processing. */
  idempotencyKey: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  label: string;
  category: 'ATTENDANCE' | 'STUDENT' | 'FINANCE' | 'EXAMS' | 'OTHER';
  retryCount: number;
  /** Max retries before marking as permanently failed */
  maxRetries: number;
  /** Whether this operation failed permanently after maxRetries */
  permanentlyFailed?: boolean;
}

const DB_NAME = 'SchoolOS_Offline_DB';
const DB_VERSION = 1;
const STORE_NAME = 'sync_queue';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Record a sync attempt. After maxRetries, the operation is kept but marked as
 * permanently failed so the UI can surface it instead of retrying forever.
 */
export async function markOperationAttempt(id: string, failed: boolean): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const op = request.result as QueuedOperation | undefined;
      if (!op) {
        resolve();
        return;
      }
      const retryCount = op.retryCount + (failed ? 1 : 0);
      const updated: QueuedOperation = {
        ...op,
        retryCount,
        permanentlyFailed: failed && retryCount >= op.maxRetries,
      };
      const put = store.put(updated);
      put.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('schoolos:offline-queue-updated'));
        resolve();
      };
      put.onerror = () => reject(put.error);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Add a mutation operation to the offline sync queue
 */
export async function queueOfflineOperation(
  op: Omit<QueuedOperation, 'id' | 'idempotencyKey' | 'timestamp' | 'retryCount' | 'maxRetries'>
): Promise<QueuedOperation> {
  const db = await openDatabase();
  const fullOp: QueuedOperation = {
    ...op,
    id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    // Idempotency key ties this exact mutation to a stable identity so that
    // if the same op is replayed on reconnect, the backend can deduplicate it.
    idempotencyKey: `idem_${op.url.replace(/\//g, '_')}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries: 3,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(fullOp);

    request.onsuccess = () => {
      window.dispatchEvent(new CustomEvent('schoolos:offline-queue-updated'));
      resolve(fullOp);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all queued operations waiting for sync
 */
export async function getQueuedOperations(): Promise<QueuedOperation[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

/**
 * Remove an operation after successful sync
 */
export async function removeQueuedOperation(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('schoolos:offline-queue-updated'));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore error if already deleted
  }
}

/**
 * Clear all queued operations
 */
export async function clearAllQueuedOperations(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('schoolos:offline-queue-updated'));
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore error
  }
}
