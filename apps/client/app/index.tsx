import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getDiaryDateForTimezone } from "@myday/core";

export default function HomeScreen() {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const todayDate = getDiaryDateForTimezone(userTimezone);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.pill}>Phase 0 Verified</Text>
        <Text style={styles.title}>Welcome to MyDay</Text>
        <Text style={styles.date}>{todayDate}</Text>
        <Text style={styles.description}>
          Universal client shell ready on Android, iOS, and Web.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f9fafb",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 420,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  pill: {
    backgroundColor: "#e0f2fe",
    color: "#0369a1",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  date: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
    textAlign: "center",
  },
});
