import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ALL_TAGS, ENERGY_OPTIONS, INITIAL_TODAY_ENTRY, MOOD_OPTIONS } from "../../src/mockData";
import { EnergyLevel, JournalEntryMock, MoodLevel } from "../../src/types";

export default function TodayScreen() {
  const [entry, setEntry] = useState<JournalEntryMock>(INITIAL_TODAY_ENTRY);
  const [saveStatus, setSaveStatus] = useState<"synced" | "draft" | "saving">("draft");
  const [newTagInput, setNewTagInput] = useState("");

  const updateSection = (
    type: "highlights" | "gratitude" | "learned" | "tomorrow",
    content: string
  ) => {
    setEntry((prev) => {
      const existing = prev.sections.find((s) => s.sectionType === type);
      const updatedSections = existing
        ? prev.sections.map((s) => (s.sectionType === type ? { ...s, content } : s))
        : [...prev.sections, { id: `sec-${Date.now()}`, sectionType: type, content }];
      return { ...prev, sections: updatedSections };
    });
    setSaveStatus("draft");
  };

  const getSectionContent = (type: "highlights" | "gratitude" | "learned" | "tomorrow") => {
    return entry.sections.find((s) => s.sectionType === type)?.content || "";
  };

  const toggleTag = (tag: string) => {
    setEntry((prev) => {
      const exists = prev.tags.includes(tag);
      const tags = exists ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag];
      return { ...prev, tags };
    });
    setSaveStatus("draft");
  };

  const handleAddCustomTag = () => {
    const trimmed = newTagInput.trim();
    if (!trimmed || entry.tags.includes(trimmed)) return;
    setEntry((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    setNewTagInput("");
    setSaveStatus("draft");
  };

  const handleSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      setSaveStatus("synced");
    }, 400);
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
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dateSubtitle}>{entry.entryDate}</Text>
            <Text style={styles.headerTitle}>Daily Reflection</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={styles.favoriteButton}
              onPress={() => setEntry((p) => ({ ...p, isFavorite: !p.isFavorite }))}
              accessibilityLabel="Toggle Favorite"
            >
              <Text style={styles.favoriteIcon}>{entry.isFavorite ? "⭐" : "☆"}</Text>
            </Pressable>
            <View
              style={[
                styles.statusPill,
                saveStatus === "synced"
                  ? styles.statusSynced
                  : saveStatus === "saving"
                  ? styles.statusSaving
                  : styles.statusDraft,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  saveStatus === "synced"
                    ? styles.statusTextSynced
                    : saveStatus === "saving"
                    ? styles.statusTextSaving
                    : styles.statusTextDraft,
                ]}
              >
                {saveStatus === "synced"
                  ? "✓ Saved"
                  : saveStatus === "saving"
                  ? "Saving…"
                  : "• Draft"}
              </Text>
            </View>
          </View>
        </View>

        {/* Title Input */}
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Headline</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Sum up today in one thought..."
            placeholderTextColor="#94a3b8"
            value={entry.title}
            onChangeText={(title) => {
              setEntry((p) => ({ ...p, title }));
              setSaveStatus("draft");
            }}
          />
        </View>

        {/* Main Body */}
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Journal Entry</Text>
          <TextInput
            style={styles.bodyInput}
            placeholder="Write freely about today... thoughts, milestones, feelings."
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={entry.body}
            onChangeText={(body) => {
              setEntry((p) => ({ ...p, body }));
              setSaveStatus("draft");
            }}
          />
        </View>

        {/* Mood Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Mood</Text>
          <View style={styles.pillRow}>
            {MOOD_OPTIONS.map((opt) => {
              const isSelected = entry.mood === opt.level;
              return (
                <Pressable
                  key={opt.level}
                  style={[
                    styles.moodButton,
                    isSelected && styles.moodButtonSelected,
                    isSelected && { borderColor: opt.color },
                  ]}
                  onPress={() => {
                    setEntry((p) => ({ ...p, mood: opt.level as MoodLevel }));
                    setSaveStatus("draft");
                  }}
                >
                  <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.moodLabel,
                      isSelected && styles.moodLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Energy Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Energy Level</Text>
          <View style={styles.pillRow}>
            {ENERGY_OPTIONS.map((opt) => {
              const isSelected = entry.energy === opt.level;
              return (
                <Pressable
                  key={opt.level}
                  style={[
                    styles.energyButton,
                    isSelected && styles.energyButtonSelected,
                  ]}
                  onPress={() => {
                    setEntry((p) => ({ ...p, energy: opt.level as EnergyLevel }));
                    setSaveStatus("draft");
                  }}
                >
                  <Text
                    style={[
                      styles.energyBars,
                      isSelected && styles.energyBarsSelected,
                    ]}
                  >
                    {opt.bars}
                  </Text>
                  <Text
                    style={[
                      styles.energyLabel,
                      isSelected && styles.energyLabelSelected,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Structured Reflections Header */}
        <Text style={styles.reflectionsGroupTitle}>Structured Reflections</Text>

        {/* 1. Highlights */}
        <View style={styles.reflectionCard}>
          <View style={styles.reflectionHeader}>
            <Text style={styles.reflectionIcon}>🌟</Text>
            <View>
              <Text style={styles.reflectionTitle}>Highlights</Text>
              <Text style={styles.reflectionSubtitle}>What went well or felt meaningful?</Text>
            </View>
          </View>
          <TextInput
            style={styles.reflectionInput}
            placeholder="A win, connection, or breakthrough..."
            placeholderTextColor="#94a3b8"
            multiline
            value={getSectionContent("highlights")}
            onChangeText={(txt) => updateSection("highlights", txt)}
          />
        </View>

        {/* 2. Gratitude */}
        <View style={styles.reflectionCard}>
          <View style={styles.reflectionHeader}>
            <Text style={styles.reflectionIcon}>🙏</Text>
            <View>
              <Text style={styles.reflectionTitle}>Gratitude</Text>
              <Text style={styles.reflectionSubtitle}>What or who are you thankful for?</Text>
            </View>
          </View>
          <TextInput
            style={styles.reflectionInput}
            placeholder="Small joys, kindnesses, blessings..."
            placeholderTextColor="#94a3b8"
            multiline
            value={getSectionContent("gratitude")}
            onChangeText={(txt) => updateSection("gratitude", txt)}
          />
        </View>

        {/* 3. Learned */}
        <View style={styles.reflectionCard}>
          <View style={styles.reflectionHeader}>
            <Text style={styles.reflectionIcon}>💡</Text>
            <View>
              <Text style={styles.reflectionTitle}>Lessons & Insights</Text>
              <Text style={styles.reflectionSubtitle}>What did today teach you?</Text>
            </View>
          </View>
          <TextInput
            style={styles.reflectionInput}
            placeholder="A takeaway, realization, or adjustment..."
            placeholderTextColor="#94a3b8"
            multiline
            value={getSectionContent("learned")}
            onChangeText={(txt) => updateSection("learned", txt)}
          />
        </View>

        {/* 4. Tomorrow Intention */}
        <View style={styles.reflectionCard}>
          <View style={styles.reflectionHeader}>
            <Text style={styles.reflectionIcon}>🎯</Text>
            <View>
              <Text style={styles.reflectionTitle}>Tomorrow's Intention</Text>
              <Text style={styles.reflectionSubtitle}>What is your primary focus for tomorrow?</Text>
            </View>
          </View>
          <TextInput
            style={styles.reflectionInput}
            placeholder="The single most important objective..."
            placeholderTextColor="#94a3b8"
            multiline
            value={getSectionContent("tomorrow")}
            onChangeText={(txt) => updateSection("tomorrow", txt)}
          />
        </View>

        {/* Tags */}
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Tags</Text>
          <View style={styles.tagChipsWrap}>
            {ALL_TAGS.map((tag) => {
              const selected = entry.tags.includes(tag);
              return (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                    #{tag}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Custom tag input */}
          <View style={styles.customTagRow}>
            <TextInput
              style={styles.customTagInput}
              placeholder="Add custom tag..."
              placeholderTextColor="#94a3b8"
              value={newTagInput}
              onChangeText={setNewTagInput}
              onSubmitEditing={handleAddCustomTag}
            />
            <Pressable style={styles.addTagButton} onPress={handleAddCustomTag}>
              <Text style={styles.addTagButtonText}>+ Add</Text>
            </Pressable>
          </View>
        </View>

        {/* Action Button */}
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {saveStatus === "saving" ? "Saving Entry..." : "Save Today's Entry"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
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
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoriteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  favoriteIcon: {
    fontSize: 18,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusSynced: {
    backgroundColor: "#dcfce7",
  },
  statusSaving: {
    backgroundColor: "#fef9c3",
  },
  statusDraft: {
    backgroundColor: "#f1f5f9",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextSynced: {
    color: "#15803d",
  },
  statusTextSaving: {
    color: "#a16207",
  },
  statusTextDraft: {
    color: "#64748b",
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 15,
    lineHeight: 22,
    color: "#1e293b",
    minHeight: 120,
    paddingVertical: 4,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodButton: {
    flex: 1,
    minWidth: 54,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  moodButtonSelected: {
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  moodLabelSelected: {
    color: "#0f172a",
    fontWeight: "700",
  },
  energyButton: {
    flex: 1,
    minWidth: 54,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  energyButtonSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#0284c7",
    borderWidth: 2,
  },
  energyBars: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 2,
  },
  energyBarsSelected: {
    color: "#0284c7",
  },
  energyLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  energyLabelSelected: {
    color: "#0284c7",
    fontWeight: "700",
  },
  reflectionsGroupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 8,
    marginBottom: 12,
  },
  reflectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  reflectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  reflectionIcon: {
    fontSize: 22,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  reflectionSubtitle: {
    fontSize: 12,
    color: "#64748b",
  },
  reflectionInput: {
    fontSize: 14,
    lineHeight: 20,
    color: "#1e293b",
    minHeight: 50,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
  },
  tagChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tagChipSelected: {
    backgroundColor: "#0284c7",
    borderColor: "#0284c7",
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  tagChipTextSelected: {
    color: "#ffffff",
  },
  customTagRow: {
    flexDirection: "row",
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: "#0f172a",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addTagButton: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  addTagButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  saveButton: {
    backgroundColor: "#0284c7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
