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
import Ionicons from "@expo/vector-icons/Ionicons";
import { MOCK_USER_SETTINGS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { UserSettingsMock } from "../../src/types";
import { THEME } from "../../src/theme";

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
          <Ionicons name="person-outline" size={24} color={THEME.colors.accent} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{settings.name}</Text>
          <Text style={styles.profileEmail}>{settings.email}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.privacyBadge}>
              <Ionicons name="shield-checkmark-outline" size={12} color={THEME.colors.emerald} style={{ marginRight: 4 }} />
              <Text style={styles.privacyBadgeText}>Private & Local-First</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Export & Data Ownership */}
      <Text style={styles.sectionHeading}>DATA OWNERSHIP & EXPORT</Text>
      <View style={styles.card}>
        <Text style={styles.cardSubtitle}>
          Your reflections belong entirely to you. Export at any time with zero lock-in.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.actionButton} onPress={handleExportJSON}>
            <Ionicons name="code-slash-outline" size={16} color={THEME.colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.actionButtonText}>Export JSON</Text>
          </Pressable>
          <Pressable style={styles.actionButton} onPress={handleExportMarkdown}>
            <Ionicons name="document-text-outline" size={16} color={THEME.colors.accent} style={{ marginRight: 6 }} />
            <Text style={styles.actionButtonText}>Export Markdown</Text>
          </Pressable>
        </View>
        {exportNotice && (
          <View style={styles.exportNoticeBox}>
            <Ionicons name="checkmark-circle-outline" size={15} color={THEME.colors.emerald} style={{ marginRight: 6 }} />
            <Text style={styles.exportNoticeText}>{exportNotice}</Text>
          </View>
        )}
      </View>

      {/* Preferences */}
      <Text style={styles.sectionHeading}>PREFERENCES</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingTextWrap}>
            <Text style={styles.settingLabel}>Daily Reflection Reminder</Text>
            <Text style={styles.settingDesc}>Prompt once a day to write reflections</Text>
          </View>
          <Switch
            value={settings.dailyReminderEnabled}
            onValueChange={(val) =>
              setSettings((p) => ({ ...p, dailyReminderEnabled: val }))
            }
            trackColor={{ false: THEME.colors.surfaceSubtle, true: THEME.colors.accent }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={[styles.settingRow, styles.rowBorderTop]}>
          <View style={styles.settingTextWrap}>
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
      <Text style={styles.sectionHeading}>OPTIONAL INTEGRATIONS</Text>
      <View style={styles.card}>
        <View style={styles.integrationRow}>
          <View style={styles.integrationIcon}>
            <Ionicons name="cloud-outline" size={20} color={THEME.colors.accent} />
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Google Drive Backup</Text>
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
            <Text style={styles.connectButtonText}>Details</Text>
          </Pressable>
        </View>

        <View style={[styles.integrationRow, styles.rowBorderTop]}>
          <View style={styles.integrationIcon}>
            <Ionicons name="calendar-outline" size={20} color={THEME.colors.accent} />
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Google Calendar (Read-Only)</Text>
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
            <Text style={styles.connectButtonText}>Details</Text>
          </Pressable>
        </View>
      </View>

      {/* Storage Summary */}
      <Text style={styles.sectionHeading}>STORAGE & ARCHITECTURE</Text>
      <View style={styles.card}>
        <View style={styles.storageRow}>
          <View style={styles.storageLeft}>
            <Ionicons name="server-outline" size={17} color={THEME.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.storageLabel}>API Server</Text>
          </View>
          <Text style={styles.storageValue}>Fastify REST API</Text>
        </View>

        <View style={[styles.storageRow, styles.rowBorderTop]}>
          <View style={styles.storageLeft}>
            <Ionicons name="hardware-chip-outline" size={17} color={THEME.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.storageLabel}>Local Persistence</Text>
          </View>
          <Text style={styles.storageValue}>PostgreSQL (Drizzle ORM)</Text>
        </View>

        <View style={[styles.storageRow, styles.rowBorderTop]}>
          <View style={styles.storageLeft}>
            <Ionicons name="sparkles-outline" size={17} color={THEME.colors.textSecondary} style={{ marginRight: 8 }} />
            <Text style={styles.storageLabel}>AI Reflection Guide</Text>
          </View>
          <Text style={styles.storageValue}>Groq Free API (llama-3.1-8b)</Text>
        </View>
      </View>

      {/* About */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>MyDay Platform v0.1.0</Text>
        <Text style={styles.aboutSubtitle}>
          Independent personal platform for calm daily reflection and memory preservation.
        </Text>
      </View>
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: 16,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: THEME.radius.full,
    backgroundColor: THEME.colors.accentMuted,
    borderWidth: 1,
    borderColor: THEME.colors.accentBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: "row",
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.emeraldMuted,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.emerald,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 2,
  },
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  exportNoticeBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    backgroundColor: THEME.colors.emeraldMuted,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  exportNoticeText: {
    fontSize: 12,
    color: THEME.colors.emerald,
    fontWeight: "500",
    flex: 1,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  rowBorderTop: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
    marginTop: 12,
    paddingTop: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  settingDesc: {
    fontSize: 12,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  themePillsRow: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surfaceSubtle,
    padding: 3,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  themePill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.sm,
  },
  themePillActive: {
    backgroundColor: THEME.colors.accent,
  },
  themePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  themePillTextActive: {
    color: "#ffffff",
  },
  integrationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  integrationIcon: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  integrationInfo: {
    flex: 1,
  },
  integrationName: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  integrationStatus: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: THEME.colors.surfaceSubtle,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  storageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  storageLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  storageLabel: {
    fontSize: 13,
    color: THEME.colors.textSecondary,
  },
  storageValue: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  aboutCard: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  aboutTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.5,
  },
  aboutSubtitle: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    textAlign: "center",
    maxWidth: 320,
    lineHeight: 16,
  },
});
