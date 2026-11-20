/**
 * Web Offline Storage Adapter — IndexedDB with LocalStorage fallback
 *
 * Implements OfflineStorageAdapter for modern browsers.
 * Stores local drafts and sync operation queue safely offline.
 */

import { QueuedOperation } from "@myday/contracts";
import { OfflineStorageAdapter } from "./storage.types";

const DB_NAME = "myday_offline_store";
const DB_VERSION = 1;
const STORE_DRAFTS = "drafts";
const STORE_QUEUE = "sync_queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB unavailable"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: "entryDate" });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage when IndexedDB is blocked
const lsFallback = {
  saveDraft: async (entryDate: string, data: unknown) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(`myday_draft_${entryDate}`, JSON.stringify(data));
    }
  },
  getDraft: async (entryDate: string) => {
    if (typeof window === "undefined") return null;
    const item = localStorage.getItem(`myday_draft_${entryDate}`);
    return item ? JSON.parse(item) : null;
  },
  deleteDraft: async (entryDate: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`myday_draft_${entryDate}`);
    }
  },
  enqueueOperation: async (op: QueuedOperation) => {
    const queue = await lsFallback.getQueuedOperations();
    queue.push(op);
    localStorage.setItem("myday_queue", JSON.stringify(queue));
  },
  getQueuedOperations: async (): Promise<QueuedOperation[]> => {
    if (typeof window === "undefined") return [];
    const item = localStorage.getItem("myday_queue");
    return item ? JSON.parse(item) : [];
  },
  updateQueuedOperation: async (id: string, updates: Partial<QueuedOperation>) => {
    const queue = await lsFallback.getQueuedOperations();
    const updated = queue.map((op) => (op.id === id ? { ...op, ...updates } : op));
    localStorage.setItem("myday_queue", JSON.stringify(updated));
  },
  removeQueuedOperation: async (id: string) => {
    const queue = await lsFallback.getQueuedOperations();
    const filtered = queue.filter((op) => op.id !== id);
    localStorage.setItem("myday_queue", JSON.stringify(filtered));
  },
  clearQueue: async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("myday_queue");
    }
  },
};

export const storage: OfflineStorageAdapter = {
  async saveDraft(entryDate: string, data: unknown): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readwrite");
        const store = tx.objectStore(STORE_DRAFTS);
        store.put({ entryDate, data, savedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return lsFallback.saveDraft(entryDate, data);
    }
  },

  async getDraft(entryDate: string): Promise<unknown | null> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readonly");
        const store = tx.objectStore(STORE_DRAFTS);
        const req = store.get(entryDate);
        req.onsuccess = () => resolve(req.result?.data ?? null);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return lsFallback.getDraft(entryDate);
    }
  },

  async deleteDraft(entryDate: string): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_DRAFTS, "readwrite");
        const store = tx.objectStore(STORE_DRAFTS);
        store.delete(entryDate);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return lsFallback.deleteDraft(entryDate);
    }
  },

  async enqueueOperation(op: QueuedOperation): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, "readwrite");
        const store = tx.objectStore(STORE_QUEUE);
        store.put(op);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return lsFallback.enqueueOperation(op);
    }
  },

  async getQueuedOperations(): Promise<QueuedOperation[]> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, "readonly");
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return lsFallback.getQueuedOperations();
    }
  },

  async updateQueuedOperation(id: string, updates: Partial<QueuedOperation>): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, "readwrite");
        const store = tx.objectStore(STORE_QUEUE);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            store.put({ ...req.result, ...updates, updatedAt: new Date().toISOString() });
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return lsFallback.updateQueuedOperation(id, updates);
    }
  },

  async removeQueuedOperation(id: string): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, "readwrite");
        const store = tx.objectStore(STORE_QUEUE);
        store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return lsFallback.removeQueuedOperation(id);
    }
  },

  async clearQueue(): Promise<void> {
    try {
      const db = await openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_QUEUE, "readwrite");
        const store = tx.objectStore(STORE_QUEUE);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      return lsFallback.clearQueue();
    }
  },
};
