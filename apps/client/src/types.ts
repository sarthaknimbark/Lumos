import { AudioNoteAttachment, PhotoAttachment } from "@myday/contracts";

export type MoodLevel = 1 | 2 | 3 | 4 | 5;
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;

export interface EntrySection {
  id: string;
  sectionType: "gratitude" | "highlights" | "learned" | "tomorrow";
  content: string;
}

export interface JournalEntryMock {
  id: string;
  entryDate: string; // YYYY-MM-DD
  title: string;
  body: string;
  mood: MoodLevel;
  energy: EnergyLevel;
  isFavorite: boolean;
  tags: string[];
  sections: EntrySection[];
  audioNotes?: AudioNoteAttachment[];
  photos?: PhotoAttachment[];
  createdAt: string;
  updatedAt: string;
  syncStatus: "synced" | "draft" | "local_only";
}

export interface UserSettingsMock {
  name: string;
  email: string;
  timezone: string;
  theme: "system" | "light" | "dark";
  dailyReminderEnabled: boolean;
  driveBackupStatus: "disconnected" | "connected";
  calendarSyncStatus: "disconnected" | "connected";
}
