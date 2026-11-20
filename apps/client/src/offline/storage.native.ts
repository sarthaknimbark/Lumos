/**
 * Native Offline Storage Adapter — Android & iOS
 *
 * Implements OfflineStorageAdapter for native devices.
 * Uses encrypted hardware-backed storage for drafts and sync queue.
 */

import * as SecureStore from "expo-secure-store";
import { QueuedOperation } from "@myday/contracts";
import { OfflineStorageAdapter } from "./storage.types";

const QUEUE_KEY = "myday_native_sync_queue";

export const storage: OfflineStorageAdapter = {
  async saveDraft(entryDate: string, data: unknown): Promise<void> {
    const key = `draft_${entryDate.replace(/-/g, "_")}`;
    await SecureStore.setItemAsync(key, JSON.stringify(data));
  },

  async getDraft(entryDate: string): Promise<unknown | null> {
    const key = `draft_${entryDate.replace(/-/g, "_")}`;
    const value = await SecureStore.getItemAsync(key);
    return value ? JSON.parse(value) : null;
  },

  async deleteDraft(entryDate: string): Promise<void> {
    const key = `draft_${entryDate.replace(/-/g, "_")}`;
    await SecureStore.deleteItemAsync(key);
  },

  async enqueueOperation(op: QueuedOperation): Promise<void> {
    const queue = await this.getQueuedOperations();
    queue.push(op);
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));
  },

  async getQueuedOperations(): Promise<QueuedOperation[]> {
    const raw = await SecureStore.getItemAsync(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async updateQueuedOperation(
    id: string,
    updates: Partial<QueuedOperation>
  ): Promise<void> {
    const queue = await this.getQueuedOperations();
    const updated = queue.map((op) =>
      op.id === id ? { ...op, ...updates, updatedAt: new Date().toISOString() } : op
    );
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(updated));
  },

  async removeQueuedOperation(id: string): Promise<void> {
    const queue = await this.getQueuedOperations();
    const filtered = queue.filter((op) => op.id !== id);
    await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(filtered));
  },

  async clearQueue(): Promise<void> {
    await SecureStore.deleteItemAsync(QUEUE_KEY);
  },
};
