import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "../../src/api/client";
import { offlineStorage } from "../../src/offline/storage";
import { syncManager } from "../../src/offline/syncManager";
import { ALL_TAGS } from "../../src/mockData";
import { THEME } from "../../src/theme";
import { MoodSelector } from "../../src/components/MoodSelector";
import { EnergySelector } from "../../src/components/EnergySelector";
import { TagPill } from "../../src/components/TagPill";
import { CalendarEventItem } from "@myday/contracts";

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

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Google Calendar Read-Only Context (Phase 8)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);

  // Offline Sync State
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Listen to offline sync queue changes
  useEffect(() => {
    const checkQueue = async () => {
      try {
        if (offlineStorage && typeof offlineStorage.getQueuedOperations === "function") {
          const q = await offlineStorage.getQueuedOperations();
          setPendingSyncCount(q?.length || 0);
        }
      } catch {
        // Ignore check errors
      }
    };
    checkQueue();
    const interval = setInterval(checkQueue, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch or load draft for currentDate
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatusMessage(null);

    async function loadData() {
      // 1. Check local draft
      try {
        if (offlineStorage && typeof offlineStorage.getDraft === "function") {
          const rawDraft = await offlineStorage.getDraft(currentDate);
          if (rawDraft && !cancelled) {
            const localDraft = rawDraft as any;
            setTitle(localDraft.title || "");
            setBody(localDraft.body || "");
            setMood(localDraft.mood ?? null);
            setEnergy(localDraft.energy ?? null);
            setIsFavorite(localDraft.isFavorite ?? false);
            setSelectedTags(localDraft.tags ?? []);
            const h = localDraft.sections?.find((s: any) => s.sectionType === "highlights")?.content || "";
            const g = localDraft.sections?.find((s: any) => s.sectionType === "gratitude")?.content || "";
            const l = localDraft.sections?.find((s: any) => s.sectionType === "learned")?.content || "";
            const t = localDraft.sections?.find((s: any) => s.sectionType === "tomorrow")?.content || "";
            setHighlights(h);
            setGratitude(g);
            setLearlearned(l);
            setTomorrow(t);
            setSaveStatus("draft");
            setLoading(false);
            return;
          }
        }
      } catch {
        // Ignore local read errors
      }

      // 2. Fetch server version from API
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

          const h = found.sections.find((s) => s.sectionType === "highlights")?.content || "";
          const g = found.sections.find((s) => s.sectionType === "gratitude")?.content || "";
          const l = found.sections.find((s) => s.sectionType === "learned")?.content || "";
          const t = found.sections.find((s) => s.sectionType === "tomorrow")?.content || "";
          setHighlights(h);
          setGratitude(g);
          setLearlearned(l);
          setTomorrow(t);
          setSaveStatus("synced");
          setStatusMessage(null);
        } else {
          // Fresh entry for date
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
      } catch {
        if (!cancelled) {
          setStatusMessage("Working offline. All changes saved locally.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    // Fetch read-only Google Calendar context for currentDate
    api.getCalendarEvents(currentDate)
      .then((ev) => {
        if (!cancelled) setCalendarEvents(ev);
      })
      .catch(() => {
        if (!cancelled) setCalendarEvents([]);
      });

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

    const draftData = {
      entryId,
      baseRevision: revision,
      title: title.trim() || null,
      body: body.trim(),
      mood,
      energy,
      isFavorite,
      sections,
      tags: selectedTags,
    };

    // 1. Save to local draft store and sync queue immediately
    await syncManager.saveLocalDraft(currentDate, draftData);

    // 2. Try online sync immediately
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
        await offlineStorage.deleteDraft(currentDate);
        setStatusMessage("Entry synced successfully!");
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
        await offlineStorage.deleteDraft(currentDate);
        setStatusMessage("Entry created and synced!");
      }
    } catch (err: any) {
      if (err.code === "CONFLICT") {
        setSaveStatus("error");
        setShowConflictModal(true);
      } else {
        // Network failure: draft remains safely queued
        setSaveStatus("draft");
        setStatusMessage("Saved locally (offline). Will sync automatically when online.");
      }
    }
  };

  const handleResolveConflict = async (strategy: "keep_server" | "keep_local") => {
    setShowConflictModal(false);
    setLoading(true);

    try {
      const serverEntry = await api.getEntryByDate(currentDate);
      if (!serverEntry) return;

      if (strategy === "keep_server") {
        await syncManager.resolveConflict({
          strategy: "keep_server",
          entryId: serverEntry.id,
          serverRevision: serverEntry.revision,
        });
        setEntryId(serverEntry.id);
        setRevision(serverEntry.revision);
        setTitle(serverEntry.title || "");
        setBody(serverEntry.body || "");
        setSaveStatus("synced");
        setStatusMessage("Restored server version.");
      } else if (strategy === "keep_local") {
        await syncManager.resolveConflict({
          strategy: "keep_local",
          entryId: serverEntry.id,
          serverRevision: serverEntry.revision,
        });
        setRevision(serverEntry.revision + 1);
        setSaveStatus("synced");
        setStatusMessage("Local changes applied over server.");
      }
    } catch {
      setStatusMessage("Failed to resolve conflict. Check connection.");
    } finally {
      setLoading(false);
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
      setAiPrompt("What is the single most meaningful event that shaped your perspective today?");
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
        {/* Offline Sync Banner */}
        {pendingSyncCount > 0 && (
          <View style={styles.syncBanner}>
            <View style={styles.syncBannerLeft}>
              <Ionicons name="cloud-offline-outline" size={16} color={THEME.colors.amber} />
              <Text style={styles.syncBannerText}>
                {pendingSyncCount} offline change{pendingSyncCount === 1 ? "" : "s"} queued
              </Text>
            </View>
            <Pressable
              style={styles.syncNowButton}
              onPress={() => syncManager.flushQueue()}
            >
              <Text style={styles.syncNowButtonText}>Sync Now</Text>
            </Pressable>
          </View>
        )}

        {/* Date Navigation Bar */}
        <View style={styles.dateNavRow}>
          <Pressable
            style={styles.navArrowBtn}
            onPress={() => setCurrentDate((d) => shiftDateString(d, -1))}
          >
            <Ionicons name="chevron-back" size={18} color={THEME.colors.textPrimary} />
          </Pressable>

          <Pressable
            style={styles.dateDisplay}
            onPress={() => setCurrentDate(getTodayString())}
          >
            <Ionicons
              name={currentDate === getTodayString() ? "calendar" : "calendar-outline"}
              size={15}
              color={currentDate === getTodayString() ? THEME.colors.accent : THEME.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.dateDisplayText}>{formatDisplayDate(currentDate)}</Text>
          </Pressable>

          <Pressable
            style={styles.navArrowBtn}
            onPress={() => setCurrentDate((d) => shiftDateString(d, 1))}
          >
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textPrimary} />
          </Pressable>
        </View>

        {/* Top Header / Meta Bar */}
        <View style={styles.headerBar}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerEyebrow}>DAILY REFLECTION</Text>
            <Text style={styles.headerMainTitle}>
              {currentDate === getTodayString() ? "Today's Canvas" : "Journal Entry"}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {/* Favorite Button */}
            <Pressable
              style={styles.favoriteButton}
              onPress={() => {
                setIsFavorite((f) => !f);
                setSaveStatus("draft");
              }}
              accessibilityLabel="Toggle Favorite"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? THEME.colors.rose : THEME.colors.textSecondary}
              />
            </Pressable>

            {/* Sync Status Badge */}
            <View
              style={[
                styles.statusBadge,
                saveStatus === "synced"
                  ? styles.statusBadgeSynced
                  : saveStatus === "saving"
                  ? styles.statusBadgeSaving
                  : saveStatus === "error"
                  ? styles.statusBadgeError
                  : styles.statusBadgeDraft,
              ]}
            >
              <Ionicons
                name={
                  saveStatus === "synced"
                    ? "checkmark-circle"
                    : saveStatus === "saving"
                    ? "sync-outline"
                    : saveStatus === "error"
                    ? "alert-circle-outline"
                    : "cloud-offline-outline"
                }
                size={13}
                color={
                  saveStatus === "synced"
                    ? THEME.colors.emerald
                    : saveStatus === "saving"
                    ? THEME.colors.accent
                    : saveStatus === "error"
                    ? THEME.colors.rose
                    : THEME.colors.amber
                }
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color:
                      saveStatus === "synced"
                        ? THEME.colors.emerald
                        : saveStatus === "saving"
                        ? THEME.colors.accent
                        : saveStatus === "error"
                        ? THEME.colors.rose
                        : THEME.colors.amber,
                  },
                ]}
              >
                {saveStatus === "synced"
                  ? "Synced"
                  : saveStatus === "saving"
                  ? "Saving"
                  : saveStatus === "error"
                  ? "Conflict"
                  : "Local Draft"}
              </Text>
            </View>
          </View>
        </View>

        {statusMessage && (
          <View style={styles.notificationToast}>
            <Text style={styles.notificationText}>{statusMessage}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={THEME.colors.accent} />
            <Text style={styles.loadingText}>Loading {currentDate}...</Text>
          </View>
        ) : (
          <>
            {/* AI Reflection Spark (Bento Card) */}
            <View style={styles.aiSparkCard}>
              <View style={styles.aiSparkHeader}>
                <View style={styles.aiSparkTitleRow}>
                  <Ionicons name="sparkles-outline" size={17} color={THEME.colors.accent} />
                  <Text style={styles.aiSparkTitle}>Reflection Spark</Text>
                </View>
                <Pressable
                  style={styles.aiSparkButton}
                  onPress={handleAiReflection}
                  disabled={aiLoading}
                >
                  {aiLoading ? (
                    <ActivityIndicator size="small" color={THEME.colors.textPrimary} />
                  ) : (
                    <Text style={styles.aiSparkButtonText}>Ask Guide</Text>
                  )}
                </Pressable>
              </View>
              {aiPrompt && <Text style={styles.aiSparkContent}>{aiPrompt}</Text>}
            </View>

            {/* Google Calendar Read-Only Day Schedule Context (Phase 8) */}
            {calendarEvents.length > 0 && (
              <View style={styles.calContextCard}>
                <View style={styles.calContextHeader}>
                  <Ionicons name="calendar-outline" size={15} color={THEME.colors.sky} />
                  <Text style={styles.calContextTitle}>Day Schedule Context ({calendarEvents.length} events)</Text>
                </View>
                <View style={styles.calEventsList}>
                  {calendarEvents.map((ev) => {
                    const startFmt = ev.startTime.length >= 16 ? ev.startTime.slice(11, 16) : ev.startTime;
                    const endFmt = ev.endTime.length >= 16 ? ev.endTime.slice(11, 16) : ev.endTime;
                    return (
                      <View key={ev.id} style={styles.calEventRow}>
                        <View style={styles.calEventTimeBadge}>
                          <Text style={styles.calEventTimeText}>{startFmt} - {endFmt}</Text>
                        </View>
                        <Text style={styles.calEventTitle} numberOfLines={1}>
                          {ev.title}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Headline Input Card */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>HEADLINE</Text>
              <TextInput
                style={styles.headlineInput}
                placeholder="Give today a title or central theme..."
                placeholderTextColor={THEME.colors.textTertiary}
                value={title}
                onChangeText={(t) => {
                  setTitle(t);
                  setSaveStatus("draft");
                }}
              />
            </View>

            {/* Main Journal Canvas */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>ENTRY</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder="What happened today? Write freely..."
                placeholderTextColor={THEME.colors.textTertiary}
                multiline
                numberOfLines={7}
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
              <Text style={styles.fieldLabel}>MOOD</Text>
              <MoodSelector
                value={mood}
                onChange={(m) => {
                  setMood(m);
                  setSaveStatus("draft");
                }}
              />

              <Text style={[styles.fieldLabel, { marginTop: THEME.spacing.lg }]}>
                ENERGY LEVEL
              </Text>
              <EnergySelector
                value={energy}
                onChange={(e) => {
                  setEnergy(e);
                  setSaveStatus("draft");
                }}
              />
            </View>

            {/* Structured Reflections Bento Grid */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>STRUCTURED REFLECTION</Text>

              {/* Highlights */}
              <View style={styles.bentoSection}>
                <View style={styles.bentoHeader}>
                  <Ionicons name="ribbon-outline" size={16} color={THEME.colors.amber} />
                  <Text style={styles.bentoTitle}>Daily Highlights</Text>
                </View>
                <TextInput
                  style={styles.bentoInput}
                  placeholder="Key moments, wins, or accomplishments..."
                  placeholderTextColor={THEME.colors.textTertiary}
                  multiline
                  value={highlights}
                  onChangeText={(t) => {
                    setHighlights(t);
                    setSaveStatus("draft");
                  }}
                />
              </View>

              {/* Gratitude */}
              <View style={styles.bentoSection}>
                <View style={styles.bentoHeader}>
                  <Ionicons name="gift-outline" size={16} color={THEME.colors.rose} />
                  <Text style={styles.bentoTitle}>Gratitude</Text>
                </View>
                <TextInput
                  style={styles.bentoInput}
                  placeholder="People, privileges, or moments you appreciate..."
                  placeholderTextColor={THEME.colors.textTertiary}
                  multiline
                  value={gratitude}
                  onChangeText={(t) => {
                    setGratitude(t);
                    setSaveStatus("draft");
                  }}
                />
              </View>

              {/* Lessons */}
              <View style={styles.bentoSection}>
                <View style={styles.bentoHeader}>
                  <Ionicons name="bulb-outline" size={16} color={THEME.colors.emerald} />
                  <Text style={styles.bentoTitle}>Lessons Learned</Text>
                </View>
                <TextInput
                  style={styles.bentoInput}
                  placeholder="Takeaways, corrections, or discoveries..."
                  placeholderTextColor={THEME.colors.textTertiary}
                  multiline
                  value={learned}
                  onChangeText={(t) => {
                    setLearlearned(t);
                    setSaveStatus("draft");
                  }}
                />
              </View>

              {/* Tomorrow */}
              <View style={styles.bentoSection}>
                <View style={styles.bentoHeader}>
                  <Ionicons name="flag-outline" size={16} color={THEME.colors.sky} />
                  <Text style={styles.bentoTitle}>Tomorrow's Intention</Text>
                </View>
                <TextInput
                  style={styles.bentoInput}
                  placeholder="What is the single primary priority for tomorrow?"
                  placeholderTextColor={THEME.colors.textTertiary}
                  multiline
                  value={tomorrow}
                  onChangeText={(t) => {
                    setTomorrow(t);
                    setSaveStatus("draft");
                  }}
                />
              </View>
            </View>

            {/* Tags Section */}
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>TAGS</Text>
              <View style={styles.tagsContainer}>
                {ALL_TAGS.map((tag) => {
                  const normalized = tag.toLowerCase();
                  const isSelected = selectedTags.includes(normalized);
                  return (
                    <TagPill
                      key={tag}
                      label={tag}
                      isSelected={isSelected}
                      onPress={() => toggleTag(normalized)}
                    />
                  );
                })}
              </View>

              <View style={styles.addTagRow}>
                <TextInput
                  style={styles.addTagInput}
                  placeholder="Add custom tag..."
                  placeholderTextColor={THEME.colors.textTertiary}
                  value={newTagInput}
                  onChangeText={setNewTagInput}
                  onSubmitEditing={handleAddCustomTag}
                />
                <Pressable style={styles.addTagButton} onPress={handleAddCustomTag}>
                  <Text style={styles.addTagButtonText}>+ Add</Text>
                </Pressable>
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              style={[
                styles.saveButton,
                saveStatus === "saving" && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saveStatus === "saving"}
            >
              <Ionicons
                name="checkmark"
                size={18}
                color={THEME.colors.textPrimary}
                style={{ marginRight: 6 }}
              />
              <Text style={styles.saveButtonText}>
                {saveStatus === "saving" ? "Saving..." : "Save Entry"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      {/* Conflict Resolution Modal */}
      <Modal
        visible={showConflictModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConflictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.conflictCard}>
            <View style={styles.conflictIconHeader}>
              <Ionicons name="alert-circle-outline" size={28} color={THEME.colors.rose} />
              <Text style={styles.conflictTitle}>Version Conflict Detected</Text>
            </View>
            <Text style={styles.conflictBody}>
              This entry was modified on another device while this device was offline. How would you like to proceed?
            </Text>

            <View style={styles.conflictActions}>
              <Pressable
                style={styles.conflictButtonSecondary}
                onPress={() => handleResolveConflict("keep_server")}
              >
                <Text style={styles.conflictButtonSecondaryText}>
                  Keep Server Version
                </Text>
              </Pressable>

              <Pressable
                style={styles.conflictButtonPrimary}
                onPress={() => handleResolveConflict("keep_local")}
              >
                <Text style={styles.conflictButtonPrimaryText}>
                  Overwrite with My Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: 50,
    maxWidth: 740,
    width: "100%",
    alignSelf: "center",
  },
  syncBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.colors.amberMuted,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  syncBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  syncBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.amber,
  },
  syncNowButton: {
    backgroundColor: THEME.colors.amber,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.sm,
  },
  syncNowButtonText: {
    color: "#0c0d12",
    fontSize: 11,
    fontWeight: "700",
  },
  dateNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 6,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  dateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  dateDisplayText: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    marginTop: 4,
  },
  headerTitleWrap: {
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1.2,
  },
  headerMainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    letterSpacing: -0.4,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  favoriteButton: {
    width: 38,
    height: 38,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  statusBadgeSynced: {
    backgroundColor: THEME.colors.emeraldMuted,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  statusBadgeSaving: {
    backgroundColor: THEME.colors.accentMuted,
    borderColor: THEME.colors.accentBorder,
  },
  statusBadgeDraft: {
    backgroundColor: THEME.colors.amberMuted,
    borderColor: "rgba(245, 158, 11, 0.25)",
  },
  statusBadgeError: {
    backgroundColor: THEME.colors.roseMuted,
    borderColor: "rgba(244, 63, 94, 0.25)",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  notificationToast: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 10,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.md,
  },
  notificationText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    gap: 10,
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  aiSparkCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 14,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.accentBorder,
  },
  aiSparkHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiSparkTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  aiSparkTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.accent,
    letterSpacing: -0.2,
  },
  aiSparkButton: {
    backgroundColor: THEME.colors.accentMuted,
    borderWidth: 1,
    borderColor: THEME.colors.accentBorder,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
  },
  aiSparkButtonText: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: "600",
  },
  aiSparkContent: {
    marginTop: 10,
    color: THEME.colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: "italic",
  },
  calContextCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 14,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.25)",
  },
  calContextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  calContextTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.sky,
    letterSpacing: -0.2,
  },
  calEventsList: {
    gap: 6,
  },
  calEventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calEventTimeBadge: {
    backgroundColor: THEME.colors.skyMuted,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.sm,
  },
  calEventTimeText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.sky,
  },
  calEventTitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    flex: 1,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  headlineInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 12,
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  bodyInput: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    padding: 14,
    color: THEME.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
  },
  bentoSection: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  bentoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  bentoTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  bentoInput: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    minHeight: 36,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  addTagRow: {
    flexDirection: "row",
    gap: 8,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    color: THEME.colors.textPrimary,
    fontSize: 13,
  },
  addTagButton: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  addTagButtonText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.accent,
    borderRadius: THEME.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  conflictCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: 22,
    maxWidth: 440,
    width: "100%",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  conflictIconHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  conflictTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  conflictBody: {
    fontSize: 13,
    lineHeight: 20,
    color: THEME.colors.textSecondary,
    marginBottom: 20,
  },
  conflictActions: {
    flexDirection: "row",
    gap: 10,
  },
  conflictButtonSecondary: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  conflictButtonSecondaryText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  conflictButtonPrimary: {
    flex: 1,
    backgroundColor: THEME.colors.accent,
    borderRadius: THEME.radius.md,
    paddingVertical: 10,
    alignItems: "center",
  },
  conflictButtonPrimaryText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
