import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [results, setResults] = useState<JournalEntryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getEntries({
          q: searchQuery.trim() || undefined,
          tag: selectedTag || undefined,
          mood: selectedMood || undefined,
          limit: 30,
        });
        if (!cancelled) setResults(res.data);
      } catch {
        // Fallback filter over mock data
        if (!cancelled) {
          const fallback = PAST_ENTRIES_MOCK.filter((entry) => {
            if (selectedTag && !entry.tags.includes(selectedTag)) return false;
            if (selectedMood && entry.mood !== selectedMood) return false;
            if (searchQuery.trim()) {
              const q = searchQuery.toLowerCase();
              const matchesTitle = entry.title?.toLowerCase().includes(q);
              const matchesBody = entry.body.toLowerCase().includes(q);
              const matchesSections = entry.sections.some((s) =>
                s.content.toLowerCase().includes(q)
              );
              if (!matchesTitle && !matchesBody && !matchesSections) return false;
            }
            return true;
          }).map((m) => ({
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
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setResults(fallback);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedTag, selectedMood]);

  const hasActiveFilters = Boolean(searchQuery || selectedTag || selectedMood);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedMood(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Search Input Box */}
      <View style={styles.searchBarContainer}>
        <Ionicons name="search-outline" size={18} color={THEME.colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by keywords, lessons, highlights..."
          placeholderTextColor={THEME.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={17} color={THEME.colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* Tag Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>FILTER BY TAG</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll}>
          {ALL_TAGS.map((tag) => {
            const isSelected = selectedTag === tag.toLowerCase();
            return (
              <Pressable
                key={tag}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedTag(isSelected ? null : tag.toLowerCase())}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Mood Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>FILTER BY MOOD</Text>
        <View style={styles.moodRow}>
          {THEME_MOODS.map((opt) => {
            const isSelected = selectedMood === opt.level;
            return (
              <Pressable
                key={opt.level}
                style={[
                  styles.moodChip,
                  isSelected
                    ? [styles.moodChipActive, { backgroundColor: opt.accentColor }]
                    : styles.moodChipInactive,
                ]}
                onPress={() => setSelectedMood(isSelected ? null : opt.level)}
              >
                <Ionicons
                  name={isSelected ? opt.iconFilled : opt.iconOutline}
                  size={15}
                  color={isSelected ? THEME.colors.textInverse : THEME.colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected ? styles.moodLabelActive : styles.moodLabelInactive,
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Active Filter Clear Header */}
      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>
          {loading ? "Searching..." : `${results.length} result${results.length === 1 ? "" : "s"}`}
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={clearFilters} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Reset filters</Text>
          </Pressable>
        )}
      </View>

      {/* Results List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={THEME.colors.accent} />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={36} color={THEME.colors.textTertiary} />
          <Text style={styles.emptyTitle}>No matching entries</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search terms or resetting active filters.
          </Text>
        </View>
      ) : (
        results.map((entry) => {
          const moodDef = THEME_MOODS.find((m) => m.level === entry.mood);
          return (
            <View key={entry.id} style={styles.resultCard}>
              <View style={styles.cardTopRow}>
                <Text style={styles.dateText}>{formatDisplayDate(entry.entryDate)}</Text>
                <View style={styles.cardRightIcons}>
                  {entry.isFavorite && (
                    <Ionicons name="heart" size={15} color={THEME.colors.rose} style={{ marginRight: 6 }} />
                  )}
                  {moodDef && (
                    <View style={styles.resultMoodChip}>
                      <Ionicons name={moodDef.iconFilled} size={12} color={moodDef.accentColor} />
                    </View>
                  )}
                </View>
              </View>

              {entry.title ? <Text style={styles.entryTitle}>{entry.title}</Text> : null}

              <Text style={styles.bodySnippet} numberOfLines={2}>
                {entry.body}
              </Text>

              {entry.tags.length > 0 && (
                <View style={styles.tagWrap}>
                  {entry.tags.map((t) => (
                    <Text key={t} style={styles.tagLabel}>
                      #{t}
                    </Text>
                  ))}
                </View>
              )}
            </View>
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
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: THEME.spacing.md,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.textPrimary,
    fontSize: 14,
  },
  filterSection: {
    marginBottom: THEME.spacing.md,
  },
  filterSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  tagScroll: {
    flexDirection: "row",
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: THEME.colors.accentMuted,
    borderColor: THEME.colors.accent,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: THEME.colors.textSecondary,
  },
  filterChipTextActive: {
    color: THEME.colors.accent,
    fontWeight: "700",
  },
  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  moodChipInactive: {
    backgroundColor: THEME.colors.surfaceSubtle,
    borderColor: THEME.colors.border,
  },
  moodChipActive: {
    borderColor: "transparent",
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  moodLabelInactive: {
    color: THEME.colors.textSecondary,
  },
  moodLabelActive: {
    color: THEME.colors.textInverse,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    marginTop: 6,
  },
  resultCount: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.5,
  },
  clearAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 12,
    color: THEME.colors.accent,
    fontWeight: "600",
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  resultCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
  },
  cardRightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
  resultMoodChip: {
    padding: 2,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
    marginBottom: 4,
  },
  bodySnippet: {
    fontSize: 13,
    lineHeight: 18,
    color: THEME.colors.textSecondary,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagLabel: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
});
