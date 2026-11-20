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
import { api } from "../../src/api/client";
import { ALL_TAGS, MOOD_OPTIONS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { JournalEntryResponse } from "@myday/contracts";

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
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by words, lessons, highlights..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearSearchButton}>
            <Text style={styles.clearSearchText}>✕</Text>
          </Pressable>
        )}
      </View>

      {/* Tag Filters */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionTitle}>Filter by Tag</Text>
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
        <Text style={styles.filterSectionTitle}>Filter by Mood</Text>
        <View style={styles.moodRow}>
          {MOOD_OPTIONS.map((opt) => {
            const isSelected = selectedMood === opt.level;
            return (
              <Pressable
                key={opt.level}
                style={[styles.moodChip, isSelected && styles.moodChipActive]}
                onPress={() => setSelectedMood(isSelected ? null : opt.level)}
              >
                <Text style={styles.moodEmoji}>{opt.emoji}</Text>
                <Text
                  style={[
                    styles.moodLabel,
                    isSelected && styles.moodLabelActive,
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
          <ActivityIndicator size="small" color="#6366f1" />
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No matching entries</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your keywords or clearing the filters.</Text>
        </View>
      ) : (
        results.map((entry) => (
          <View key={entry.id} style={styles.resultCard}>
            <View style={styles.cardTopRow}>
              <Text style={styles.dateText}>{entry.entryDate}</Text>
              {entry.mood && (
                <Text style={styles.cardMood}>
                  {MOOD_OPTIONS.find((m) => m.level === entry.mood)?.emoji}
                </Text>
              )}
            </View>

            {entry.title ? <Text style={styles.cardHeadline}>{entry.title}</Text> : null}
            <Text style={styles.cardBody} numberOfLines={3}>
              {entry.body}
            </Text>

            {entry.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {entry.tags.map((t) => (
                  <Text key={t} style={styles.tagText}>
                    #{t}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  centerContainer: {
    paddingVertical: 30,
    alignItems: "center",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
  },
  clearSearchButton: {
    padding: 6,
  },
  clearSearchText: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "700",
  },
  filterSection: {
    marginBottom: 14,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4b5563",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  tagScroll: {
    flexDirection: "row",
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  filterChipTextActive: {
    color: "#ffffff",
  },
  moodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  moodChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  moodChipActive: {
    backgroundColor: "#e0e7ff",
    borderColor: "#6366f1",
  },
  moodEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  moodLabel: {
    fontSize: 11,
    color: "#4b5563",
    fontWeight: "600",
  },
  moodLabelActive: {
    color: "#4338ca",
    fontWeight: "700",
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  clearAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ef4444",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  cardMood: {
    fontSize: 16,
  },
  cardHeadline: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardBody: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6366f1",
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6b7280",
    textAlign: "center",
    maxWidth: 280,
  },
});
