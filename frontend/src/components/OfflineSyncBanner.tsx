import React, { useState } from 'react';
import { useSync } from '@/context/SyncContext';
import { Wifi, WifiOff, RefreshCw, Database, ChevronUp, ChevronDown } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { isOnline, queuedCount, isSyncing, syncNow, pendingQueue } = useSync();
  const [isExpanded, setIsExpanded] = useState(false);

  // If online and no queued items, stay completely invisible so we don't clutter the UI
  if (isOnline && queuedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-border/80 bg-card/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold shadow-inner ${
              !isOnline
                ? 'bg-rose-500/15 text-rose-500'
                : isSyncing
                ? 'bg-amber-500/15 text-amber-500'
                : 'bg-emerald-500/15 text-emerald-500'
            }`}
          >
            {!isOnline ? (
              <WifiOff size={16} />
            ) : isSyncing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Wifi size={16} />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-foreground">
                {!isOnline ? 'Offline Mode Active' : isSyncing ? 'Syncing with Cloud...' : 'Online & Connected'}
              </span>
              {queuedCount > 0 && (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {queuedCount} queued
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {!isOnline
                ? 'Saved locally to IndexedDB'
                : isSyncing
                ? 'Uploading offline changes...'
                : `${queuedCount} pending sync items`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {queuedCount > 0 && isOnline && (
            <button
              onClick={() => void syncNow()}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-md shadow-cyan-500/20 hover:brightness-110 transition disabled:opacity-50"
              title="Force Sync Now"
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              Sync
            </button>
          )}

          {queuedCount > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
            >
              {isExpanded ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Pending Operations Drawer */}
      {isExpanded && queuedCount > 0 && (
        <div className="mt-3 border-t border-border/60 pt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[10px] font-black uppercase text-muted-foreground">
            <span className="flex items-center gap-1">
              <Database size={11} /> Queued Mutations
            </span>
            <span>{queuedCount} Total</span>
          </div>

          {pendingQueue.map((op) => (
            <div
              key={op.id}
              className="flex items-center justify-between rounded-xl bg-muted/40 p-2 text-xs border border-border/40"
            >
              <div className="truncate pr-2">
                <p className="font-bold text-foreground truncate">{op.label || op.url}</p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {op.method} • {new Date(op.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <span className="shrink-0 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {op.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
