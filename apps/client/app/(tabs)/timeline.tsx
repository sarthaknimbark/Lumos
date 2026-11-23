import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "../../src/api/client";
import { PAST_ENTRIES_MOCK } from "../../src/mockData";
import { THEME, THEME_MOODS } from "../../src/theme";
import { JournalEntryResponse, PhotoAttachment } from "@myday/contracts";
import { PhotoLightboxModal } from "../../src/components/PhotoLightboxModal";

type FilterTab = "all" | "voice" | "photo";

export default function TimelineScreen() {
  const [entries, setEntries] = useState<JournalEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Lightbox State
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoAttachment[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const loadEntries = async () => {
    try {
      const res = await api.getEntries({ limit: 50 });
      setEntries(res.data);
    } catch {
      // Offline fallback: use mock data
      const fallback = PAST_ENTRIES_MOCK.map((m) => ({
        id: m.id,
        userId: "00000000-0000-0000-0000-000000000001",
        entryDate: m.entryDate,
        title: m.title,
        body: m.body,
        mood: m.mood,
        energy: m.energy,
        status: "published" as const,
        isFavorite: m.isFavorite,
        revision: 1,
        sections: m.sections.map((s, i) => ({
          id: s.id,
          sectionType: s.sectionType as any,
          content: s.content,
          sortOrder: i,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        tags: m.tags,
        audioNotes: m.audioNotes || [],
        photos: m.photos || [],
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      }));
      setEntries(fallback);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const toggleFavorite = async (entry: JournalEntryResponse) => {
    const nextVal = !entry.isFavorite;
    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => (e.id === entry.id ? { ...e, isFavorite: nextVal } : e))
    );
    try {
      await api.updateEntry(entry.id, {
        isFavorite: nextVal,
        baseRevision: entry.revision,
      });
    } catch {
      // Ignore offline rollback in demo mode
    }
  };

  // Filter entries
  const filteredEntries = entries.filter((e) => {
    if (activeFilter === "voice") {
      return (e.audioNotes && e.audioNotes.length > 0);
    }
    if (activeFilter === "photo") {
      return (e.photos && e.photos.length > 0);
    }
    return true;
  });

  // Generate 7-day weekly scrubber track
  const daysTrack = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayLabel = ["S", "M", "T", "W", "T", "F", "S"][d.getDay()];
    const dateNum = d.getDate();
    const isToday = i === 6;
    const isSelected = selectedDayOffset === 6 - i;
    return { offset: 6 - i, dayLabel, dateNum, isToday, isSelected };
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={THEME.colors.accent}
        />
      }
    >
      {/* Top Utility Sub-Header & Telemetry */}
      <View style={styles.topTelemetryRow}>
        <View style={styles.telemetryLeft}>
          <View style={styles.indexBadge}>
            <View style={styles.cyanGlowDot} />
            <Text style={styles.indexBadgeText}>INDEX 04</Text>
          </View>
          <Text style={styles.monthLabel}>
            {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()}
          </Text>
        </View>

        {/* 32 Day Streak Badge */}
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={14} color={THEME.colors.rose} />
          <Text style={styles.streakText}>32D STREAK</Text>
        </View>
      </View>

      {/* Horizontal Weekly Scrubber Track */}
      <View style={styles.scrubberSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrubberRow}
        >
          {daysTrack.map((item) => (
            <Pressable
              key={item.offset}
              style={[
                styles.dayButton,
                item.isSelected && styles.dayButtonSelected,
              ]}
              onPress={() => setSelectedDayOffset(item.offset)}
            >
              <Text
                style={[
                  styles.dayLetter,
                  item.isSelected && styles.dayLetterSelected,
                ]}
              >
                {item.dayLabel}
              </Text>
              <Text
                style={[
                  styles.dayNumber,
                  item.isSelected && styles.dayNumberSelected,
                ]}
              >
                {item.dateNum}
              </Text>
              <View style={styles.dotIndicatorRow}>
                <View
                  style={[
                    styles.subDot,
                    {
                      backgroundColor: item.isSelected
                        ? THEME.colors.textInverse
                        : item.offset === 0
                        ? THEME.colors.accent
                        : THEME.colors.cyan,
                    },
                  ]}
                />
                {item.offset % 2 === 0 && (
                  <View
                    style={[
                      styles.subDot,
                      {
                        backgroundColor: item.isSelected
                          ? THEME.colors.cyan
                          : THEME.colors.rose,
                      },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Filter & Segmented View Track */}
      <View style={styles.segmentedFilterTrack}>
        <Pressable
          style={[
            styles.filterSegmentBtn,
            activeFilter === "all" && styles.filterSegmentBtnActive,
          ]}
          onPress={() => setActiveFilter("all")}
        >
          <Text
            style={[
              styles.filterSegmentText,
              activeFilter === "all" && styles.filterSegmentTextActive,
            ]}
          >
            ALL ENTRIES
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterSegmentBtn,
            activeFilter === "voice" && styles.filterSegmentBtnActive,
          ]}
          onPress={() => setActiveFilter("voice")}
        >
          <Text
            style={[
              styles.filterSegmentText,
              activeFilter === "voice" && styles.filterSegmentTextActive,
            ]}
          >
            VOICE MEMOS
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.filterSegmentBtn,
            activeFilter === "photo" && styles.filterSegmentBtnActive,
          ]}
          onPress={() => setActiveFilter("photo")}
        >
          <Text
            style={[
              styles.filterSegmentText,
              activeFilter === "photo" && styles.filterSegmentTextActive,
            ]}
          >
            PHOTO STORIES
          </Text>
        </Pressable>
      </View>

      {/* Feed Header Stream Legend */}
      <View style={styles.feedHeaderRow}>
        <Text style={styles.feedLegendLabel}>CHRONOLOGY // ACTIVE LOG</Text>
        <Text style={styles.feedCountLabel}>
          {filteredEntries.length} {filteredEntries.length === 1 ? "MEMORY" : "RECENT MEMORIES"}
        </Text>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={THEME.colors.accent} />
          <Text style={styles.loadingText}>Synchronizing timeline vault...</Text>
        </View>
      ) : filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="journal-outline" size={36} color={THEME.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No archival records</Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === "voice"
              ? "No acoustic voice recordings found."
              : activeFilter === "photo"
              ? "No photographic memories captured yet."
              : "Capture your first reflection in the Today tab!"}
          </Text>
        </View>
      ) : (
        /* Feed Cards Stream */
        <View style={styles.feedList}>
          {filteredEntries.map((item) => {
            const moodDef = THEME_MOODS.find((m) => m.level === item.mood);
            const hasAudio = item.audioNotes && item.audioNotes.length > 0;
            const hasPhotos = item.photos && item.photos.length > 0;
            const isPlaying = playingAudioId === item.id;

            return (
              <View key={item.id} style={styles.card}>
                {/* Card Meta Top Row */}
                <View style={styles.cardMetaRow}>
                  <View style={styles.metaLeftGroup}>
                    {moodDef && (
                      <View style={styles.moodChip}>
                        <Ionicons
                          name={moodDef.iconFilled}
                          size={14}
                          color={moodDef.accentColor}
                        />
                        <Text
                          style={[
                            styles.moodChipText,
                            { color: moodDef.accentColor },
                          ]}
                        >
                          {moodDef.label.toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.cardDateText}>
                      {new Date(item.entryDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      }).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.metaRightGroup}>
                    <Text style={styles.timeText}>
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    <Pressable
                      style={styles.starBtn}
                      onPress={() => toggleFavorite(item)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={item.isFavorite ? "star" : "star-outline"}
                        size={17}
                        color={item.isFavorite ? THEME.colors.accent : THEME.colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Title & Body Text */}
                <View style={styles.cardBodySection}>
                  {item.title ? (
                    <Text style={styles.cardTitle}>{item.title}</Text>
                  ) : null}
                  <Text style={styles.cardBodyText} numberOfLines={3}>
                    {item.body}
                  </Text>
                </View>

                {/* Audio Acoustic Bar Module */}
                {hasAudio && (
                  <View style={styles.audioAcousticModule}>
                    <View style={styles.audioLeftInfo}>
                      <Pressable
                        style={[
                          styles.audioPlayCircle,
                          isPlaying && styles.audioPlayCircleActive,
                        ]}
                        onPress={() =>
                          setPlayingAudioId(isPlaying ? null : item.id)
                        }
                      >
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={16}
                          color={isPlaying ? THEME.colors.textInverse : THEME.colors.cyan}
                        />
                      </Pressable>
                      <View style={styles.audioLabelGroup}>
                        <Text style={styles.audioSubLabel}>VOICE CAPTURE</Text>
                        <Text style={styles.audioDurationText}>
                          {item.audioNotes![0].durationSeconds
                            ? `0${Math.floor(item.audioNotes![0].durationSeconds / 60)}:${(item.audioNotes![0].durationSeconds % 60).toString().padStart(2, "0")}`
                            : "01:42"}
                        </Text>
                      </View>
                    </View>

                    {/* Machined Sound-Wave Graphic (Acoustic Sky) */}
                    <View style={styles.waveformGraphic}>
                      {[8, 12, 20, 14, 18, 24, 20, 10, 16, 22, 12, 8, 4].map(
                        (h, idx) => (
                          <View
                            key={idx}
                            style={[
                              styles.soundBar,
                              {
                                height: isPlaying ? ((idx % 3 + 1) * 7) : h,
                                backgroundColor:
                                  idx < 9
                                    ? THEME.colors.cyan
                                    : THEME.colors.border,
                              },
                            ]}
                          />
                        )
                      )}
                    </View>
                  </View>
                )}

                {/* Photo Previews Bento */}
                {hasPhotos && (
                  <View style={styles.photoGridPreview}>
                    {item.photos!.slice(0, 2).map((photo, pIdx) => (
                      <Pressable
                        key={photo.id || pIdx}
                        style={styles.photoThumbItem}
                        onPress={() => {
                          setLightboxPhotos(item.photos!);
                          setLightboxIndex(pIdx);
                          setLightboxVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri: photo.url }}
                          style={styles.photoThumbImage}
                          resizeMode="cover"
                        />
                        <View style={styles.photoTagOverlay}>
                          <Text style={styles.photoTagText} numberOfLines={1}>
                            {photo.caption
                              ? photo.caption.slice(0, 14).toUpperCase()
                              : `FRAME_0${pIdx + 1}`}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Lightbox Modal */}
      <PhotoLightboxModal
        visible={lightboxVisible}
        photos={lightboxPhotos}
        initialIndex={lightboxIndex}
        onClose={() => setLightboxVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    paddingHorizontal: THEME.spacing.gutter,
    paddingTop: 12,
    paddingBottom: 48,
  },
  topTelemetryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  telemetryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  indexBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cyanGlowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.cyan,
  },
  indexBadgeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.cyan,
    letterSpacing: 0.8,
  },
  monthLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    letterSpacing: 0.5,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  streakText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.rose,
    letterSpacing: 0.5,
  },
  scrubberSection: {
    marginBottom: 16,
  },
  scrubberRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  dayButton: {
    width: 44,
    height: 64,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  dayButtonSelected: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
    transform: [{ translateY: -2 }],
  },
  dayLetter: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
  },
  dayLetterSelected: {
    color: THEME.colors.textInverse,
    opacity: 0.9,
  },
  dayNumber: {
    fontFamily: THEME.typography.title,
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  dayNumberSelected: {
    color: THEME.colors.textInverse,
  },
  dotIndicatorRow: {
    flexDirection: "row",
    gap: 3,
    height: 4,
    alignItems: "center",
  },
  subDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  segmentedFilterTrack: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surfaceContainerLowest,
    padding: 3,
    borderRadius: THEME.radius.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 4,
  },
  filterSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: THEME.radius.sm,
  },
  filterSegmentBtnActive: {
    backgroundColor: THEME.colors.surfaceContainerHigh,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  filterSegmentText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  filterSegmentTextActive: {
    color: THEME.colors.textPrimary,
  },
  feedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  feedLegendLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  feedCountLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  centerBox: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textTertiary,
    marginTop: 4,
    textAlign: "center",
    maxWidth: 240,
  },
  feedList: {
    gap: 14,
  },
  card: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12,
  },
  cardMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHighest,
  },
  moodChipText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardDateText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  metaRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
  starBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceContainerHigh,
  },
  cardBodySection: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
    letterSpacing: -0.2,
  },
  cardBodyText: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 19,
  },
  audioAcousticModule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  audioLeftInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  audioPlayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceContainerHighest,
    alignItems: "center",
    justifyContent: "center",
  },
  audioPlayCircleActive: {
    backgroundColor: THEME.colors.cyan,
  },
  audioLabelGroup: {
    gap: 1,
  },
  audioSubLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  audioDurationText: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  waveformGraphic: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2.5,
    height: 24,
    paddingHorizontal: 4,
  },
  soundBar: {
    width: 2.5,
    borderRadius: 1,
  },
  photoGridPreview: {
    flexDirection: "row",
    gap: 10,
  },
  photoThumbItem: {
    flex: 1,
    height: 100,
    borderRadius: THEME.radius.lg,
    overflow: "hidden",
    backgroundColor: THEME.colors.surfaceContainerLowest,
    position: "relative",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  photoThumbImage: {
    width: "100%",
    height: "100%",
  },
  photoTagOverlay: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
    backgroundColor: "rgba(17, 19, 26, 0.85)",
  },
  photoTagText: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
    letterSpacing: 0.5,
  },
});
