import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MOOD_OPTIONS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { JournalEntryMock } from "../../src/types";

export default function TimelineScreen() {
  const [entries] = useState<JournalEntryMock[]>(PAST_ENTRIES_MOCK);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const filteredEntries = onlyFavorites
    ? entries.filter((e) => e.isFavorite)
    : entries;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Top Filter Bar */}
      <View style={styles.filterRow}>
        <Text style={styles.countText}>
          {filteredEntries.length} {filteredEntries.length === 1 ? "Memory" : "Memories"}
        </Text>
        <Pressable
          style={[styles.favoriteFilterPill, onlyFavorites && styles.favoriteFilterPillActive]}
          onPress={() => setOnlyFavorites((p) => !p)}
        >
          <Text style={[styles.favoriteFilterText, onlyFavorites && styles.favoriteFilterTextActive]}>
            ⭐ Favorites Only
          </Text>
        </Pressable>
      </View>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No memories found</Text>
          <Text style={styles.emptySubtitle}>Try toggling the favorites filter off.</Text>
        </View>
      ) : (
        filteredEntries.map((item) => {
          const moodOpt = MOOD_OPTIONS.find((m) => m.level === item.mood);
          const isExpanded = selectedEntryId === item.id;

          return (
            <Pressable
              key={item.id}
              style={[styles.card, isExpanded && styles.cardExpanded]}
              onPress={() => setSelectedEntryId(isExpanded ? null : item.id)}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateText}>{item.entryDate}</Text>
                </View>
                <View style={styles.headerRight}>
                  {moodOpt && (
                    <View style={styles.moodPill}>
                      <Text style={styles.moodEmoji}>{moodOpt.emoji}</Text>
                      <Text style={styles.moodLabel}>{moodOpt.label}</Text>
                    </View>
                  )}
                  {item.isFavorite && <Text style={styles.favoriteBadge}>⭐</Text>}
                </View>
              </View>

              {/* Title & Body */}
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text
                style={styles.cardBody}
                numberOfLines={isExpanded ? undefined : 3}
              >
                {item.body}
              </Text>

              {/* Expanded Reflection Details */}
              {isExpanded && item.sections.length > 0 && (
                <View style={styles.expandedSectionsWrap}>
                  {item.sections.map((sec) => (
                    <View key={sec.id} style={styles.reflectionItem}>
                      <Text style={styles.reflectionLabel}>
                        {sec.sectionType === "highlights" && "🌟 Highlight"}
                        {sec.sectionType === "gratitude" && "🙏 Gratitude"}
                        {sec.sectionType === "learned" && "💡 Lesson"}
                        {sec.sectionType === "tomorrow" && "🎯 Tomorrow"}
                      </Text>
                      <Text style={styles.reflectionText}>{sec.content}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Card Footer: Tags & Expand Hint */}
              <View style={styles.cardFooter}>
                <View style={styles.tagChipsList}>
                  {item.tags.map((tag) => (
                    <View key={tag} style={styles.tagChip}>
                      <Text style={styles.tagChipText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.expandHint}>
                  {isExpanded ? "Show less ▲" : "Details ▼"}
                </Text>
              </View>
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
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 680,
    width: "100%",
    alignSelf: "center",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  favoriteFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  favoriteFilterPillActive: {
    backgroundColor: "#fef9c3",
    borderColor: "#facc15",
  },
  favoriteFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  favoriteFilterTextActive: {
    color: "#a16207",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardExpanded: {
    borderColor: "#0284c7",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateBadge: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 4,
  },
  moodEmoji: {
    fontSize: 13,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  favoriteBadge: {
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
    color: "#334155",
    marginBottom: 12,
  },
  expandedSectionsWrap: {
    marginTop: 8,
    marginBottom: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    gap: 8,
  },
  reflectionItem: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 10,
  },
  reflectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0284c7",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  reflectionText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#1e293b",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  tagChipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  tagChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  expandHint: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284c7",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#64748b",
  },
});
