import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { MOCK_USER_SETTINGS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { UserSettingsMock } from "../../src/types";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettingsMock>(MOCK_USER_SETTINGS);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(PAST_ENTRIES_MOCK, null, 2);
    setExportNotice(`Exported ${PAST_ENTRIES_MOCK.length} entries as JSON (${dataStr.length} bytes).`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleExportMarkdown = () => {
    setExportNotice(`Exported ${PAST_ENTRIES_MOCK.length} entries as Markdown bundle.`);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const showIntegrationNotice = (provider: "Drive" | "Calendar") => {
    const msg =
      provider === "Drive"
        ? "Google Drive backup is an optional, separate user permission configured in Phase 7. Your diary works 100% offline without it."
        : "Google Calendar is an optional, read-only context feature configured in Phase 8. No calendar events are modified or created.";
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert(provider, msg);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* User Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{settings.name}</Text>
          <Text style={styles.profileEmail}>{settings.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.privacyBadge}>
              <Text style={styles.privacyBadgeText}>🔒 Private & Offline-First</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Export & Data Ownership */}
      <Text style={styles.sectionHeading}>Data Ownership & Export</Text>
      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>
          Your memories belong to you. Export at any time with zero lock-in.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.actionButton} onPress={handleExportJSON}>
            <Text style={styles.actionButtonText}>📄 Export JSON</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleExportMarkdown}>
            <Text style={styles.actionButtonText}>📝 Export Markdown</Text>
          </Pressable>
        </View>
        {exportNotice && (
          <View style={styles.exportNoticeBox}>
            <Text style={styles.exportNoticeText}>{exportNotice}</Text>
          </View>
        )}
      </View>

      {/* Preferences */}
      <Text style={styles.sectionHeading}>Preferences</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Daily Reflection Reminder</Text>
            <Text style={styles.settingDesc}>Prompt once a day to write reflections</Text>
          </View>
          <Switch
            value={settings.dailyReminderEnabled}
            onValueChange={(val) =>
              setSettings((p) => ({ ...p, dailyReminderEnabled: val }))
            }
            trackColor={{ false: "#cbd5e1", true: "#0284c7" }}
          />
        </View>

        <View style={[styles.settingRow, styles.rowBorderTop]}>
          <View>
            <Text style={styles.settingLabel}>Appearance</Text>
            <Text style={styles.settingDesc}>Theme preference</Text>
          </View>
          <View style={styles.themePillsRow}>
            {(["system", "light", "dark"] as const).map((t) => (
              <Pressable
                key={t}
                style={[
                  styles.themePill,
                  settings.theme === t && styles.themePillActive,
                ]}
                onPress={() => setSettings((p) => ({ ...p, theme: t }))}
              >
                <Text
                  style={[
                    styles.themePillText,
                    settings.theme === t && styles.themePillTextActive,
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Optional Integrations */}
      <Text style={styles.sectionHeading}>Optional Integrations</Text>
      <View style={styles.card}>
        <View style={styles.integrationRow}>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>📁 Google Drive Backup</Text>
            <Text style={styles.integrationStatus}>
              {settings.driveBackupStatus === "connected"
                ? "Connected"
                : "Disconnected (Phase 7)"}
            </Text>
          </View>
          <Pressable
            style={styles.connectButton}
            onPress={() => showIntegrationNotice("Drive")}
          >
            <Text style={styles.connectButtonText}>Learn More</Text>
          </Pressable>
        </View>

        <View style={[styles.integrationRow, styles.rowBorderTop]}>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>📅 Google Calendar (Read-Only)</Text>
            <Text style={styles.integrationStatus}>
              {settings.calendarSyncStatus === "connected"
                ? "Connected"
                : "Disconnected (Phase 8)"}
            </Text>
          </View>
          <Pressable
            style={styles.connectButton}
            onPress={() => showIntegrationNotice("Calendar")}
          >
            <Text style={styles.connectButtonText}>Learn More</Text>
          </Pressable>
        </View>
      </View>

      {/* System Diagnostics */}
      <Text style={styles.sectionHeading}>Platform & System</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Platform Runtime</Text>
          <Text style={styles.infoVal}>{Platform.OS} ({Platform.select({ web: "Web", default: "Native" })})</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Timezone</Text>
          <Text style={styles.infoVal}>{settings.timezone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Offline Storage</Text>
          <Text style={styles.infoVal}>{Platform.OS === "web" ? "IndexedDB Adapter" : "SQLite Adapter"}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Architecture Milestone</Text>
          <Text style={styles.infoVal}>Phase 1 — Universal UI Shell</Text>
        </View>
      </View>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  profileEmail: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
  },
  privacyBadge: {
    backgroundColor: "#f0fdf4",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  privacyBadgeText: {
    fontSize: 11,
    color: "#166534",
    fontWeight: "600",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },
  exportNoticeBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  exportNoticeText: {
    fontSize: 12,
    color: "#166534",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 8,
    paddingTop: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  settingDesc: {
    fontSize: 12,
    color: "#64748b",
  },
  themePillsRow: {
    flexDirection: "row",
    gap: 4,
  },
  themePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f1f5f9",
  },
  themePillActive: {
    backgroundColor: "#0284c7",
  },
  themePillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  themePillTextActive: {
    color: "#ffffff",
  },
  integrationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  integrationStatus: {
    fontSize: 12,
    color: "#64748b",
  },
  connectButton: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284c7",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoKey: {
    fontSize: 13,
    color: "#64748b",
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
});
