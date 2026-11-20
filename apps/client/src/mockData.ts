import { JournalEntryMock, UserSettingsMock } from "./types";
import { getDiaryDateForTimezone } from "@myday/core";

export const MOOD_OPTIONS = [
  { level: 1 as const, emoji: "😔", label: "Low", color: "#94a3b8" },
  { level: 2 as const, emoji: "😐", label: "Meh", color: "#60a5fa" },
  { level: 3 as const, emoji: "🙂", label: "Calm", color: "#34d399" },
  { level: 4 as const, emoji: "😊", label: "Good", color: "#fbbf24" },
  { level: 5 as const, emoji: "✨", label: "Vibrant", color: "#f472b6" },
];

export const ENERGY_OPTIONS = [
  { level: 1 as const, label: "Drained", bars: " ▂" },
  { level: 2 as const, label: "Tired", bars: " ▂▃" },
  { level: 3 as const, label: "Steady", bars: " ▂▃▄" },
  { level: 4 as const, label: "Energetic", bars: " ▂▃▄▅" },
  { level: 5 as const, label: "Peak", bars: " ▂▃▄▅▆" },
];

export const ALL_TAGS = [
  "Work",
  "Reflection",
  "Fitness",
  "Family",
  "Learning",
  "Mindfulness",
  "Ideas",
  "Gratitude",
];

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const todayStr = getDiaryDateForTimezone(tz);

// Helper for past dates
function getPastDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getDiaryDateForTimezone(tz, d);
}

export const INITIAL_TODAY_ENTRY: JournalEntryMock = {
  id: "entry-today",
  entryDate: todayStr,
  title: "A calm morning with steady progress",
  body: "Started the day by reviewing the platform architecture and grounding thoughts before diving into work. The quiet early hours helped focus on what truly matters.",
  mood: 4,
  energy: 4,
  isFavorite: true,
  tags: ["Reflection", "Mindfulness"],
  sections: [
    {
      id: "sec-1",
      sectionType: "highlights",
      content: "Shipped Phase 0 monorepo tooling and verified universal client bundling.",
    },
    {
      id: "sec-2",
      sectionType: "gratitude",
      content: "Grateful for crisp focus, good tea, and quiet working conditions.",
    },
    {
      id: "sec-3",
      sectionType: "learned",
      content: "Decoupling API contracts from UI prevents future integration friction.",
    },
    {
      id: "sec-4",
      sectionType: "tomorrow",
      content: "Design the database persistence layer cleanly in Phase 2.",
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  syncStatus: "draft",
};

export const PAST_ENTRIES_MOCK: JournalEntryMock[] = [
  INITIAL_TODAY_ENTRY,
  {
    id: "entry-1",
    entryDate: getPastDate(1),
    title: "Deep work session & afternoon walk",
    body: "Spent 4 uninterrupted hours in flow. In the evening, took a long 5km walk in the park while the sun set. Feeling grounded.",
    mood: 5,
    energy: 4,
    isFavorite: true,
    tags: ["Fitness", "Mindfulness"],
    sections: [
      {
        id: "sec-p1-1",
        sectionType: "highlights",
        content: "Completed technical review without distraction.",
      },
      {
        id: "sec-p1-2",
        sectionType: "gratitude",
        content: "Cool autumn breeze and warm conversation with family.",
      },
      {
        id: "sec-p1-3",
        sectionType: "learned",
        content: "Breaks between intense focus blocks double the total quality output.",
      },
      {
        id: "sec-p1-4",
        sectionType: "tomorrow",
        content: "Scaffold Phase 0 monorepo foundation cleanly.",
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    syncStatus: "synced",
  },
  {
    id: "entry-2",
    entryDate: getPastDate(2),
    title: "Reframing priorities and planning the month",
    body: "Stepped back to evaluate ongoing personal projects. Not everything urgent is important. Pruned two low-impact commitments to free mental space.",
    mood: 3,
    energy: 3,
    isFavorite: false,
    tags: ["Reflection", "Learning"],
    sections: [
      {
        id: "sec-p2-1",
        sectionType: "highlights",
        content: "Ruthlessly said no to commitments that don't align with core goals.",
      },
      {
        id: "sec-p2-2",
        sectionType: "gratitude",
        content: "Having the autonomy to choose where my attention goes.",
      },
      {
        id: "sec-p2-3",
        sectionType: "learned",
        content: "Attention is the only true finite currency.",
      },
      {
        id: "sec-p2-4",
        sectionType: "tomorrow",
        content: "Organize architecture specs into clear executable milestones.",
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    syncStatus: "synced",
  },
  {
    id: "entry-3",
    entryDate: getPastDate(4),
    title: "Reading, recovery, and quiet reflection",
    body: "A slower-paced day. Spent the afternoon reading non-fiction and reflecting on habits. Rest is not idleness; it's the foundation for sustained clarity.",
    mood: 4,
    energy: 3,
    isFavorite: false,
    tags: ["Learning", "Mindfulness"],
    sections: [
      {
        id: "sec-p3-1",
        sectionType: "highlights",
        content: "Finished 50 pages of thoughtful reading without touching phone.",
      },
      {
        id: "sec-p3-2",
        sectionType: "gratitude",
        content: "A peaceful home and quiet time for introspection.",
      },
      {
        id: "sec-p3-3",
        sectionType: "learned",
        content: "Daily friction often comes from disorganized spaces; cleared my desk.",
      },
      {
        id: "sec-p3-4",
        sectionType: "tomorrow",
        content: "Resume technical build refreshed and energized.",
      },
    ],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    syncStatus: "synced",
  },
];

export const MOCK_USER_SETTINGS: UserSettingsMock = {
  name: "Private User",
  email: "user@myday.local",
  timezone: tz,
  theme: "system",
  dailyReminderEnabled: true,
  driveBackupStatus: "disconnected",
  calendarSyncStatus: "disconnected",
};
