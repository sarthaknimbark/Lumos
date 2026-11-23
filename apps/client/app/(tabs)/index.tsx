import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { PhotoLightboxModal } from "../../src/components/PhotoLightboxModal";
import {
  AudioNoteAttachment,
  CalendarEventItem,
  PhotoAttachment,
} from "@myday/contracts";

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
  });
}

export default function TodayScreen() {
  const [currentDate, setCurrentDate] = useState(getTodayString());
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"synced" | "draft" | "saving" | "error">("synced");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Mode Switcher: Type Reflection vs. Record Note (Stitch Dual-Mode)
  const [entryMode, setEntryMode] = useState<"type" | "record">("type");

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

  // Media: Audio Notes & Photos
  const [audioNotes, setAudioNotes] = useState<AudioNoteAttachment[]>([
    {
      id: "memo_sample_01",
      url: "memo_sample.m4a",
      durationSeconds: 195,
      mimeType: "audio/m4a",
      waveform: [12, 24, 45, 60, 32, 18, 55, 78, 20, 65, 80, 42, 30, 90, 100, 50, 65, 30, 60, 75],
      createdAt: new Date().toISOString(),
    },
  ]);
  const [photos, setPhotos] = useState<PhotoAttachment[]>([
    {
      id: "photo_sample_01",
      url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
      filename: "Morning Ritual",
      caption: "Quiet studio espresso",
      sizeBytes: 840000,
      mimeType: "image/jpeg",
      createdAt: new Date().toISOString(),
    },
  ]);

  // Lightbox State
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Audio Recorder & Player State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayTime, setAudioPlayTime] = useState(102);
  const [playbackRate, setPlaybackRate] = useState("1.0x");

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Google Calendar Read-Only Context (Phase 8)
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);

  // Offline Sync State
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [showConflictModal, setShowConflictModal] = useState(false);

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Audio Playback Simulation Timer
  useEffect(() => {
    let playTimer: any;
    if (isPlayingAudio) {
      playTimer = setInterval(() => {
        setAudioPlayTime((prev) => {
          if (prev >= 195) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(playTimer);
  }, [isPlayingAudio]);

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
            setIsFavorite(Boolean(localDraft.isFavorite));
            setSelectedTags(localDraft.tags || []);
            if (localDraft.audioNotes) setAudioNotes(localDraft.audioNotes);
            if (localDraft.photos) setPhotos(localDraft.photos);

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
          if (found.audioNotes && found.audioNotes.length > 0) setAudioNotes(found.audioNotes);
          if (found.photos && found.photos.length > 0) setPhotos(found.photos);

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
        // Fallback to offline defaults
      } finally {
        if (!cancelled) setLoading(false);
      }

      // 3. Load Calendar Events Context for currentDate (Phase 8)
      try {
        const events = await api.getCalendarEvents(currentDate);
        if (!cancelled) setCalendarEvents(events);
      } catch {
        // Disconnected or offline calendar
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, [currentDate]);

  // Handle Photo Attachment
  const handleAddPicture = () => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              const newPhoto: PhotoAttachment = {
                id: `photo_${Date.now()}`,
                url: result,
                filename: file.name,
                caption: file.name.replace(/\.[^/.]+$/, ""),
                sizeBytes: file.size,
                mimeType: file.type || "image/jpeg",
                createdAt: new Date().toISOString(),
              };
              setPhotos((prev) => [newPhoto, ...prev]);
              setSaveStatus("draft");
            }
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      const samplePhoto: PhotoAttachment = {
        id: `photo_${Date.now()}`,
        url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80",
        filename: "Visual Capture",
        caption: "Studio focus corner",
        sizeBytes: 520000,
        mimeType: "image/jpeg",
        createdAt: new Date().toISOString(),
      };
      setPhotos((prev) => [samplePhoto, ...prev]);
      setSaveStatus("draft");
    }
  };

  const handleRemovePicture = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setSaveStatus("draft");
  };

  // Audio Recording Controls
  const handleToggleRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordSeconds(0);
    } else {
      setIsRecording(false);
    }
  };

  const handleSaveRecording = () => {
    setIsRecording(false);
    const newMemo: AudioNoteAttachment = {
      id: `memo_${Date.now()}`,
      url: `memo_${Date.now()}.m4a`,
      durationSeconds: recordSeconds || 54,
      mimeType: "audio/m4a",
      waveform: [20, 40, 60, 30, 80, 50, 95, 70, 35, 60, 85, 45, 65, 30, 75],
      createdAt: new Date().toISOString(),
    };
    setAudioNotes((prev) => [newMemo, ...prev]);
    setRecordSeconds(0);
    setSaveStatus("draft");
    setStatusMessage("Raw audio note saved (strictly zero transcription).");
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleTogglePlayAudio = () => {
    setIsPlayingAudio((p) => !p);
  };

  const cyclePlaybackRate = () => {
    const rates = ["1.0x", "1.2x", "1.5x", "2.0x"];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    setPlaybackRate(rates[nextIdx]);
  };

  // Save / Sync Entry
  const handleSave = async () => {
    setSaveStatus("saving");
    setStatusMessage(null);

    const sections = [
      highlights.trim() ? { sectionType: "highlights", content: highlights.trim(), sortOrder: 0 } : null,
      gratitude.trim() ? { sectionType: "gratitude", content: gratitude.trim(), sortOrder: 1 } : null,
      learned.trim() ? { sectionType: "learned", content: learned.trim(), sortOrder: 2 } : null,
      tomorrow.trim() ? { sectionType: "tomorrow", content: tomorrow.trim(), sortOrder: 3 } : null,
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
      audioNotes,
      photos,
    };

    await syncManager.saveLocalDraft(currentDate, draftData);

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
          audioNotes,
          photos,
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
          audioNotes,
          photos,
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
        setSaveStatus("draft");
        setStatusMessage("Saved locally (offline). Will sync when online.");
      }
    }
  };

  // Conflict Resolution
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
      setStatusMessage("Failed to resolve conflict.");
    } finally {
      setLoading(false);
    }
  };

  // AI Prompt Guidance
  const handleAiReflection = async () => {
    setAiLoading(true);
    try {
      const res = await api.getAiReflection({
        promptType: "reflection",
        mood: mood ?? undefined,
        tags: selectedTags,
        entryContext: body || highlights || undefined,
      });
      setAiPrompt(res.prompt);
    } catch {
      setAiPrompt("What is the single most meaningful conversation or moment from your day so far?");
    } finally {
      setAiLoading(false);
    }
  };

  const toggleTag = (normalized: string) => {
    setSelectedTags((prev) =>
      prev.includes(normalized)
        ? prev.filter((t) => t !== normalized)
        : [...prev, normalized]
    );
    setSaveStatus("draft");
  };

  const handleAddCustomTag = () => {
    if (!newTagInput.trim()) return;
    const tag = newTagInput.trim().toLowerCase();
    if (!selectedTags.includes(tag)) {
      setSelectedTags((prev) => [...prev, tag]);
    }
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
            <Pressable style={styles.syncNowButton} onPress={() => syncManager.flushQueue()}>
              <Text style={styles.syncNowButtonText}>Sync Now</Text>
            </Pressable>
          </View>
        )}

        {/* Temporal Live Log Header & Session Bar (Stitch Reference) */}
        <View style={styles.temporalHeader}>
          <View style={styles.liveLogPill}>
            <View style={styles.liveLogDot} />
            <Text style={styles.liveLogText}>LIVE LOG</Text>
          </View>
          <View style={styles.sessionCounterRow}>
            <Text style={styles.sessionLabel}>SESSION</Text>
            <Text style={styles.sessionValue}>#0842</Text>
          </View>
        </View>

        {/* Stitch Segmented Date Navigator */}
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
            <Text style={styles.dateDisplayText}>{formatDisplayDate(currentDate)}</Text>
            {currentDate === getTodayString() && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>TODAY</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.navArrowBtn}
            onPress={() => setCurrentDate((d) => shiftDateString(d, 1))}
          >
            <Ionicons name="chevron-forward" size={18} color={THEME.colors.textPrimary} />
          </Pressable>
        </View>

        {/* Mode Switcher: Type Reflection vs. Record Note (Stitch Dual-Mode) */}
        <View style={styles.modeSwitcherContainer}>
          <Pressable
            style={[styles.modeButton, entryMode === "type" && styles.modeButtonActive]}
            onPress={() => setEntryMode("type")}
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={entryMode === "type" ? THEME.colors.accent : THEME.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.modeButtonText, entryMode === "type" && styles.modeButtonTextActive]}>
              Type Reflection
            </Text>
          </Pressable>

          <Pressable
            style={[styles.modeButton, entryMode === "record" && styles.modeButtonActive]}
            onPress={() => setEntryMode("record")}
          >
            <Ionicons
              name="mic-outline"
              size={15}
              color={entryMode === "record" ? THEME.colors.accent : THEME.colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.modeButtonText, entryMode === "record" && styles.modeButtonTextActive]}>
              Record Note
            </Text>
          </Pressable>
        </View>

        {/* Top Meta & Save Status */}
        <View style={styles.headerBar}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerEyebrow}>AURA CYCLE 14 • WEEK 47</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.favoriteButton}
              onPress={() => {
                setIsFavorite((f) => !f);
                setSaveStatus("draft");
              }}
            >
              <Ionicons
                name={isFavorite ? "star" : "star-outline"}
                size={18}
                color={isFavorite ? THEME.colors.amber : THEME.colors.textSecondary}
              />
            </Pressable>
            <View style={[styles.statusBadge, saveStatus === "synced" && styles.statusBadgeSynced]}>
              <Text style={styles.statusBadgeText}>
                {saveStatus === "synced" ? "Synced" : "Draft"}
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
            {/* RECORD MODE: Live Note Capture Studio & Raw Acoustic Player */}
            {entryMode === "record" && (
              <View style={styles.recordModeContainer}>
                {/* Live Capture Card */}
                <View style={styles.liveCaptureCard}>
                  <View style={styles.liveCaptureHeader}>
                    <View style={styles.recordingLedRow}>
                      <View style={[styles.recordingLed, isRecording && styles.recordingLedActive]} />
                      <Text style={styles.recordingLedLabel}>
                        {isRecording ? "LIVE AUDIO RECORDING" : "LIVE NOTE CAPTURE"}
                      </Text>
                    </View>
                    <Text style={styles.recordingTimerText}>
                      {String(Math.floor(recordSeconds / 60)).padStart(2, "0")}:
                      {String(recordSeconds % 60).padStart(2, "0")}.0
                    </Text>
                  </View>

                  <View style={styles.recordActionRow}>
                    <Pressable
                      style={[styles.startRecordBtn, isRecording && styles.stopRecordBtn]}
                      onPress={handleToggleRecord}
                    >
                      <Ionicons
                        name={isRecording ? "stop" : "radio-button-on"}
                        size={18}
                        color="#ffffff"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.startRecordBtnText}>
                        {isRecording ? "Stop Capture" : "Start Record"}
                      </Text>
                    </Pressable>

                    {isRecording && (
                      <Pressable style={styles.saveRecordingBtn} onPress={handleSaveRecording}>
                        <Ionicons name="save-outline" size={16} color={THEME.colors.accent} style={{ marginRight: 4 }} />
                        <Text style={styles.saveRecordingBtnText}>SAVE</Text>
                      </Pressable>
                    )}
                  </View>
                </View>

                {/* Raw Acoustic Memo Player */}
                {audioNotes.length > 0 && (
                  <View style={styles.acousticPlayerCard}>
                    <View style={styles.acousticHeaderRow}>
                      <View style={styles.acousticTitleRow}>
                        <View style={styles.audioDot} />
                        <Text style={styles.acousticLabel}>Raw Acoustic Memo</Text>
                      </View>
                      <View style={styles.localAudioPill}>
                        <Ionicons name="lock-closed-outline" size={12} color={THEME.colors.sky} style={{ marginRight: 4 }} />
                        <Text style={styles.localAudioPillText}>Local Audio Only</Text>
                      </View>
                    </View>

                    <Text style={styles.audioTrackTitle}>Morning Reflection Memo</Text>
                    <Text style={styles.audioTrackSub}>Raw direct audio stream • Strictly zero transcription</Text>

                    {/* Soundwave Bars */}
                    <View style={styles.waveformContainer}>
                      {[12, 24, 45, 65, 32, 18, 55, 78, 20, 65, 80, 42, 30, 90, 100, 50, 65, 30, 60, 75].map((val, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.waveBar,
                            { height: Math.max(6, (val / 100) * 38) },
                            idx < (audioPlayTime % 20) && styles.waveBarActive,
                          ]}
                        />
                      ))}
                    </View>

                    {/* Playback Controls */}
                    <View style={styles.playbackControlRow}>
                      <View style={styles.playbackLeft}>
                        <Pressable style={styles.playArrowBtn} onPress={handleTogglePlayAudio}>
                          <Ionicons
                            name={isPlayingAudio ? "pause" : "play"}
                            size={18}
                            color="#0c0d12"
                          />
                        </Pressable>
                        <View style={styles.timerMetaWrap}>
                          <Text style={styles.playTimerText}>
                            {String(Math.floor(audioPlayTime / 60)).padStart(2, "0")}:
                            {String(audioPlayTime % 60).padStart(2, "0")} / 03:15
                          </Text>
                          <Text style={styles.directPcmText}>DIRECT LINEAR PCM</Text>
                        </View>
                      </View>

                      <Pressable style={styles.ratePill} onPress={cyclePlaybackRate}>
                        <Text style={styles.ratePillText}>{playbackRate}</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TYPE MODE: Headline & Main Journal Text */}
            {entryMode === "type" && (
              <>
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
              </>
            )}

            {/* VISUAL CAPTURES: 2-Column Photo Bento Grid (Stitch Feature) */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="images-outline" size={16} color={THEME.colors.accent} />
                  <Text style={styles.sectionHeaderText}>Visual Captures</Text>
                </View>
                <Text style={styles.photoCountText}>{photos.length} Frames Saved</Text>
              </View>

              <View style={styles.photoGrid}>
                {/* Add Picture Button */}
                <Pressable style={styles.addPhotoCard} onPress={handleAddPicture}>
                  <View style={styles.addPhotoIconCircle}>
                    <Ionicons name="camera-outline" size={20} color={THEME.colors.accent} />
                  </View>
                  <Text style={styles.addPhotoText}>+ Add Picture</Text>
                  <Text style={styles.addPhotoSub}>Camera / Vault</Text>
                </Pressable>

                {/* Photo Previews */}
                {photos.map((item, pIdx) => (
                  <Pressable
                    key={item.id}
                    style={styles.photoThumbnailCard}
                    onPress={() => {
                      setLightboxIndex(pIdx);
                      setLightboxVisible(true);
                    }}
                  >
                    <Image source={{ uri: item.url }} style={styles.photoImage} />
                    <Pressable
                      style={styles.removePhotoBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleRemovePicture(item.id);
                      }}
                    >
                      <Ionicons name="close" size={14} color="#ffffff" />
                    </Pressable>
                    <View style={styles.photoCaptionOverlay}>
                      <Text style={styles.photoCaptionTag}>Studio Vault</Text>
                      <Text style={styles.photoCaptionTitle} numberOfLines={1}>
                        {item.caption || item.filename}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sensory Resonance (Mood) & Cognitive Charge (Energy) */}
            <View style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.fieldLabel}>SENSORY RESONANCE</Text>
                <Text style={styles.moodStatusLabel}>LUMINOUS • 09:12 AM</Text>
              </View>
              <MoodSelector
                value={mood}
                onChange={(m) => {
                  setMood(m);
                  setSaveStatus("draft");
                }}
              />

              <View style={[styles.sectionHeaderRow, { marginTop: THEME.spacing.lg }]}>
                <Text style={styles.fieldLabel}>COGNITIVE CHARGE</Text>
                <Text style={styles.energyStatusLabel}>82%</Text>
              </View>
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
                  <Ionicons name="sparkles-outline" size={16} color={THEME.colors.accent} />
                  <Text style={styles.bentoTitle}>Key Chrono Coordinates (Highlights)</Text>
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
                  <Ionicons name="heart-outline" size={16} color={THEME.colors.rose} />
                  <Text style={styles.bentoTitle}>Anchor Gratitude</Text>
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

              {/* Tomorrow */}
              <View style={styles.bentoSection}>
                <View style={styles.bentoHeader}>
                  <Ionicons name="flag-outline" size={16} color={THEME.colors.sky} />
                  <Text style={styles.bentoTitle}>Forward Vector (Tomorrow)</Text>
                </View>
                <TextInput
                  style={styles.bentoInput}
                  placeholder="What is the single forward priority for tomorrow?"
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
              style={[styles.saveButton, saveStatus === "saving" && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={saveStatus === "saving"}
            >
              <Ionicons
                name="checkmark"
                size={18}
                color={THEME.colors.textInverse}
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
      <Modal visible={showConflictModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.conflictCard}>
            <View style={styles.conflictTitleRow}>
              <Ionicons name="alert-circle-outline" size={24} color={THEME.colors.rose} />
              <Text style={styles.conflictTitle}>Sync Conflict Detected</Text>
            </View>
            <Text style={styles.conflictBody}>
              This entry was modified elsewhere since your last sync. Choose how you want to resolve it:
            </Text>
            <View style={styles.conflictActions}>
              <Pressable
                style={styles.conflictBtnServer}
                onPress={() => handleResolveConflict("keep_server")}
              >
                <Text style={styles.conflictBtnServerText}>Keep Server Version</Text>
              </Pressable>
              <Pressable
                style={styles.conflictBtnLocal}
                onPress={() => handleResolveConflict("keep_local")}
              >
                <Text style={styles.conflictBtnLocalText}>Overwrite with My Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lightbox Modal */}
      <PhotoLightboxModal
        visible={lightboxVisible}
        photos={photos}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />
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
    paddingBottom: 60,
    maxWidth: 720,
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
  temporalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  liveLogPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: THEME.colors.accentMuted,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.accentBorder,
  },
  liveLogDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accent,
  },
  liveLogText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.accent,
    letterSpacing: 1.2,
  },
  sessionCounterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionLabel: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
    fontWeight: "500",
  },
  sessionValue: {
    fontSize: 11,
    color: THEME.colors.textPrimary,
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
    gap: 8,
  },
  dateDisplayText: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  todayBadge: {
    backgroundColor: THEME.colors.recordingRose,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.sm,
  },
  todayBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  modeSwitcherContainer: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: 4,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: THEME.radius.sm,
  },
  modeButtonActive: {
    backgroundColor: THEME.colors.surfaceContainerHigh,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.colors.textSecondary,
  },
  modeButtonTextActive: {
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  headerTitleWrap: {
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  favoriteButton: {
    width: 34,
    height: 34,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statusBadgeSynced: {
    backgroundColor: THEME.colors.emeraldMuted,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.emerald,
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
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
  },
  recordModeContainer: {
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  liveCaptureCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12,
  },
  liveCaptureHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recordingLedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  recordingLed: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.recordingRose,
  },
  recordingLedActive: {
    backgroundColor: THEME.colors.recordingRose,
    transform: [{ scale: 1.2 }],
  },
  recordingLedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
  },
  recordingTimerText: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.rose,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  recordActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  startRecordBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.recordingRose,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
  },
  stopRecordBtn: {
    backgroundColor: "#33343c",
  },
  startRecordBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  saveRecordingBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.accentBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: THEME.radius.md,
  },
  saveRecordingBtnText: {
    color: THEME.colors.accent,
    fontSize: 12,
    fontWeight: "800",
  },
  acousticPlayerCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 8,
  },
  acousticHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  acousticTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  audioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accent,
  },
  acousticLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textSecondary,
    letterSpacing: 1,
  },
  localAudioPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.sm,
  },
  localAudioPillText: {
    fontSize: 10,
    color: THEME.colors.sky,
    fontWeight: "600",
  },
  audioTrackTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  audioTrackSub: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  waveBar: {
    width: 3,
    borderRadius: 1.5,
    backgroundColor: THEME.colors.surfaceHover,
  },
  waveBarActive: {
    backgroundColor: THEME.colors.accent,
  },
  playbackControlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  playbackLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  playArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  timerMetaWrap: {
    gap: 1,
  },
  playTimerText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  directPcmText: {
    fontSize: 9,
    color: THEME.colors.textSecondary,
    letterSpacing: 0.8,
  },
  ratePill: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
  },
  ratePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  photoCountText: {
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  addPhotoCard: {
    width: "48%",
    aspectRatio: 4 / 5,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: THEME.colors.borderStrong,
    backgroundColor: THEME.colors.surfaceSubtle,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  addPhotoSub: {
    fontSize: 9,
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
  },
  photoThumbnailCard: {
    width: "48%",
    aspectRatio: 4 / 5,
    borderRadius: THEME.radius.md,
    overflow: "hidden",
    position: "relative",
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoCaptionOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(17, 19, 26, 0.85)",
  },
  photoCaptionTag: {
    fontSize: 8,
    fontWeight: "700",
    color: THEME.colors.accent,
    letterSpacing: 0.8,
  },
  photoCaptionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  moodStatusLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.accent,
  },
  energyStatusLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.accent,
  },
  headlineInput: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    paddingVertical: 4,
  },
  bodyInput: {
    fontSize: 14,
    color: THEME.colors.textPrimary,
    lineHeight: 22,
    minHeight: 120,
  },
  bentoSection: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: 10,
    marginBottom: 8,
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
    color: THEME.colors.textPrimary,
  },
  bentoInput: {
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
  },
  calContextCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: THEME.spacing.md,
  },
  calContextHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  calContextTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.sky,
  },
  calEventsList: {
    gap: 6,
  },
  calEventRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: 8,
    borderRadius: THEME.radius.md,
    gap: 8,
  },
  calEventTimeBadge: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.sm,
  },
  calEventTimeText: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  calEventTitle: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.textPrimary,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  addTagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  addTagInput: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.md,
    color: THEME.colors.textPrimary,
    fontSize: 12,
  },
  addTagButton: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  addTagButtonText: {
    fontSize: 12,
    color: THEME.colors.accent,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.accent,
    paddingVertical: 14,
    borderRadius: THEME.radius.md,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.textInverse,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.lg,
  },
  conflictCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    maxWidth: 480,
    width: "100%",
  },
  conflictTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  conflictTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  conflictBody: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  conflictActions: {
    gap: 8,
  },
  conflictBtnServer: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: "center",
  },
  conflictBtnServerText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  conflictBtnLocal: {
    backgroundColor: THEME.colors.roseMuted,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  conflictBtnLocalText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.rose,
  },
});
