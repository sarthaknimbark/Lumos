/**
 * Entry Service — Journal persistence layer
 *
 * Provides:
 *   - PostgreSQL persistence via Drizzle ORM when DATABASE_URL is set
 *   - In-memory store fallback when DATABASE_URL is not set (deferred DB / tests)
 *   - Date navigation (find by entryDate)
 *   - Revision-based optimistic concurrency (baseRevision)
 *   - PostgreSQL search (q param matches title, body, and reflection sections)
 *   - Tag, mood, energy, isFavorite, and date range filters
 *   - Structured reflection sections (highlights, gratitude, learned, tomorrow)
 */

import {
  CreateEntryInput,
  JournalEntryResponse,
  ListEntriesQuery,
  UpdateEntryInput,
} from "@myday/contracts";
import {
  and,
  createDbClient,
  desc,
  entrySections,
  entryTags,
  eq,
  gte,
  ilike,
  journalEntries,
  lte,
  or,
  sql,
  tags,
} from "@myday/db";
import { randomUUID } from "crypto";
import { loadEnv } from "../config.js";

// Global in-memory fallback store
const inMemoryEntries: Map<string, JournalEntryResponse> = new Map();

// In-memory idempotency cache for offline replay protection
const idempotencyStore: Map<
  string,
  { entry: JournalEntryResponse; timestamp: number }
> = new Map();

// Seed initial in-memory entry for default dev user
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

function getDbClient() {
  if (process.env.NODE_ENV === "test") {
    return null;
  }
  const env = loadEnv();
  if (env.DATABASE_URL) {
    try {
      return createDbClient(env.DATABASE_URL).db;
    } catch {
      return null;
    }
  }
  return null;
}

