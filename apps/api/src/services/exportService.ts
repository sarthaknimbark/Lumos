/**
 * Export & Import Service — Phase 9
 *
 * Implements:
 *   - JSON journal export (schema v1.0.0)
 *   - Markdown formatted journal export
 *   - Validated import preview with conflict detection
 *   - Import confirmation (merge vs. overwrite)
 *   - Complete account data deletion workflow
 */

import {
  AccountDataDeletionResponse,
  ExportedEntry,
  ImportConfirmInput,
  ImportConfirmResponse,
  ImportPreviewResponse,
  JournalExportPayload,
  JournalExportPayloadSchema,
} from "@myday/contracts";
import { entryService } from "./entryService.js";
import { driveService } from "./driveService.js";
import { calendarService } from "./calendarService.js";

export const exportService = {
  /**
   * Export all entries as structured JSON
   */
  async exportJson(userId: string): Promise<JournalExportPayload> {
    const rawEntries = await entryService.getAllForUser(userId);

    const entries: ExportedEntry[] = rawEntries.map((e) => ({
      id: e.id,
      entryDate: e.entryDate,
      title: e.title,
      body: e.body,
      mood: e.mood,
      energy: e.energy,
      status: e.status,
      isFavorite: e.isFavorite,
      revision: e.revision,
      tags: e.tags,
      sections: e.sections.map((s) => ({
        sectionType: s.sectionType,
        content: s.content,
        sortOrder: s.sortOrder,
      })),
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    }));

    return {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      userId,
      totalEntries: entries.length,
      entries,
    };
  },

  /**
   * Export all entries as a single clean Markdown document
   */
  async exportMarkdown(userId: string): Promise<string> {
    const rawEntries = await entryService.getAllForUser(userId);
    const now = new Date().toISOString();

    const lines: string[] = [
      "# MyDay Personal Journal Export",
      `> Exported: ${now}`,
      `> Total Entries: ${rawEntries.length}`,
      "",
      "---",
      "",
    ];

    if (rawEntries.length === 0) {
      lines.push("No journal entries recorded.");
      return lines.join("\n");
    }

    for (const entry of rawEntries) {
      lines.push(`## ${entry.entryDate}${entry.title ? `: ${entry.title}` : ""}`);
      lines.push("");

      const meta: string[] = [];
      if (entry.mood) meta.push(`Mood: ${entry.mood}/5`);
      if (entry.energy) meta.push(`Energy: ${entry.energy}/5`);
      if (entry.isFavorite) meta.push(`Favorite: Yes`);
      if (entry.tags && entry.tags.length > 0) {
        meta.push(`Tags: ${entry.tags.map((t) => `#${t}`).join(" ")}`);
      }

      if (meta.length > 0) {
        lines.push(`_${meta.join(" • ")}_`);
        lines.push("");
      }

      if (entry.body) {
        lines.push(entry.body);
        lines.push("");
      }

      if (entry.sections && entry.sections.length > 0) {
        for (const s of entry.sections) {
          const sectionTitle =
            s.sectionType.charAt(0).toUpperCase() + s.sectionType.slice(1);
          lines.push(`### ${sectionTitle}`);
          lines.push(s.content);
          lines.push("");
        }
      }

      lines.push("---");
      lines.push("");
    }

    return lines.join("\n");
  },

  /**
   * Preview an import file: validate structure and detect conflicting dates
   */
  async previewImport(userId: string, data: unknown): Promise<ImportPreviewResponse> {
    const parseResult = JournalExportPayloadSchema.safeParse(data);

    if (!parseResult.success) {
      const errors = parseResult.error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      return {
        valid: false,
        version: "unknown",
        totalEntries: 0,
        newEntriesCount: 0,
        conflictingDatesCount: 0,
        conflictingDates: [],
        previewEntries: [],
        validationErrors: errors,
      };
    }

    const payload = parseResult.data;
    const existingEntries = await entryService.getAllForUser(userId);
    const existingDateSet = new Set(existingEntries.map((e) => e.entryDate));

    const conflictingDates: string[] = [];
    const previewEntries: {
      entryDate: string;
      title?: string | null;
      willOverwrite: boolean;
    }[] = [];

    let newEntriesCount = 0;
    let conflictingDatesCount = 0;

    for (const entry of payload.entries) {
      const isConflict = existingDateSet.has(entry.entryDate);
      if (isConflict) {
        conflictingDatesCount++;
        conflictingDates.push(entry.entryDate);
      } else {
        newEntriesCount++;
      }

      previewEntries.push({
        entryDate: entry.entryDate,
        title: entry.title,
        willOverwrite: isConflict,
      });
    }

    return {
      valid: true,
      version: payload.version,
      totalEntries: payload.entries.length,
      newEntriesCount,
      conflictingDatesCount,
      conflictingDates,
      previewEntries: previewEntries.slice(0, 50),
    };
  },

  /**
   * Confirm import and apply changes (merge vs. overwrite)
   */
  async confirmImport(
    userId: string,
    input: ImportConfirmInput
  ): Promise<ImportConfirmResponse> {
    const parseResult = JournalExportPayloadSchema.safeParse(input.data);
    if (!parseResult.success) {
      const err = new Error("Invalid import payload structure");
      (err as any).statusCode = 400;
      throw err;
    }

    const payload = parseResult.data;
    let importedCount = 0;
    let overwrittenCount = 0;
    let skippedCount = 0;

    for (const entry of payload.entries) {
      const result = await entryService.upsertImported(
        userId,
        entry,
        input.strategy
      );
      if (result === "imported") importedCount++;
      else if (result === "overwritten") overwrittenCount++;
      else if (result === "skipped") skippedCount++;
    }

    return {
      success: true,
      importedCount,
      overwrittenCount,
      skippedCount,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Complete account data deletion workflow
   * Irreversibly purges user's entries, attachments, tokens, and settings.
   */
  async deleteAccountData(userId: string): Promise<AccountDataDeletionResponse> {
    const deletedEntriesCount = await entryService.deleteAllForUser(userId);
    const deletedAttachmentsCount = driveService.clearUserData(userId);
    calendarService.disconnect(userId);

    return {
      success: true,
      deletedEntriesCount,
      deletedAttachmentsCount,
      deletedTagsCount: 0,
      timestamp: new Date().toISOString(),
    };
  },
};
