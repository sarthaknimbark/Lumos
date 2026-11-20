import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/api/client";
import { ALL_TAGS, ENERGY_OPTIONS, MOOD_OPTIONS } from "../../src/mockData";
import { JournalEntryResponse } from "@myday/contracts";

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftDateString(dateStr: string, offsetDays: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function TodayScreen() {
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"synced" | "draft" | "saving" | "error">("synced");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State
  const [entryId, setEntryId] = useState<string | null>(null);
  const [revision, setRevision] = useState<number>(1);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<number | null>(4);
  const [energy, setEnergy] = useState<number | null>(4);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(["reflection"]);
  const [newTagInput, setNewTagInput] = useState("");

  // Structured Reflection Sections
  const [highlights, setHighlights] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [learned, setLearlearned] = useState("");
  const [tomorrow, setTomorrow] = useState("");

  // AI Prompt State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  // Load entry for currentDate
  useEffect(() => {
    let cancelled = false;
    async function fetchEntry() {
      setLoading(true);
      setStatusMessage(null);
      try {
        const found = await api.getEntryByDate(currentDate);
        if (cancelled) return;
        if (found) {
          setEntryId(found.id);
          setRevision(found.revision);
          setTitle(found.title || "");
          setBody(found.body || "");
          setMood(found.mood || null);
          setEnergy(found.energy || null);
          setIsFavorite(found.isFavorite);
          setSelectedTags(found.tags || []);

          // Sections
          const h = found.sections.find((s) => s.sectionType === "highlights")?.content || "";
          const g = found.sections.find((s) => s.sectionType === "gratitude")?.content || "";
          const l = found.sections.find((s) => s.sectionType === "learned")?.content || "";
          const t = found.sections.find((s) => s.sectionType === "tomorrow")?.content || "";
          setHighlights(h);
          setGratitude(g);
          setLearlearned(l);
          setTomorrow(t);
          setSaveStatus("synced");
        } else {
          // Reset for fresh entry
          setEntryId(null);
          setRevision(1);
          setTitle("");
          setBody("");
          setMood(4);
          setEnergy(4);
          setIsFavorite(false);
          setSelectedTags(["reflection"]);
          setHighlights("");
          setGratitude("");
          setLearlearned("");
          setTomorrow("");
          setSaveStatus("draft");
        }
      } catch (err: any) {
        if (!cancelled) {
          setStatusMessage("Working offline. Local draft mode.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEntry();
    return () => {
      cancelled = true;
    };
  }, [currentDate]);

  const handleSave = async () => {
    if (!body.trim()) {
      setStatusMessage("Journal body is required to save.");
      return;
    }

    setSaveStatus("saving");
    setStatusMessage(null);

    const sections = [
      highlights ? { sectionType: "highlights" as const, content: highlights, sortOrder: 0 } : null,
      gratitude ? { sectionType: "gratitude" as const, content: gratitude, sortOrder: 1 } : null,
      learned ? { sectionType: "learned" as const, content: learned, sortOrder: 2 } : null,
      tomorrow ? { sectionType: "tomorrow" as const, content: tomorrow, sortOrder: 3 } : null,
    ].filter(Boolean) as any[];

    try {
      if (entryId) {
        const updated = await api.updateEntry(entryId, {
          baseRevision: revision,
          title: title.trim() || null,
          body: body.trim(),
          mood,
          energy,
          isFavorite,
          sections,
          tags: selectedTags,
        });
        setRevision(updated.revision);
        setSaveStatus("synced");
        setStatusMessage("Entry saved!");
      } else {
        const created = await api.createEntry({
          entryDate: currentDate,
          title: title.trim() || null,
          body: body.trim(),
          mood,
          energy,
          status: "published",
          isFavorite,
          sections,
          tags: selectedTags,
        });
        setEntryId(created.id);
        setRevision(created.revision);
        setSaveStatus("synced");
        setStatusMessage("Entry created!");
      }
    } catch (err: any) {
      setSaveStatus("error");
      if (err.code === "CONFLICT") {
        setStatusMessage("Conflict: Entry was updated elsewhere. Please refresh.");
      } else {
        setStatusMessage(err.message || "Failed to save entry.");
      }
    }
  };

  const handleAiReflection = async () => {
    setAiLoading(true);
    try {
      const res = await api.getAiReflection({
        promptType: "reflection",
        mood: mood || undefined,
        tags: selectedTags,
        entryContext: body.slice(0, 500),
      });
      setAiPrompt(res.prompt);
    } catch {
      setAiPrompt("What is the single most meaningful event that shaped your mood today?");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setSaveStatus("draft");
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim().toLowerCase();
    if (!trimmed || selectedTags.includes(trimmed)) return;
    setSelectedTags((prev) => [...prev, trimmed]);
    setNewTagInput("");
    setSaveStatus("draft");
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date Navigation Bar */}
        <View style={styles.dateNavRow}>
          <Pressable
            style={styles.dateNavButton}
            onPress={() => setCurrentDate((d) => shiftDateString(d, -1))}
          >
            <Text style={styles.dateNavButtonText}>‹ Previous</Text>
          </Pressable>

          <Pressable
            style={styles.todayButton}
            onPress={() => setCurrentDate(getTodayString())}
          >
            <Text style={styles.todayButtonText}>
              {currentDate === getTodayString() ? "● Today" : "Jump to Today"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.dateNavButton}
            onPress={() => setCurrentDate((d) => shiftDateString(d, 1))}
          >
            <Text style={styles.dateNavButtonText}>Next ›</Text>
          </Pressable>
        </View>

        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dateSubtitle}>{currentDate}</Text>
            <Text style={styles.headerTitle}>Daily Journal</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.favoriteButton}
              onPress={() => {
                setIsFavorite((f) => !f);
                setSaveStatus("draft");
              }}
              accessibilityLabel="Toggle Favorite"
            >
              <Text style={styles.favoriteIcon}>{isFavorite ? "★" : "☆"}</Text>
            </Pressable>
            <View
              style={[
                styles.statusPill,
                saveStatus === "synced"
                  ? styles.statusSynced
                  : saveStatus === "saving"
                  ? styles.statusSaving
                  : saveStatus === "error"
                  ? styles.statusError
                  : styles.statusDraft,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  saveStatus === "synced"
                    ? styles.statusTextSynced
                    : styles.statusTextDraft,
                ]}
              >
                {saveStatus === "synced"
                  ? "✓ Saved"
                  : saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "error"
                  ? "Error"
                  : "Draft"}
              </Text>
            </View>
          </View>
        </View>

        {statusMessage && (
          <View style={styles.notificationBanner}>
            <Text style={styles.notificationText}>{statusMessage}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading entry for {currentDate}...</Text>
          </View>
        ) : (
          <>
            {/* Title / Headline */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Headline</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give today a title or theme..."
                placeholderTextColor="#9ca3af"
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setSaveStatus("draft");
                }}
              />
            </View>

            {/* AI Reflection Prompt Banner */}
            <View style={styles.aiCard}>
              <View style={styles.aiHeaderRow}>
                <Text style={styles.aiHeading}>✨ Groq AI Reflection Guide</Text>
                <Pressable
                  style={styles.aiButton}
                  onPress={handleAiReflection}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.aiButtonText}>Ask AI</Text>
                  )}
                </Pressable>
              </View>
              {aiPrompt && <Text style={styles.aiPromptText}>{aiPrompt}</Text>}
            </View>

            {/* Journal Body */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Main Entry</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder="What happened today? How are you feeling?"
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={body}
                onChangeText={(b) => {
                  setBody(b);
                  setSaveStatus("draft");
                }}
              />
            </View>

            {/* Mood & Energy Selectors */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Mood</Text>
              <View style={styles.optionsRow}>
                {MOOD_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.level}
                    style={[
                      styles.optionChip,
                      mood === opt.level && styles.optionChipSelected,
                    ]}
                    onPress={() => {
                      setMood(opt.level);
                      setSaveStatus("draft");
                    }}
                  >
                    <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        mood === opt.level && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Energy</Text>
              <View style={styles.optionsRow}>
                {ENERGY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.level}
                    style={[
                      styles.optionChip,
                      energy === opt.level && styles.optionChipSelected,
                    ]}
                    onPress={() => {
                      setEnergy(opt.level);
                      setSaveStatus("draft");
                    }}
                  >
                    <Text style={styles.optionEmoji}>{opt.bars}</Text>
                    <Text
                      style={[
                        styles.optionLabel,
                        energy === opt.level && styles.optionLabelSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Structured Reflection Sections */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Structured Reflections</Text>

              <Text style={styles.sectionSubtitle}>🌟 Daily Highlights</Text>
              <TextInput
                style={styles.sectionInput}
                placeholder="Key moments, wins, or accomplishments..."
                placeholderTextColor="#9ca3af"
                multiline
                value={highlights}
                onChangeText={(t) => {
                  setHighlights(t);
                  setSaveStatus("draft");
                }}
              />

              <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>🙏 Gratitude</Text>
              <TextInput
                style={styles.sectionInput}
                placeholder="Things, people, or moments you are grateful for..."
                placeholderTextColor="#9ca3af"
                multiline
                value={gratitude}
                onChangeText={(t) => {
                  setGratitude(t);
                  setSaveStatus("draft");
                }}
              />

              <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>💡 Lessons Learned</Text>
              <TextInput
                style={styles.sectionInput}
                placeholder="Insights or takeaways from today..."
                placeholderTextColor="#9ca3af"
                multiline
                value={learned}
                onChangeText={(t) => {
                  setLearlearned(t);
                  setSaveStatus("draft");
                }}
              />

              <Text style={[styles.sectionSubtitle, { marginTop: 12 }]}>🎯 Tomorrow Intention</Text>
              <TextInput
                style={styles.sectionInput}
                placeholder="Focus, intention, or priority for tomorrow..."
                placeholderTextColor="#9ca3af"
                multiline
                value={tomorrow}
                onChangeText={(t) => {
                  setTomorrow(t);
                  setSaveStatus("draft");
                }}
              />
            </View>

            {/* Tags Section */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Tags</Text>
              <View style={styles.tagsContainer}>
                {ALL_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag.toLowerCase());
                  return (
                    <Pressable
                      key={tag}
                      style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                      onPress={() => toggleTag(tag.toLowerCase())}
                    >
                      <Text
                        style={[
                          styles.tagPillText,
                          isSelected && styles.tagPillTextSelected,
                        ]}
                      >
                        #{tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.addTagRow}>
                <TextInput
                  style={styles.addTagInput}
                  placeholder="Add custom tag..."
                  placeholderTextColor="#9ca3af"
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddCustomTag}
                />
                <Pressable style={styles.addTagButton} onPress={handleAddCustomTag}>
                  <Text style={styles.addTagButtonText}>+ Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Save Entry CTA */}
            <Pressable
              style={[styles.saveButton, saveStatus === "saving" && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saveStatus === "saving"}
            >
              <Text style={styles.saveButtonText}>
                {saveStatus === "saving" ? "Saving..." : "Save Journal Entry"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  dateNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dateNavButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  dateNavButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
  },
  todayButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#e0e7ff",
  },
  todayButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4f46e5",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  dateSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoriteButton: {
    padding: 6,
  },
  favoriteIcon: {
    fontSize: 22,
    color: "#f59e0b",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusSynced: {
    backgroundColor: "#d1fae5",
  },
  statusSaving: {
    backgroundColor: "#fef3c7",
  },
  statusDraft: {
    backgroundColor: "#e5e7eb",
  },
  statusError: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextSynced: {
    color: "#065f46",
  },
  statusTextDraft: {
    color: "#4b5563",
  },
  notificationBanner: {
    backgroundColor: "#eff6ff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginBottom: 12,
  },
  notificationText: {
    fontSize: 13,
    color: "#1e40af",
    textAlign: "center",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aiCard: {
    backgroundColor: "#faf5ff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  aiHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7e22ce",
  },
  aiButton: {
    backgroundColor: "#9333ea",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  aiButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  aiPromptText: {
    marginTop: 10,
    fontSize: 13,
    fontStyle: "italic",
    color: "#581c87",
    lineHeight: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 15,
    color: "#1f2937",
    lineHeight: 22,
    minHeight: 120,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  optionChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  optionChipSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#e0e7ff",
  },
  optionEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#4b5563",
  },
  optionLabelSelected: {
    color: "#4338ca",
    fontWeight: "700",
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  sectionInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1f2937",
    minHeight: 50,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tagPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  tagPillSelected: {
    backgroundColor: "#4f46e5",
  },
  tagPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  tagPillTextSelected: {
    color: "#ffffff",
  },
  addTagRow: {
    flexDirection: "row",
    gap: 8,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: "#111827",
  },
  addTagButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 8,
  },
  addTagButtonText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});
