import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { JournalEntryResponse } from "@myday/contracts";

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

export default function TimelineScreen() {
  const [entries, setEntries] = useState<JournalEntryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const loadEntries = async () => {
    try {
      const res = await api.getEntries({
        isFavorite: onlyFavorites ? true : undefined,
        limit: 50,
      });
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
        audioNotes: [],
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setEntries(onlyFavorites ? fallback.filter((e) => e.isFavorite) : fallback);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadEntries();
  }, [onlyFavorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

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
      {/* Top Filter Bar */}
      <View style={styles.filterRow}>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {entries.length} {entries.length === 1 ? "MEMORY" : "MEMORIES"}
          </Text>
        </View>

        <Pressable
          style={[
            styles.favoriteFilterPill,
            onlyFavorites && styles.favoriteFilterPillActive,
          ]}
          onPress={() => setOnlyFavorites((p) => !p)}
        >
          <Ionicons
            name={onlyFavorites ? "heart" : "heart-outline"}
            size={14}
            color={onlyFavorites ? THEME.colors.rose : THEME.colors.textSecondary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.favoriteFilterText,
              onlyFavorites && styles.favoriteFilterTextActive,
            ]}
          >
            Favorites
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.colors.accent} />
          <Text style={styles.loadingText}>Loading timeline...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="journal-outline" size={38} color={THEME.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No memories found</Text>
          <Text style={styles.emptySubtitle}>
            {onlyFavorites
              ? "No favorite entries yet. Star an entry to save it here."
              : "Capture your first reflection in the Today tab!"}
          </Text>
        </View>
      ) : (
        entries.map((item) => {
          const moodDef = THEME_MOODS.find((m) => m.level === item.mood);
          const isExpanded = selectedEntryId === item.id;

          return (
            <Pressable
              key={item.id}
              style={[styles.card, isExpanded && styles.cardExpanded]}
              onPress={() => setSelectedEntryId(isExpanded ? null : item.id)}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.dateLabel}>{formatDisplayDate(item.entryDate)}</Text>
                  {item.title ? (
                    <Text style={styles.titleText}>{item.title}</Text>
                  ) : null}
                </View>

                <View style={styles.badgeRow}>
                  {item.isFavorite && (
                    <Ionicons
                      name="heart"
                      size={16}
                      color={THEME.colors.rose}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  {moodDef && (
                    <View
                      style={[
                        styles.moodBadge,
                        { borderColor: moodDef.accentColor, backgroundColor: THEME.colors.surfaceSubtle },
                      ]}
                    >
                      <Ionicons
                        name={moodDef.iconFilled}
                        size={13}
                        color={moodDef.accentColor}
                      />
                      <Text style={[styles.moodLabel, { color: moodDef.accentColor }]}>
                        {moodDef.label}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Text
                style={styles.snippetText}
                numberOfLines={isExpanded ? undefined : 3}
              >
                {item.body}
              </Text>

              {/* Reflection Sections (shown when expanded) */}
              {isExpanded && item.sections.length > 0 && (
                <View style={styles.expandedSections}>
                  {item.sections.map((sec) => (
                    <View key={sec.id} style={styles.sectionRow}>
                      <View style={styles.sectionHeaderLine}>
                        <Ionicons
                          name={
                            sec.sectionType === "highlights"
                              ? "ribbon-outline"
                              : sec.sectionType === "gratitude"
                              ? "gift-outline"
                              : sec.sectionType === "learned"
                              ? "bulb-outline"
                              : "flag-outline"
                          }
                          size={14}
                          color={
                            sec.sectionType === "highlights"
                              ? THEME.colors.amber
                              : sec.sectionType === "gratitude"
                              ? THEME.colors.rose
                              : sec.sectionType === "learned"
                              ? THEME.colors.emerald
                              : THEME.colors.sky
                          }
                        />
                        <Text style={styles.sectionHeading}>
                          {sec.sectionType === "highlights"
                            ? "Highlights"
                            : sec.sectionType === "gratitude"
                            ? "Gratitude"
                            : sec.sectionType === "learned"
                            ? "Lessons"
                            : sec.sectionType === "tomorrow"
                            ? "Tomorrow"
                            : "Section"}
                        </Text>
                      </View>
                      <Text style={styles.sectionContent}>{sec.content}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.tags.map((t) => (
                    <View key={t} style={styles.tagBadge}>
                      <Text style={styles.tagText}>#{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: 50,
    maxWidth: 740,
    width: "100%",
    alignSelf: "center",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  countBadge: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1.1,
  },
  favoriteFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  favoriteFilterPillActive: {
    backgroundColor: THEME.colors.roseMuted,
    borderColor: "rgba(244, 63, 94, 0.35)",
  },
  favoriteFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  favoriteFilterTextActive: {
    color: THEME.colors.rose,
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 18,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardExpanded: {
    borderColor: THEME.colors.accentBorder,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    letterSpacing: -0.2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  snippetText: {
    fontSize: 14,
    lineHeight: 21,
    color: THEME.colors.textSecondary,
  },
  expandedSections: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    gap: 10,
  },
  sectionRow: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  sectionHeaderLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  sectionContent: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  tagBadge: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  tagText: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
    fontWeight: "500",
  },
});
