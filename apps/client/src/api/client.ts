/**
 * MyDay Universal API Client
 *
 * Universal HTTP client for Android, iOS, and Web.
 * Communicates with Fastify backend /api/v1 endpoints.
 * Never accesses database directly.
 */

import {
  AiReflectionRequest,
  AiReflectionResponse,
  AttachmentResponse,
  CreateAttachmentInput,
  CreateEntryInput,
  CreateTagInput,
  DriveBackupItem,
  DriveConnectInput,
  DriveStatusResponse,
  JournalEntryResponse,
  ListEntriesQuery,
  RestoreConfirmResponse,
  RestorePreviewResponse,
  TagResponse,
  UpdateEntryInput,
} from "@myday/contracts";
import { storage } from "../auth/storage";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const token = await storage.getItem("myday_session_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch {
    // Web fallback (cookies handled automatically by browser)
  }

  return headers;
}

export const api = {
  /**
   * List entries with filtering and search
   */
  async getEntries(
    query?: ListEntriesQuery
  ): Promise<{ data: JournalEntryResponse[]; total: number }> {
    const params = new URLSearchParams();
    if (query) {
      if (query.date) params.append("date", query.date);
      if (query.from) params.append("from", query.from);
      if (query.to) params.append("to", query.to);
      if (query.q) params.append("q", query.q);
      if (query.tag) params.append("tag", query.tag);
      if (query.mood) params.append("mood", String(query.mood));
      if (query.energy) params.append("energy", String(query.energy));
      if (query.isFavorite !== undefined)
        params.append("isFavorite", String(query.isFavorite));
      if (query.limit) params.append("limit", String(query.limit));
      if (query.offset) params.append("offset", String(query.offset));
    }

    const headers = await getAuthHeaders();
    const url = `${API_BASE_URL}/api/v1/entries${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Request failed with status ${res.status}`);
    }

    const body = await res.json();
    return {
      data: body.data || [],
      total: body.pagination?.total ?? body.data?.length ?? 0,
    };
  },

  /**
   * Get entry for specific local date (YYYY-MM-DD)
   */
  async getEntryByDate(date: string): Promise<JournalEntryResponse | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/entries/by-date/${date}`, {
      method: "GET",
      headers,
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to fetch entry by date");
    }

    const body = await res.json();
    return body.data;
  },

  /**
   * Get entry by ID
   */
  async getEntryById(id: string): Promise<JournalEntryResponse | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/entries/${id}`, {
      method: "GET",
      headers,
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to fetch entry by id");
    }

    const body = await res.json();
    return body.data;
  },

  /**
   * Create daily journal entry
   */
  async createEntry(input: CreateEntryInput): Promise<JournalEntryResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/entries`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err?.error?.message || "Failed to create entry");
      error.code = err?.error?.code;
      throw error;
    }

    const body = await res.json();
    return body.data;
  },

  /**
   * Update entry with optimistic conflict protection (baseRevision)
   */
  async updateEntry(
    id: string,
    input: UpdateEntryInput
  ): Promise<JournalEntryResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/entries/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error: any = new Error(err?.error?.message || "Failed to update entry");
      error.code = err?.error?.code;
      throw error;
    }

    const body = await res.json();
    return body.data;
  },

  /**
   * Delete entry
   */
  async deleteEntry(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/entries/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to delete entry");
    }
  },

  /**
   * Get user tags
   */
  async getTags(): Promise<TagResponse[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/tags`, {
      method: "GET",
      headers,
    });

    if (!res.ok) return [];
    const body = await res.json();
    return body.data || [];
  },

  /**
   * Create tag
   */
  async createTag(name: string): Promise<TagResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to create tag");
    }

    const body = await res.json();
    return body.data;
  },

  /**
   * Groq Free AI reflection assistance
   */
  async getAiReflection(
    input: AiReflectionRequest
  ): Promise<AiReflectionResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/ai/reflection-prompt`, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to get AI reflection");
    }

    const body = await res.json();
    return body.data;
  },

  /**
   * Google Drive Integration (Phase 7)
   */
  async getDriveStatus(): Promise<DriveStatusResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/drive/status`, {
      method: "GET",
      headers,
    });
    if (!res.ok) {
      return {
        connected: false,
        providerAccountId: null,
        scopes: [],
        lastBackupAt: null,
        backupCount: 0,
        appFolderName: "MyDay Backups",
      };
    }
    return res.json();
  },

  async connectDrive(authCode: string): Promise<DriveStatusResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/drive/connect`, {
      method: "POST",
      headers,
      body: JSON.stringify({ authCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to connect Google Drive");
    }
    return res.json();
  },

  async disconnectDrive(): Promise<void> {
    const headers = await getAuthHeaders();
    await fetch(`${API_BASE_URL}/api/v1/integrations/drive/disconnect`, {
      method: "POST",
      headers,
    });
  },

  async createDriveBackup(): Promise<DriveBackupItem> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/drive/backup`, {
      method: "POST",
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to create Google Drive backup");
    }
    return res.json();
  },

  async listDriveBackups(): Promise<DriveBackupItem[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/drive/backups`, {
      method: "GET",
      headers,
    });
    if (!res.ok) return [];
    const body = await res.json();
    return body.backups || [];
  },

  async previewRestore(backupId: string): Promise<RestorePreviewResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/drive/restore/preview`, {
      method: "POST",
      headers,
      body: JSON.stringify({ backupId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to preview restore snapshot");
    }
    return res.json();
  },

  async confirmRestore(
    backupId: string,
    strategy: "merge" | "overwrite" = "merge"
  ): Promise<RestoreConfirmResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/api/v1/integrations/drive/restore/confirm`, {
      method: "POST",
      headers,
      body: JSON.stringify({ backupId, strategy }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || "Failed to confirm restore");
    }
    return res.json();
  },
};
