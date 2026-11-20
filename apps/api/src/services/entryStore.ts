import {
  CreateEntryInput,
  JournalEntryResponse,
  ListEntriesQuery,
  UpdateEntryInput,
} from "@myday/contracts";
import { randomUUID } from "crypto";

// Development in-memory mock store
const inMemoryEntries: Map<string, JournalEntryResponse> = new Map();

// Seed initial in-memory entry for test user
const devEntryId = "11111111-1111-1111-1111-111111111111";
inMemoryEntries.set(devEntryId, {
  id: devEntryId,
  userId: "00000000-0000-0000-0000-000000000001",
  entryDate: "2026-11-20",
  title: "A calm morning with steady progress",
  body: "Started the day by reviewing the platform architecture. Quiet early hours helped focus on what truly matters.",
  mood: 4,
  energy: 4,
  status: "published",
  isFavorite: true,
  revision: 1,
  sections: [
    {
      id: "22222222-2222-2222-2222-222222222222",
      sectionType: "highlights",
      content: "Shipped Phase 0 monorepo tooling and verified universal client bundling.",
      sortOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      sectionType: "gratitude",
      content: "Grateful for crisp focus, good tea, and quiet working conditions.",
      sortOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  tags: ["reflection", "mindfulness"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const entryStore = {
  async list(userId: string, query: ListEntriesQuery): Promise<JournalEntryResponse[]> {
    let items = Array.from(inMemoryEntries.values()).filter((e) => e.userId === userId);

    if (query.from) {
      items = items.filter((e) => e.entryDate >= query.from!);
    }
    if (query.to) {
      items = items.filter((e) => e.entryDate <= query.to!);
    }
    if (query.tag) {
      items = items.filter((e) => e.tags.includes(query.tag!.toLowerCase()));
    }
    if (query.mood) {
      items = items.filter((e) => e.mood === query.mood);
    }
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (e) =>
          e.title?.toLowerCase().includes(q) ||
          e.body.toLowerCase().includes(q) ||
          e.sections.some((s) => s.content.toLowerCase().includes(q))
      );
    }

    // Sort by entryDate DESC
    items.sort((a, b) => b.entryDate.localeCompare(a.entryDate));

    return items.slice(0, query.limit || 20);
  },

  async getById(userId: string, id: string): Promise<JournalEntryResponse | null> {
    const entry = inMemoryEntries.get(id);
    if (!entry || entry.userId !== userId) return null;
    return entry;
  },

  async create(userId: string, input: CreateEntryInput): Promise<JournalEntryResponse> {
    // Check one-main-entry-per-day unique constraint
    const existing = Array.from(inMemoryEntries.values()).find(
      (e) => e.userId === userId && e.entryDate === input.entryDate
    );
    if (existing) {
      const error: any = new Error("An entry already exists for this date");
      error.code = "CONFLICT";
      throw error;
    }

    const now = new Date().toISOString();
    const entryId = randomUUID();
    const newEntry: JournalEntryResponse = {
      id: entryId,
      userId,
      entryDate: input.entryDate,
      title: input.title ?? null,
      body: input.body,
      mood: input.mood ?? null,
      energy: input.energy ?? null,
      status: input.status,
      isFavorite: input.isFavorite,
      revision: 1,
      sections: (input.sections || []).map((s, idx) => ({
        id: randomUUID(),
        sectionType: s.sectionType,
        content: s.content,
        sortOrder: s.sortOrder ?? idx,
        createdAt: now,
        updatedAt: now,
      })),
      tags: (input.tags || []).map((t) => t.toLowerCase().trim()),
      createdAt: now,
      updatedAt: now,
    };

    inMemoryEntries.set(entryId, newEntry);
    return newEntry;
  },

  async update(
    userId: string,
    id: string,
    input: UpdateEntryInput
  ): Promise<JournalEntryResponse | null> {
    const existing = inMemoryEntries.get(id);
    if (!existing || existing.userId !== userId) return null;

    // Check base revision for conflict detection
    if (input.baseRevision !== existing.revision) {
      const error: any = new Error(
        `Conflict detected: base revision ${input.baseRevision} does not match current revision ${existing.revision}`
      );
      error.code = "CONFLICT";
      throw error;
    }

    const now = new Date().toISOString();
    const updated: JournalEntryResponse = {
      ...existing,
      title: input.title !== undefined ? input.title : existing.title,
      body: input.body !== undefined ? input.body : existing.body,
      mood: input.mood !== undefined ? input.mood : existing.mood,
      energy: input.energy !== undefined ? input.energy : existing.energy,
      status: input.status !== undefined ? input.status : existing.status,
      isFavorite: input.isFavorite !== undefined ? input.isFavorite : existing.isFavorite,
      revision: existing.revision + 1,
      sections:
        input.sections !== undefined
          ? input.sections.map((s, idx) => ({
              id: randomUUID(),
              sectionType: s.sectionType,
              content: s.content,
              sortOrder: s.sortOrder ?? idx,
              createdAt: now,
              updatedAt: now,
            }))
          : existing.sections,
      tags:
        input.tags !== undefined
          ? input.tags.map((t) => t.toLowerCase().trim())
          : existing.tags,
      updatedAt: now,
    };

    inMemoryEntries.set(id, updated);
    return updated;
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = inMemoryEntries.get(id);
    if (!existing || existing.userId !== userId) return false;
    inMemoryEntries.delete(id);
    return true;
  },
};
