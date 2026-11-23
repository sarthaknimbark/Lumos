import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "../../src/api/client";
import { ALL_TAGS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { THEME, THEME_MOODS } from "../../src/theme";
import { JournalEntryResponse, PhotoAttachment } from "@myday/contracts";
import { PhotoLightboxModal } from "../../src/components/PhotoLightboxModal";

type FilterChip = "all" | "voice" | "photos" | "favorites" | "mood4" | "tags";
type ViewMode = "list" | "grid";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState<FilterChip>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [results, setResults] = useState<JournalEntryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Lightbox State
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxPhotos, setLightboxPhotos] = useState<PhotoAttachment[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getEntries({
          q: searchQuery.trim() || undefined,
          tag: selectedTag || undefined,
          isFavorite: activeChip === "favorites" ? true : undefined,
          mood: activeChip === "mood4" ? 4 : undefined,
          limit: 40,
        });
        if (!cancelled) {
          let list = res.data;
          if (activeChip === "voice") {
            list = list.filter((e) => e.audioNotes && e.audioNotes.length > 0);
          } else if (activeChip === "photos") {
            list = list.filter((e) => e.photos && e.photos.length > 0);
          }
          setResults(list);
        }
      } catch {
        // Fallback over mock data
        if (!cancelled) {
          let list = PAST_ENTRIES_MOCK.map((m) => ({
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

          if (selectedTag) {
            list = list.filter((e) =>
              e.tags.map((t) => t.toLowerCase()).includes(selectedTag.toLowerCase())
            );
          }
          if (activeChip === "favorites") {
            list = list.filter((e) => e.isFavorite);
          }
          if (activeChip === "mood4") {
            list = list.filter((e) => (e.mood ?? 0) >= 4);
          }
          if (activeChip === "voice") {
            list = list.filter((e) => e.audioNotes && e.audioNotes.length > 0);
          }
          if (activeChip === "photos") {
            list = list.filter((e) => e.photos && e.photos.length > 0);
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
              (e) =>
                e.title?.toLowerCase().includes(q) ||
                e.body.toLowerCase().includes(q) ||
                e.tags.some((t) => t.toLowerCase().includes(q))
            );
          }
          setResults(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, activeChip, selectedTag]);

  // Counts for filter pills
  const voiceCount = results.filter((e) => e.audioNotes && e.audioNotes.length > 0).length;
  const photoCount = results.filter((e) => e.photos && e.photos.length > 0).length;
  const favCount = results.filter((e) => e.isFavorite).length;
  const mood4Count = results.filter((e) => (e.mood ?? 0) >= 4).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
    >
      {/* Spotlight Search Header */}
      <View style={styles.spotlightSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={THEME.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries, keywords, tags..."
            placeholderTextColor={THEME.colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => setSearchQuery("")}
              hitSlop={8}
            >
              <Text style={styles.escBadge}>ESC</Text>
              <Ionicons name="close" size={14} color={THEME.colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* Quick Search Syntax Tips */}
        <View style={styles.syntaxRow}>
          <View style={styles.syntaxLeft}>
            <Ionicons name="terminal-outline" size={13} color={THEME.colors.textTertiary} />
            <Text style={styles.syntaxText} numberOfLines={1}>
              Syntax tips: <Text style={styles.syntaxCode}>harbour</Text> or <Text style={styles.syntaxCode}>#architecture</Text>
            </Text>
          </View>
          <Text style={styles.indexedText}>{results.length} INDEXED</Text>
        </View>
      </View>

      {/* Horizontal Filter Chips Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterChipsScroll}
        contentContainerStyle={styles.filterChipsRow}
      >
        {/* All */}
        <Pressable
          style={[
            styles.chipPill,
            activeChip === "all" && styles.chipPillActive,
          ]}
          onPress={() => {
            setActiveChip("all");
            setSelectedTag(null);
          }}
        >
          <Ionicons
            name="apps-outline"
            size={14}
            color={activeChip === "all" ? THEME.colors.textInverse : THEME.colors.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              activeChip === "all" && styles.chipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>

        {/* Voice Notes */}
        <Pressable
          style={[
            styles.chipPill,
            activeChip === "voice" && styles.chipPillActive,
          ]}
          onPress={() => setActiveChip(activeChip === "voice" ? "all" : "voice")}
        >
          <Ionicons
            name="mic-outline"
            size={14}
            color={activeChip === "voice" ? THEME.colors.textInverse : THEME.colors.cyan}
          />
          <Text
            style={[
              styles.chipText,
              activeChip === "voice" && styles.chipTextActive,
            ]}
          >
            Voice Notes
          </Text>
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{voiceCount}</Text>
          </View>
        </Pressable>

        {/* Photos */}
        <Pressable
          style={[
            styles.chipPill,
            activeChip === "photos" && styles.chipPillActive,
          ]}
          onPress={() => setActiveChip(activeChip === "photos" ? "all" : "photos")}
        >
          <Ionicons
            name="camera-outline"
            size={14}
            color={activeChip === "photos" ? THEME.colors.textInverse : THEME.colors.accent}
          />
          <Text
            style={[
              styles.chipText,
              activeChip === "photos" && styles.chipTextActive,
            ]}
          >
            Photos
          </Text>
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{photoCount}</Text>
          </View>
        </Pressable>

        {/* Favorites */}
        <Pressable
          style={[
            styles.chipPill,
            activeChip === "favorites" && styles.chipPillActive,
          ]}
          onPress={() => setActiveChip(activeChip === "favorites" ? "all" : "favorites")}
        >
          <Ionicons
            name="star-outline"
            size={14}
            color={activeChip === "favorites" ? THEME.colors.textInverse : THEME.colors.rose}
          />
          <Text
            style={[
              styles.chipText,
              activeChip === "favorites" && styles.chipTextActive,
            ]}
          >
            Favorites
          </Text>
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{favCount}</Text>
          </View>
        </Pressable>

        {/* Mood >= 4 */}
        <Pressable
          style={[
            styles.chipPill,
            activeChip === "mood4" && styles.chipPillActive,
          ]}
          onPress={() => setActiveChip(activeChip === "mood4" ? "all" : "mood4")}
        >
          <Ionicons
            name="sunny-outline"
            size={14}
            color={activeChip === "mood4" ? THEME.colors.textInverse : THEME.colors.amber}
          />
          <Text
            style={[
              styles.chipText,
              activeChip === "mood4" && styles.chipTextActive,
            ]}
          >
            Mood ≥ 4
          </Text>
          <View style={styles.countBubble}>
            <Text style={styles.countBubbleText}>{mood4Count}</Text>
          </View>
        </Pressable>

        {/* Tags */}
        <Pressable
          style={[
            styles.chipPill,
            activeChip === "tags" && styles.chipPillActive,
          ]}
          onPress={() => setActiveChip(activeChip === "tags" ? "all" : "tags")}
        >
          <Ionicons
            name="pricetag-outline"
            size={14}
            color={activeChip === "tags" ? THEME.colors.textInverse : THEME.colors.textTertiary}
          />
          <Text
            style={[
              styles.chipText,
              activeChip === "tags" && styles.chipTextActive,
            ]}
          >
            Tags
          </Text>
        </Pressable>
      </ScrollView>

      {/* Tag Selector Drawer if Tags Chip Active */}
      {activeChip === "tags" && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tagsDrawer}
          contentContainerStyle={styles.tagsDrawerRow}
        >
          {ALL_TAGS.map((tag) => {
            const isSel = selectedTag?.toLowerCase() === tag.toLowerCase();
            return (
              <Pressable
                key={tag}
                style={[styles.tagItemBtn, isSel && styles.tagItemBtnActive]}
                onPress={() => setSelectedTag(isSel ? null : tag)}
              >
                <Text
                  style={[styles.tagItemText, isSel && styles.tagItemTextActive]}
                >
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Layout Controls & Match Stats Row */}
      <View style={styles.telemetryRow}>
        <View style={styles.telemetryTitleGroup}>
          <Text style={styles.telemetrySubLabel}>TELEMETRY MATCH</Text>
          <Text style={styles.telemetryCount}>
            {results.length} Results{" "}
            {searchQuery ? (
              <Text style={styles.queryHighlight}>for '{searchQuery}'</Text>
            ) : null}
          </Text>
        </View>

        {/* 2-Segment Control (List vs Grid) */}
        <View style={styles.viewSegmentBox}>
          <Pressable
            style={[styles.segmentBtn, viewMode === "list" && styles.segmentBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <Ionicons
              name="reorder-four-outline"
              size={17}
              color={viewMode === "list" ? THEME.colors.accent : THEME.colors.textTertiary}
            />
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, viewMode === "grid" && styles.segmentBtnActive]}
            onPress={() => setViewMode("grid")}
          >
            <Ionicons
              name="grid-outline"
              size={16}
              color={viewMode === "grid" ? THEME.colors.accent : THEME.colors.textTertiary}
            />
          </Pressable>
        </View>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={THEME.colors.accent} />
          <Text style={styles.loadingText}>Searching vault records...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={36} color={THEME.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No matching entries</Text>
          <Text style={styles.emptySubtitle}>
            Try searching for terms like "harbour", "OP-1", or filter by Voice Notes.
          </Text>
        </View>
      ) : (
        /* Results Stack */
        <View style={viewMode === "grid" ? styles.gridContainer : styles.listContainer}>
          {results.map((item) => {
            const hasAudio = item.audioNotes && item.audioNotes.length > 0;
            const hasPhotos = item.photos && item.photos.length > 0;
            const isPlaying = playingAudioId === item.id;

            return (
              <View
                key={item.id}
                style={[
                  styles.resultCard,
                  viewMode === "grid" && styles.resultCardGrid,
                ]}
              >
                {/* Result Card Top Row */}
                <View style={styles.resultCardHeader}>
                  <View style={styles.headerLeft}>
                    {hasAudio ? (
                      <Ionicons name="pulse-outline" size={15} color={THEME.colors.cyan} />
                    ) : hasPhotos ? (
                      <Ionicons name="image-outline" size={15} color={THEME.colors.rose} />
                    ) : (
                      <Ionicons name="document-text-outline" size={15} color={THEME.colors.accent} />
                    )}
                    <Text style={styles.dateLabel}>
                      {new Date(item.entryDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })} • {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>

                  {hasAudio && (
                    <View style={styles.audioMemoBadge}>
                      <Ionicons name="mic" size={10} color={THEME.colors.cyan} />
                      <Text style={styles.audioMemoBadgeText}>
                        AUDIO MEMO • {item.audioNotes![0].durationSeconds ? `0${Math.floor(item.audioNotes![0].durationSeconds / 60)}:${(item.audioNotes![0].durationSeconds % 60).toString().padStart(2, "0")}` : "01:42"}
                      </Text>
                    </View>
                  )}
                  {!hasAudio && hasPhotos && (
                    <View style={styles.photoAttachmentBadge}>
                      <Ionicons name="attach" size={11} color={THEME.colors.textSecondary} />
                      <Text style={styles.photoAttachmentBadgeText}>PHOTO ATTACHMENT</Text>
                    </View>
                  )}
                </View>

                {/* Body or Photo + Body Combo */}
                {hasPhotos && viewMode === "list" ? (
                  <View style={styles.photoExcerptCombo}>
                    <Pressable
                      style={styles.comboThumbBox}
                      onPress={() => {
                        setLightboxPhotos(item.photos!);
                        setLightboxIndex(0);
                        setLightboxVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: item.photos![0].url }}
                        style={styles.comboThumbImage}
                        resizeMode="cover"
                      />
                      <View style={styles.rawPill}>
                        <Text style={styles.rawPillText}>RAW</Text>
                      </View>
                    </Pressable>
                    <View style={styles.comboRight}>
                      {item.title ? (
                        <Text style={styles.comboTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                      ) : null}
                      <Text style={styles.comboBodyText} numberOfLines={2}>
                        {item.body}
                      </Text>
                      <View style={styles.comboTelemetryRow}>
                        <Text style={styles.comboMetaChip}>SENSORY: DUSK</Text>
                        <Text style={styles.comboDot}>•</Text>
                        <Text style={styles.comboMetaChip}>ISO 800</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.cardContentBox}>
                    {item.title ? (
                      <Text style={styles.cardTitle}>{item.title}</Text>
                    ) : null}
                    <Text style={styles.cardBody} numberOfLines={3}>
                      {item.body}
                    </Text>
                  </View>
                )}

                {/* Spectral Cadence Waveform Visualizer for Audio Hits */}
                {hasAudio && (
                  <View style={styles.spectralContainer}>
                    <View style={styles.spectralHeader}>
                      <Text style={styles.spectralTitle}>SPECTRAL CADENCE</Text>
                      <Pressable
                        style={styles.playInlineBtn}
                        onPress={() =>
                          setPlayingAudioId(isPlaying ? null : item.id)
                        }
                      >
                        <Ionicons
                          name={isPlaying ? "pause" : "play"}
                          size={12}
                          color={THEME.colors.cyan}
                        />
                        <Text style={styles.spectralTime}>
                          {isPlaying ? "00:48 / 01:42" : "01:42"}
                        </Text>
                      </Pressable>
                    </View>
                    <View style={styles.spectralBarsTrack}>
                      {[35, 60, 90, 40, 75, 100, 85, 45, 30, 65, 80, 95, 50, 30, 70, 45, 60, 25, 40, 20].map(
                        (h, barIdx) => (
                          <View
                            key={barIdx}
                            style={[
                              styles.spectralBar,
                              {
                                height: isPlaying ? ((barIdx % 4 + 1) * 6) : (h * 0.22),
                                backgroundColor:
                                  barIdx < 12
                                    ? THEME.colors.cyan
                                    : THEME.colors.surfaceVariant,
                              },
                            ]}
                          />
                        )
                      )}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Discovered Taxonomies Section */}
      <View style={styles.taxonomiesSection}>
        <View style={styles.taxonomiesHeader}>
          <Text style={styles.taxonomiesTitle}>DISCOVERED TAXONOMIES</Text>
          <Text style={styles.taxonomiesCount}>2 TAG MATCHES</Text>
        </View>
        <View style={styles.taxonomiesGrid}>
          <Pressable
            style={styles.taxonomyCard}
            onPress={() => {
              setActiveChip("tags");
              setSelectedTag("harbour");
            }}
          >
            <View style={styles.taxonomyTop}>
              <View style={styles.taxonomyTagLabel}>
                <Ionicons name="pricetag-outline" size={14} color={THEME.colors.accent} />
                <Text style={styles.taxonomyTagName}>#harbour</Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={THEME.colors.textTertiary} />
            </View>
            <Text style={styles.taxonomyEntriesCount}>2 indexed entries</Text>
          </Pressable>

          <Pressable
            style={styles.taxonomyCard}
            onPress={() => {
              setActiveChip("tags");
              setSelectedTag("architecture");
            }}
          >
            <View style={styles.taxonomyTop}>
              <View style={styles.taxonomyTagLabel}>
                <Ionicons name="pricetag-outline" size={14} color={THEME.colors.cyan} />
                <Text style={[styles.taxonomyTagName, { color: THEME.colors.cyan }]}>
                  #architecture
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={14} color={THEME.colors.textTertiary} />
            </View>
            <Text style={styles.taxonomyEntriesCount}>3 indexed entries</Text>
          </Pressable>
        </View>
      </View>

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
  spotlightSection: {
    gap: 8,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderRadius: THEME.radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: THEME.typography.body,
    fontSize: 14,
    color: THEME.colors.textPrimary,
    marginLeft: 8,
    padding: 0,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME.colors.surfaceContainerHighest,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
  },
  escBadge: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
    letterSpacing: 0.8,
  },
  syntaxRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  syntaxLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  syntaxText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    color: THEME.colors.textTertiary,
  },
  syntaxCode: {
    color: THEME.colors.textSecondary,
    fontWeight: "600",
  },
  indexedText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.accent,
    fontWeight: "600",
  },
  filterChipsScroll: {
    marginBottom: 12,
  },
  filterChipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  chipPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  chipPillActive: {
    backgroundColor: THEME.colors.accent,
    borderColor: THEME.colors.accent,
  },
  chipText: {
    fontFamily: THEME.typography.body,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  chipTextActive: {
    color: THEME.colors.textInverse,
    fontWeight: "600",
  },
  countBubble: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surfaceContainerHighest,
  },
  countBubbleText: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  tagsDrawer: {
    marginBottom: 12,
  },
  tagsDrawerRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 2,
  },
  tagItemBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  tagItemBtnActive: {
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderColor: THEME.colors.accent,
  },
  tagItemText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  tagItemTextActive: {
    color: THEME.colors.accent,
    fontWeight: "600",
  },
  telemetryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  telemetryTitleGroup: {
    gap: 2,
  },
  telemetrySubLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  telemetryCount: {
    fontFamily: THEME.typography.title,
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  queryHighlight: {
    color: THEME.colors.accent,
    fontFamily: THEME.typography.mono,
  },
  viewSegmentBox: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surfaceContainerLowest,
    padding: 2,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  segmentBtn: {
    width: 32,
    height: 28,
    borderRadius: THEME.radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: {
    backgroundColor: THEME.colors.surfaceContainerHigh,
  },
  centerBox: {
    paddingVertical: 40,
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
    paddingVertical: 40,
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
    maxWidth: 260,
  },
  listContainer: {
    gap: 12,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  resultCard: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 10,
  },
  resultCardGrid: {
    width: "48%",
  },
  resultCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  audioMemoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.cyanMuted,
  },
  audioMemoBadgeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.cyan,
  },
  photoAttachmentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHighest,
  },
  photoAttachmentBadgeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  photoExcerptCombo: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  comboThumbBox: {
    width: 80,
    height: 80,
    borderRadius: THEME.radius.md,
    overflow: "hidden",
    backgroundColor: THEME.colors.surfaceContainerLowest,
    position: "relative",
  },
  comboThumbImage: {
    width: "100%",
    height: "100%",
  },
  rawPill: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: "rgba(17, 19, 26, 0.8)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  rawPillText: {
    fontFamily: THEME.typography.mono,
    fontSize: 8,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  comboRight: {
    flex: 1,
    gap: 4,
  },
  comboTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  comboBodyText: {
    fontFamily: THEME.typography.body,
    fontSize: 12,
    color: THEME.colors.textSecondary,
    lineHeight: 17,
  },
  comboTelemetryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  comboMetaChip: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
  },
  comboDot: {
    color: THEME.colors.textTertiary,
    fontSize: 8,
  },
  cardContentBox: {
    gap: 4,
  },
  cardTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  cardBody: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  spectralContainer: {
    backgroundColor: THEME.colors.surfaceContainerLowest,
    borderRadius: THEME.radius.md,
    padding: 10,
    gap: 8,
  },
  spectralHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spectralTitle: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  playInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  spectralTime: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.cyan,
  },
  spectralBarsTrack: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 24,
  },
  spectralBar: {
    flex: 1,
    borderRadius: 1,
  },
  taxonomiesSection: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: THEME.radius.xl,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12,
  },
  taxonomiesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taxonomiesTitle: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  taxonomiesCount: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  taxonomiesGrid: {
    flexDirection: "row",
    gap: 10,
  },
  taxonomyCard: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 4,
  },
  taxonomyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  taxonomyTagLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  taxonomyTagName: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.accent,
  },
  taxonomyEntriesCount: {
    fontFamily: THEME.typography.body,
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
});
