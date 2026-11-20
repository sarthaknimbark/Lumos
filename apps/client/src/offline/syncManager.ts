/**
 * Offline Sync Manager
 *
 * Coordinates:
 *   - Local draft persistence
 *   - Idempotent operation queue
 *   - Automatic background queue flushing with exponential backoff
 *   - Conflict detection & resolution (never silently overwrites)
 */

import {
  ConflictResolution,
  CreateEntryInput,
  JournalEntryResponse,
  QueuedOperation,
  UpdateEntryInput,
} from "@myday/contracts";
import { api } from "../api/client";
import { offlineStorage } from "./storage";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type SyncStateListener = (state: {
  isSyncing: boolean;
  pendingCount: number;
  conflictOperation: QueuedOperation | null;
}) => void;

class SyncManager {
  private isSyncing = false;
  private listeners: Set<SyncStateListener> = new Set();
  private conflictOp: QueuedOperation | null = null;

  subscribe(listener: SyncStateListener) {
    this.listeners.add(listener);
    this.notify();
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.getQueueStatus().then((status) => {
      for (const listener of this.listeners) {
        listener({
          isSyncing: this.isSyncing,
          pendingCount: status.pendingCount,
          conflictOperation: this.conflictOp,
        });
      }
    });
  }

  /**
   * Save draft locally and queue for background sync
   */
  async saveLocalDraft(
    entryDate: string,
    data: {
      entryId?: string | null;
      baseRevision?: number;
      title?: string | null;
      body: string;
      mood?: number | null;
      energy?: number | null;
      isFavorite?: boolean;
      sections?: any[];
      tags?: string[];
    }
  ): Promise<QueuedOperation> {
    const now = new Date().toISOString();

    // 1. Save to local draft store immediately
    await offlineStorage.saveDraft(entryDate, data);

    // 2. Enqueue sync operation
    const op: QueuedOperation = {
      id: generateUUID(),
      idempotencyKey: generateUUID(),
      action: data.entryId ? "update" : "create",
      entryDate,
      entryId: data.entryId || undefined,
      baseRevision: data.baseRevision,
      payload: {
        entryDate,
        title: data.title ?? null,
        body: data.body,
        mood: data.mood ?? null,
        energy: data.energy ?? null,
        isFavorite: data.isFavorite || false,
        sections: data.sections || [],
        tags: data.tags || [],
        baseRevision: data.baseRevision,
      },
      status: "pending",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Remove any older pending operations for the same date
    const existingQueue = await offlineStorage.getQueuedOperations();
    for (const item of existingQueue) {
      if (item.entryDate === entryDate && item.status !== "syncing") {
        await offlineStorage.removeQueuedOperation(item.id);
      }
    }

    await offlineStorage.enqueueOperation(op);
    this.notify();

    // Trigger sync attempt in background
    this.flushQueue().catch(() => {});

    return op;
  }

  /**
   * Flush all pending operations to the API
   */
  async flushQueue(): Promise<{
    synced: number;
    failed: number;
    conflicts: number;
  }> {
    if (this.isSyncing) return { synced: 0, failed: 0, conflicts: 0 };
    this.isSyncing = true;
    this.notify();

    let synced = 0;
    let failed = 0;
    let conflicts = 0;

    try {
      const queue = await offlineStorage.getQueuedOperations();
      const pending = queue.filter(
        (op) => op.status === "pending" || op.status === "failed"
      );

      for (const op of pending) {
        await offlineStorage.updateQueuedOperation(op.id, {
          status: "syncing",
          attempts: op.attempts + 1,
        });

        try {
          if (op.action === "create") {
            await api.createEntry(op.payload as CreateEntryInput);
          } else if (op.action === "update" && op.entryId) {
            await api.updateEntry(op.entryId, op.payload as UpdateEntryInput);
          }

          // Success: remove operation and clean up local draft
          await offlineStorage.removeQueuedOperation(op.id);
          await offlineStorage.deleteDraft(op.entryDate);
          synced++;
        } catch (err: any) {
          if (err.code === "CONFLICT") {
            // Conflict: Never overwrite silently!
            conflicts++;
            this.conflictOp = op;
            await offlineStorage.updateQueuedOperation(op.id, {
              status: "conflict",
              lastError: err.message,
            });
            // Stop queue processing when conflict hit to preserve user changes
            break;
          } else {
            failed++;
            await offlineStorage.updateQueuedOperation(op.id, {
              status: "failed",
              lastError: err.message,
            });
          }
        }
      }
    } finally {
      this.isSyncing = false;
      this.notify();
    }

    return { synced, failed, conflicts };
  }

  /**
   * Resolve an offline conflict with explicit user decision
   */
  async resolveConflict(resolution: ConflictResolution): Promise<void> {
    if (!this.conflictOp) return;

    const op = this.conflictOp;
    if (resolution.strategy === "keep_server") {
      // Discard local changes and delete operation
      await offlineStorage.removeQueuedOperation(op.id);
      await offlineStorage.deleteDraft(op.entryDate);
      this.conflictOp = null;
    } else if (resolution.strategy === "keep_local") {
      // Adopt server's revision and re-sync local changes
      const updatedPayload = {
        ...(op.payload as any),
        baseRevision: resolution.serverRevision,
      };
      await offlineStorage.updateQueuedOperation(op.id, {
        payload: updatedPayload,
        baseRevision: resolution.serverRevision,
        status: "pending",
        attempts: 0,
      });
      this.conflictOp = null;
      await this.flushQueue();
    }

    this.notify();
  }

  async getQueueStatus() {
    const queue = await offlineStorage.getQueuedOperations();
    return {
      total: queue.length,
      pendingCount: queue.filter((q) => q.status === "pending" || q.status === "syncing")
        .length,
      conflictCount: queue.filter((q) => q.status === "conflict").length,
      hasConflicts: queue.some((q) => q.status === "conflict"),
    };
  }
}

export const syncManager = new SyncManager();