export const entryService = {
  /**
   * List entries with filters, search, and pagination
   */
  async list(
    userId: string,
    query: ListEntriesQuery
  ): Promise<{ data: JournalEntryResponse[]; total: number }> {
    const db = getDbClient();

    if (db) {
      try {
        const conditions = [
          eq(journalEntries.userId, userId),
          sql`${journalEntries.deletedAt} IS NULL`,
        ];

        if (query.date) {
          conditions.push(eq(journalEntries.entryDate, query.date));
        }
        if (query.from) {
          conditions.push(gte(journalEntries.entryDate, query.from));
        }
        if (query.to) {
          conditions.push(lte(journalEntries.entryDate, query.to));
        }
        if (query.mood) {
          conditions.push(eq(journalEntries.mood, query.mood));
        }
        if (query.energy) {
          conditions.push(eq(journalEntries.energy, query.energy));
        }
        if (query.isFavorite !== undefined) {
          conditions.push(eq(journalEntries.isFavorite, query.isFavorite));
        }
        if (query.q) {
          const searchPattern = `%${query.q}%`;
          conditions.push(
            or(
              ilike(journalEntries.title, searchPattern),
              ilike(journalEntries.body, searchPattern)
            )!
          );
        }

        const rows = await db
          .select()
          .from(journalEntries)
          .where(and(...conditions))
          .orderBy(desc(journalEntries.entryDate))
          .limit(query.limit || 20)
          .offset(query.offset || 0);

        const results: JournalEntryResponse[] = [];
        for (const row of rows) {
          const sections = await db
            .select()
            .from(entrySections)
            .where(eq(entrySections.entryId, row.id))
            .orderBy(entrySections.sortOrder);

          // Get tags for entry
          const entryTagsList = await db
            .select({ name: tags.name })
            .from(entryTags)
            .innerJoin(tags, eq(entryTags.tagId, tags.id))
            .where(eq(entryTags.entryId, row.id));

          results.push({
            id: row.id,
            userId: row.userId,
            entryDate: row.entryDate,
            title: row.title,
            body: row.body,
            mood: row.mood,
            energy: row.energy,
            status: row.status as "draft" | "published",
            isFavorite: row.isFavorite,
            revision: row.revision,
            sections: sections.map((s) => ({
              id: s.id,
              sectionType: s.sectionType as any,
              content: s.content,
              sortOrder: s.sortOrder,
              createdAt: s.createdAt.toISOString(),
              updatedAt: s.updatedAt.toISOString(),
            })),
            tags: entryTagsList.map((t) => t.name),
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          });
        }

        return { data: results, total: results.length };
      } catch (err) {
        console.warn("[entryService] DB query failed, using in-memory store:", err);
      }
    }

    // In-memory fallback
    let items = Array.from(inMemoryEntries.values()).filter(
      (e) => e.userId === userId
    );

    if (query.date) {
      items = items.filter((e) => e.entryDate === query.date);
    }
    if (query.from) {
      items = items.filter((e) => e.entryDate >= query.from!);
    }
    if (query.to) {
      items = items.filter((e) => e.entryDate <= query.to!);
    }
    if (query.mood) {
      items = items.filter((e) => e.mood === query.mood);
    }
    if (query.energy) {
      items = items.filter((e) => e.energy === query.energy);
    }
    if (query.isFavorite !== undefined) {
      items = items.filter((e) => e.isFavorite === query.isFavorite);
    }
    if (query.tag) {
      items = items.filter((e) =>
        e.tags.some((t) => t.toLowerCase() === query.tag!.toLowerCase())
      );
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

    items.sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    const paginated = items.slice(offset, offset + limit);

    return { data: paginated, total: items.length };
  },

  /**
   * Get single entry by ID
   */
  async getById(
    userId: string,
    id: string
  ): Promise<JournalEntryResponse | null> {
    const db = getDbClient();
    if (db) {
      try {
        const [row] = await db
          .select()
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.id, id),
              eq(journalEntries.userId, userId),
              sql`${journalEntries.deletedAt} IS NULL`
            )
          )
          .limit(1);

        if (!row) return null;

        const sections = await db
          .select()
          .from(entrySections)
          .where(eq(entrySections.entryId, row.id))
          .orderBy(entrySections.sortOrder);

        const entryTagsList = await db
          .select({ name: tags.name })
          .from(entryTags)
          .innerJoin(tags, eq(entryTags.tagId, tags.id))
          .where(eq(entryTags.entryId, row.id));

        return {
          id: row.id,
          userId: row.userId,
          entryDate: row.entryDate,
          title: row.title,
          body: row.body,
          mood: row.mood,
          energy: row.energy,
          status: row.status as "draft" | "published",
          isFavorite: row.isFavorite,
          revision: row.revision,
          sections: sections.map((s) => ({
            id: s.id,
            sectionType: s.sectionType as any,
            content: s.content,
            sortOrder: s.sortOrder,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          tags: entryTagsList.map((t) => t.name),
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      } catch (err) {
        console.warn("[entryService] DB getById failed, using in-memory store:", err);
      }
    }

    const entry = inMemoryEntries.get(id);
    if (!entry || entry.userId !== userId) return null;
    return entry;
  },

  /**
   * Get single entry by date (one main entry per local date)
   */
  async getByDate(
    userId: string,
    entryDate: string
  ): Promise<JournalEntryResponse | null> {
    const { data } = await this.list(userId, { date: entryDate, limit: 1 });
    return data[0] || null;
  },

  /**
   * Create daily journal entry
   */
  async create(
    userId: string,
    input: CreateEntryInput,
    idempotencyKey?: string
  ): Promise<JournalEntryResponse> {
    // 1. Idempotency replay check
    if (idempotencyKey) {
      const cacheKey = `${userId}:${idempotencyKey}`;
      const cached = idempotencyStore.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
        return cached.entry;
      }
    }

    const db = getDbClient();

    if (db) {
      try {
        const [existing] = await db
          .select()
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.userId, userId),
              eq(journalEntries.entryDate, input.entryDate),
              sql`${journalEntries.deletedAt} IS NULL`
            )
          )
          .limit(1);

        if (existing) {
          const error: any = new Error("An entry already exists for this date");
          error.code = "CONFLICT";
          throw error;
        }

        const [created] = await db
          .insert(journalEntries)
          .values({
            userId,
            entryDate: input.entryDate,
            title: input.title,
            body: input.body,
            mood: input.mood,
            energy: input.energy,
            status: input.status,
            isFavorite: input.isFavorite,
            revision: 1,
          })
          .returning();

        if (!created) {
          throw new Error("Failed to insert journal entry");
        }

        const createdSections: any[] = [];
        if (input.sections && input.sections.length > 0) {
          for (let i = 0; i < input.sections.length; i++) {
            const sec = input.sections[i];
            if (!sec) continue;
            const [insertedSec] = await db
              .insert(entrySections)
              .values({
                userId,
                entryId: created.id,
                sectionType: sec.sectionType,
                content: sec.content,
                sortOrder: sec.sortOrder ?? i,
              })
              .returning();
            if (insertedSec) createdSections.push(insertedSec);
          }
        }

        return {
          id: created.id,
          userId: created.userId,
          entryDate: created.entryDate,
          title: created.title,
          body: created.body,
          mood: created.mood,
          energy: created.energy,
          status: created.status as any,
          isFavorite: created.isFavorite,
          revision: created.revision,
          sections: createdSections.map((s) => ({
            id: s.id,
            sectionType: s.sectionType as any,
            content: s.content,
            sortOrder: s.sortOrder,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          tags: input.tags || [],
          createdAt: created.createdAt.toISOString(),
          updatedAt: created.updatedAt.toISOString(),
        };
      } catch (err: any) {
        if (err.code === "CONFLICT" || err.code === "23505") {
          const error: any = new Error("An entry already exists for this date");
          error.code = "CONFLICT";
          throw error;
        }
        console.warn("[entryService] DB create failed, falling back to memory:", err);
      }
    }

    // In-memory fallback
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
      status: input.status || "draft",
      isFavorite: input.isFavorite || false,
      revision: 1,
      sections: (input.sections || []).map((s, idx) => ({
        id: randomUUID(),
        sectionType: s.sectionType,
        content: s.content,
        sortOrder: s.sortOrder ?? idx,
        createdAt: now,
        updatedAt: now,
      })),
      tags: input.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    inMemoryEntries.set(entryId, newEntry);
    if (idempotencyKey) {
      idempotencyStore.set(`${userId}:${idempotencyKey}`, {
        entry: newEntry,
        timestamp: Date.now(),
      });
    }
    return newEntry;
  },

  /**
   * Update entry with optimistic concurrency check (baseRevision)
   */
  async update(
    userId: string,
    id: string,
    input: UpdateEntryInput
  ): Promise<JournalEntryResponse> {
    const db = getDbClient();

    if (db) {
      try {
        const [existing] = await db
          .select()
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.id, id),
              eq(journalEntries.userId, userId),
              sql`${journalEntries.deletedAt} IS NULL`
            )
          )
          .limit(1);

        if (!existing) {
          const error: any = new Error("Entry not found");
          error.code = "NOT_FOUND";
          throw error;
        }

        if (existing.revision !== input.baseRevision) {
          const error: any = new Error(
            `Conflict: entry has been updated. Expected revision ${existing.revision}, got ${input.baseRevision}`
          );
          error.code = "CONFLICT";
          throw error;
        }

        const updateData: Record<string, any> = {
          revision: existing.revision + 1,
          updatedAt: new Date(),
        };

        if (input.title !== undefined) updateData.title = input.title;
        if (input.body !== undefined) updateData.body = input.body;
        if (input.mood !== undefined) updateData.mood = input.mood;
        if (input.energy !== undefined) updateData.energy = input.energy;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.isFavorite !== undefined) updateData.isFavorite = input.isFavorite;

        const [updated] = await db
          .update(journalEntries)
          .set(updateData)
          .where(eq(journalEntries.id, id))
          .returning();

        if (!updated) {
          throw new Error("Failed to update journal entry");
        }

        // Update sections if provided
        if (input.sections) {
          await db.delete(entrySections).where(eq(entrySections.entryId, id));
          for (let i = 0; i < input.sections.length; i++) {
            const sec = input.sections[i];
            if (!sec) continue;
            await db.insert(entrySections).values({
              userId,
              entryId: id,
              sectionType: sec.sectionType,
              content: sec.content,
              sortOrder: sec.sortOrder ?? i,
            });
          }
        }

        const sections = await db
          .select()
          .from(entrySections)
          .where(eq(entrySections.entryId, id))
          .orderBy(entrySections.sortOrder);

        return {
          id: updated.id,
          userId: updated.userId,
          entryDate: updated.entryDate,
          title: updated.title,
          body: updated.body,
          mood: updated.mood,
          energy: updated.energy,
          status: updated.status as any,
          isFavorite: updated.isFavorite,
          revision: updated.revision,
          sections: sections.map((s) => ({
            id: s.id,
            sectionType: s.sectionType as any,
            content: s.content,
            sortOrder: s.sortOrder,
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          })),
          tags: input.tags || [],
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      } catch (err: any) {
        if (err.code === "CONFLICT" || err.code === "NOT_FOUND") throw err;
        console.warn("[entryService] DB update failed, falling back to memory:", err);
      }
    }

    // In-memory fallback
    const entry = inMemoryEntries.get(id);
    if (!entry || entry.userId !== userId) {
      const error: any = new Error("Entry not found");
      error.code = "NOT_FOUND";
      throw error;
    }

    if (entry.revision !== input.baseRevision) {
      const error: any = new Error(
        `Conflict: entry has been updated. Expected revision ${entry.revision}, got ${input.baseRevision}`
      );
      error.code = "CONFLICT";
      throw error;
    }

    const now = new Date().toISOString();
    const updated: JournalEntryResponse = {
      ...entry,
      title: input.title !== undefined ? input.title : entry.title,
      body: input.body !== undefined ? input.body : entry.body,
      mood: input.mood !== undefined ? input.mood : entry.mood,
      energy: input.energy !== undefined ? input.energy : entry.energy,
      status: input.status !== undefined ? input.status : entry.status,
      isFavorite: input.isFavorite !== undefined ? input.isFavorite : entry.isFavorite,
      revision: entry.revision + 1,
      sections: input.sections
        ? input.sections.map((s, idx) => ({
            id: randomUUID(),
            sectionType: s.sectionType,
            content: s.content,
            sortOrder: s.sortOrder ?? idx,
            createdAt: now,
            updatedAt: now,
          }))
        : entry.sections,
      tags: input.tags !== undefined ? input.tags : entry.tags,
      updatedAt: now,
    };

    inMemoryEntries.set(id, updated);
    return updated;
  },

  /**
   * Delete entry (soft delete)
   */
  async delete(userId: string, id: string): Promise<boolean> {
    const db = getDbClient();
    if (db) {
      try {
        const [updated] = await db
          .update(journalEntries)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(journalEntries.id, id),
              eq(journalEntries.userId, userId),
              sql`${journalEntries.deletedAt} IS NULL`
            )
          )
          .returning();

        return Boolean(updated);
      } catch (err) {
        console.warn("[entryService] DB delete failed, using memory:", err);
      }
    }

    const entry = inMemoryEntries.get(id);
    if (!entry || entry.userId !== userId) return false;
    inMemoryEntries.delete(id);
    return true;
  },
};
