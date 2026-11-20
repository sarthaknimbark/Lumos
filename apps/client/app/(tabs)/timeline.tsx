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
import { api } from "../../src/api/client";
import { MOOD_OPTIONS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { JournalEntryResponse } from "@myday/contracts";

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
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Top Filter Bar */}
      <View style={styles.filterRow}>
        <Text style={styles.countText}>
          {entries.length} {entries.length === 1 ? "Memory" : "Memories"}
        </Text>
        <Pressable
          style={[styles.favoriteFilterPill, onlyFavorites && styles.favoriteFilterPillActive]}
          onPress={() => setOnlyFavorites((p) => !p)}
        >
          <Text style={[styles.favoriteFilterText, onlyFavorites && styles.favoriteFilterTextActive]}>
            ★ Favorites Only
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading timeline...</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No memories found</Text>
          <Text style={styles.emptySubtitle}>
            {onlyFavorites
              ? "Try toggling the favorites filter off."
              : "Write your first entry in the Today tab!"}
          </Text>
        </View>
      ) : (
        entries.map((item) => {
          const moodOpt = MOOD_OPTIONS.find((m) => m.level === item.mood);
          const isExpanded = selectedEntryId === item.id;

          return (
            <Pressable
              key={item.id}
              style={styles.card}
              onPress={() => setSelectedEntryId(isExpanded ? null : item.id)}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.dateLabel}>{item.entryDate}</Text>
                  {item.title ? <Text style={styles.titleText}>{item.title}</Text> : null}
                </View>
                <View style={styles.badgeRow}>
                  {item.isFavorite && <Text style={styles.starBadge}>★</Text>}
                  {moodOpt && (
                    <View style={styles.moodBadge}>
                      <Text style={styles.moodEmoji}>{moodOpt.emoji}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.snippetText} numberOfLines={isExpanded ? undefined : 3}>
                {item.body}
              </Text>

              {/* Reflection Sections (shown when expanded) */}
              {isExpanded && item.sections.length > 0 && (
                <View style={styles.expandedSections}>
                  {item.sections.map((sec) => (
                    <View key={sec.id} style={styles.sectionRow}>
                      <Text style={styles.sectionHeading}>
                        {sec.sectionType === "highlights"
                          ? "🌟 Highlights"
                          : sec.sectionType === "gratitude"
                          ? "🙏 Gratitude"
                          : sec.sectionType === "learned"
                          ? "💡 Learned"
                          : sec.sectionType === "tomorrow"
                          ? "🎯 Tomorrow"
                          : "Notes"}
                      </Text>
                      <Text style={styles.sectionContent}>{sec.content}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Tags */}
              {item.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.tags.map((t) => (
                    <Text key={t} style={styles.tagText}>
                      #{t}
                    </Text>
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
    paddingVertical: 50,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
  },
  favoriteFilterPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#e5e7eb",
  },
  favoriteFilterPillActive: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
  },
  favoriteFilterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  favoriteFilterTextActive: {
    color: "#b45309",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  titleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starBadge: {
    fontSize: 16,
    color: "#f59e0b",
  },
  moodBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  moodEmoji: {
    fontSize: 16,
  },
  snippetText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
  expandedSections: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  sectionRow: {
    backgroundColor: "#f9fafb",
    padding: 8,
    borderRadius: 8,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 2,
  },
  sectionContent: {
    fontSize: 13,
    color: "#1f2937",
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
});
