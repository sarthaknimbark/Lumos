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
  title: "Morning Clarity & Coffee Run",
  body: "Walking past the harbour, cold air clearing yesterday's haze. Realized we should ship the v2 architecture directly without legacy adapters. Decided to keep all acoustic notes sovereign and local.",
  mood: 4,
  energy: 4,
  isFavorite: true,
  tags: ["Reflection", "Mindfulness", "harbour", "architecture"],
  sections: [
    {
      id: "sec-1",
      sectionType: "highlights",
      content: "Shipped Phase 0 monorepo tooling and verified universal client bundling.",
    },
    {
      id: "sec-2",
      sectionType: "gratitude",
      content: "Grateful for crisp focus, good espresso, and quiet working conditions.",
    },
    {
      id: "sec-3",
      sectionType: "learned",
      content: "Raw audio preservation with zero speech-to-text preserves intimate acoustic cadence.",
    },
    {
      id: "sec-4",
      sectionType: "tomorrow",
      content: "Refine offline conflict resolution and storage breakdown meters.",
    },
  ],
  audioNotes: [
    {
      id: "audio-today-1",
      url: "https://actions.google.com/sounds/v1/water/ocean_waves.ogg",
      durationSeconds: 102,
      mimeType: "audio/webm",
      waveform: [20, 35, 60, 40, 75, 100, 85, 45, 30, 65, 80, 95, 50, 30, 70, 45, 60, 25, 40, 20],
      createdAt: new Date().toISOString(),
    },
  ],
  photos: [
    {
      id: "photo-today-1",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUuAMd10PyqbHIluKvwPwhSx_IV0SBZFfvop4mae4EOcJQBHYQFvOFLr05n8G_ynJzzaoKzMBJKdfYwTJSecFImcRtFb5-UjrXyvWEgKLdARm-kOVd3IGStavmHD0rffTGUnt0XFXzjLt4Sc8xVxD6GcADkJPzIZLEjhIF6kp59jNjvKzXrmXNgN0xzf51YyDYMNTi5q0uR_gStEMQ_ivTdd79Yqy8MLjrDzSs_6GT",
      filename: "harbour_morning.jpg",
      caption: "HARBOUR_01 • Pier in Nordic late autumn air",
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
    },
    {
      id: "photo-today-2",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHoq_6sPlqqyrTv9QazLDssDo3LpzP4gOxEbFjqvvLaFeM36scRae2AVXcFnuVxfM-RwuZ9o30ssg6NJXIC6KFBfOo2CMC3W9mwBPWCXQ9kIwC_-yxOyU64FtdCKrhstAeJycAcrwWS3ny56pLvtyQH0uYOBbeqbH4FXmzslrtxbcz9Np0cEo1NgJNte302YGshD2Fg3ZsHmFzBQqdJPhBx7MhnTC-HF7pCr4ndq5e",
      filename: "espresso_counter.jpg",
      caption: "+1 ARCHIVE • Artisan espresso bar steam",
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
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
    title: "Late Night Studio Sketches & Synthesizer",
    body: "Recorded ambient patch ideas on the OP-1 before winding down. The new tempo feels much more balanced with subtle polyrhythmic detuning.",
    mood: 5,
    energy: 4,
    isFavorite: true,
    tags: ["Fitness", "Mindfulness", "music", "synthesizer"],
    sections: [
      {
        id: "sec-p1-1",
        sectionType: "highlights",
        content: "Completed OP-1 tape loop sketches and tested acoustic filter sweeps.",
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
    audioNotes: [
      {
        id: "audio-synth-1",
        url: "https://actions.google.com/sounds/v1/science_fiction/alien_hum.ogg",
        durationSeconds: 255,
        mimeType: "audio/webm",
        waveform: [15, 30, 50, 40, 60, 20, 50, 30, 10, 40, 20, 10, 30, 40, 20, 15, 25, 30, 10, 5],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    photos: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    syncStatus: "synced",
  },
  {
    id: "entry-2",
    entryDate: getPastDate(2),
    title: "Brutalist Pavilion Architecture & Atrium Study",
    body: "Stepped back to evaluate architectural proportion at the Neue Gallery pavilion. Raking sunlight cuts through concrete louvers creating sharp geometry.",
    mood: 3,
    energy: 3,
    isFavorite: false,
    tags: ["Reflection", "Learning", "architecture", "travel"],
    sections: [
      {
        id: "sec-p2-1",
        sectionType: "highlights",
        content: "Studied the quiet rhythm of the concrete pillars for upcoming designs.",
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
    audioNotes: [],
    photos: [
      {
        id: "photo-atrium-1",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7tIIfwUlV-7n9Gwa9x8hmq7ncZ4wJi0LINCUL1UrO_t6HkVfvs0Rv0IeBEfBg94jM6Bqn-oje1r8zErXKHt1MXo7k-MC46pM5cQUZ5Zjg_DzYIelGuiLfq3nacrPQR9p37HrN6JSI46fRtUXubvHQeuscaF0DSxLApvcavrusu_xXe8TfxSED0SvuOgG1-1JXe3WeCZs80ftmv0i8xSS8yBhm2SfgH1NO68MP6IOC",
        filename: "pavilion_atrium.jpg",
        caption: "PAVILION_03 • Raking sunlight through concrete louvers",
        mimeType: "image/jpeg",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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
    audioNotes: [],
    photos: [],
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
