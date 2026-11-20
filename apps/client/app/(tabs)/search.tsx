import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ALL_TAGS, MOOD_OPTIONS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { MoodLevel } from "../../src/types";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);

  const results = useMemo(() => {
    return PAST_ENTRIES_MOCK.filter((entry) => {
      // 1. Tag filter
      if (selectedTag && !entry.tags.includes(selectedTag)) {
        return false;
      }
      // 2. Mood filter
      if (selectedMood && entry.mood !== selectedMood) {
        return false;
      }
      // 3. Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(q);
        const matchesBody = entry.body.toLowerCase().includes(q);
        const matchesSections = entry.sections.some((s) =>
          s.content.toLowerCase().includes(q)
        );
        if (!matchesTitle && !matchesBody && !matchesSections) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, selectedTag, selectedMood]);

  const hasActiveFilters = Boolean(searchQuery || selectedTag || selectedMood);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTag(null);
    setSelectedMood(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search thoughts, memories, reflections..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
            <Text style={styles.clearSearchText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Tag Filter Chips */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter by Tag</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {ALL_TAGS.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedTag(isSelected ? null : tag)}
              >
                <Text
                  style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                >
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Mood Filter Row */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Filter by Mood</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((m) => {
            const isSelected = selectedMood === m.level;
            return (
              <Pressable
                key={m.level}
                style={[styles.moodFilterPill, isSelected && styles.moodFilterPillActive]}
                onPress={() => setSelectedMood(isSelected ? null : m.level)}
              >
                <Text style={styles.moodFilterEmoji}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodFilterLabel,
                    isSelected && styles.moodFilterLabelActive,
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {results.length} {results.length === 1 ? "Result" : "Results"}
        </Text>
        {hasActiveFilters && (
          <Pressable onPress={clearFilters}>
            <Text style={styles.resetText}>Reset Filters</Text>
          </Pressable>
        )}
      </View>

      {/* Results List */}
      {results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No matching entries found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search terms or clearing tag and mood filters.
          </Text>
        </View>
      ) : (
        results.map((entry) => {
          const moodOpt = MOOD_OPTIONS.find((m) => m.level === entry.mood);
          return (
            <View key={entry.id} style={styles.resultCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.resultDate}>{entry.entryDate}</Text>
                {moodOpt && (
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodBadgeEmoji}>{moodOpt.emoji}</Text>
                    <Text style={styles.moodBadgeText}>{moodOpt.label}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.resultTitle}>{entry.title}</Text>
              <Text style={styles.resultBody} numberOfLines={2}>
                {entry.body}
              </Text>
              <View style={styles.cardFooter}>
                <View style={styles.tagsWrap}>
                  {entry.tags.map((t) => (
                    <Text key={t} style={styles.resultTag}>
                      #{t}
                    </Text>
                  ))}
                </View>
                {entry.isFavorite && <Text style={styles.favBadge}>⭐</Text>}
              </View>
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
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 2,
  },
  clearSearchButton: {
    padding: 4,
  },
  clearSearchText: {
    fontSize: 14,
    color: "#94a3b8",
    fontWeight: "700",
  },
  filterSection: {
    marginBottom: 14,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: "row",
  },
  filterChip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#0284c7",
    borderColor: "#0284c7",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  moodRow: {
    flexDirection: "row",
    gap: 8,
  },
  moodFilterPill: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 6,
  },
  moodFilterPillActive: {
    backgroundColor: "#e0f2fe",
    borderColor: "#0284c7",
  },
  moodFilterEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  moodFilterLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b",
  },
  moodFilterLabelActive: {
    color: "#0284c7",
    fontWeight: "700",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  resultsCount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  resetText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284c7",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  resultDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  moodBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  moodBadgeEmoji: {
    fontSize: 12,
  },
  moodBadgeText: {
    fontSize: 10,
    color: "#475569",
    fontWeight: "600",
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  resultBody: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475569",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tagsWrap: {
    flexDirection: "row",
    gap: 6,
  },
  resultTag: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  favBadge: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
});
