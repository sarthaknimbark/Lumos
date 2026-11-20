import { QueuedOperation } from "@myday/contracts";

export interface OfflineStorageAdapter {
  // Local drafts (saved immediately while typing or offline)
  saveDraft: (entryDate: string, data: unknown) => Promise<void>;
  getDraft: (entryDate: string) => Promise<unknown | null>;
  deleteDraft: (entryDate: string) => Promise<void>;

  // Sync operation queue
  enqueueOperation: (op: QueuedOperation) => Promise<void>;
  getQueuedOperations: () => Promise<QueuedOperation[]>;
  updateQueuedOperation: (id: string, updates: Partial<QueuedOperation>) => Promise<void>;
  removeQueuedOperation: (id: string) => Promise<void>;
  clearQueue: () => Promise<void>;
}
