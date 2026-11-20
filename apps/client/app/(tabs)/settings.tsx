import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { api } from "../../src/api/client";
import { MOCK_USER_SETTINGS, PAST_ENTRIES_MOCK } from "../../src/mockData";
import { UserSettingsMock } from "../../src/types";
import { THEME } from "../../src/theme";
import {
  CalendarStatusResponse,
  DriveBackupItem,
  DriveStatusResponse,
  ImportPreviewResponse,
  RestorePreviewResponse,
} from "@myday/contracts";

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettingsMock>(MOCK_USER_SETTINGS);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Google Drive State (Phase 7)
  const [driveStatus, setDriveStatus] = useState<DriveStatusResponse>({
    connected: false,
    providerAccountId: null,
    scopes: [],
    lastBackupAt: null,
    backupCount: 0,
    appFolderName: "MyDay Backups",
  });
  const [backups, setBackups] = useState<DriveBackupItem[]>([]);
  const [driveLoading, setDriveLoading] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<RestorePreviewResponse | null>(null);

  // Google Calendar State (Phase 8)
  const [calendarStatus, setCalendarStatus] = useState<CalendarStatusResponse>({
    connected: false,
    providerAccountId: null,
    scopes: [],
    lastSyncAt: null,
  });
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Export / Import / Deletion State (Phase 9)
  const [exportLoading, setExportLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importJsonInput, setImportJsonInput] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreviewResponse | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const loadDriveData = async () => {
    try {
      const status = await api.getDriveStatus();
      setDriveStatus(status);
      if (status.connected) {
        const list = await api.listDriveBackups();
        setBackups(list);
      }
    } catch {
      // Offline fallback
    }

    try {
      const calStatus = await api.getCalendarStatus();
      setCalendarStatus(calStatus);
    } catch {
      // Offline fallback
    }
  };

  const handleConnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      const updated = await api.connectCalendar("auth_code_calendar_readonly_scope");
      setCalendarStatus(updated);
      setExportNotice("Google Calendar connected (read-only context enabled).");
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      Alert.alert("Connection Error", err?.message || "Failed to connect Google Calendar");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setCalendarLoading(true);
    try {
      await api.disconnectCalendar();
      setCalendarStatus({
        connected: false,
        providerAccountId: null,
        scopes: [],
        lastSyncAt: null,
      });
      setExportNotice("Google Calendar disconnected.");
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      // Ignore
    } finally {
      setCalendarLoading(false);
    }
  };

  useEffect(() => {
    loadDriveData();
  }, []);

  const handleConnectDrive = async () => {
    setDriveLoading(true);
    try {
      const updated = await api.connectDrive("auth_code_user_authorized_drive_scope");
      setDriveStatus(updated);
      const list = await api.listDriveBackups();
      setBackups(list);
      setExportNotice("Google Drive connected to app-owned folder.");
      setTimeout(() => setExportNotice(null), 3000);
    } catch (err: any) {
      Alert.alert("Connection Error", err?.message || "Failed to connect Google Drive");
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDisconnectDrive = async () => {
    setDriveLoading(true);
    try {
      await api.disconnectDrive();
      setDriveStatus({
        connected: false,
        providerAccountId: null,
        scopes: [],
        lastBackupAt: null,
        backupCount: 0,
        appFolderName: "MyDay Backups",
      });
      setBackups([]);
      setExportNotice("Google Drive disconnected.");
      setTimeout(() => setExportNotice(null), 3000);
    } catch {
      // Ignore
    } finally {
      setDriveLoading(false);
    }
  };

  const handleBackupNow = async () => {
    setDriveLoading(true);
    try {
      const created = await api.createDriveBackup();
      setBackups((prev) => [created, ...prev]);
      setDriveStatus((prev) => ({
        ...prev,
        lastBackupAt: created.createdAt,
        backupCount: prev.backupCount + 1,
      }));
      setExportNotice(`Created backup: ${created.filename} (${created.entryCount} entries)`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      Alert.alert("Backup Failed", err?.message || "Could not create backup snapshot");
    } finally {
      setDriveLoading(false);
    }
  };

  const handlePreviewRestore = async (backupId: string) => {
    setDriveLoading(true);
    try {
      const preview = await api.previewRestore(backupId);
      setPreviewData(preview);
      setRestoreModalVisible(true);
    } catch (err: any) {
      Alert.alert("Restore Preview Error", err?.message || "Could not read backup snapshot");
    } finally {
      setDriveLoading(false);
    }
  };

  const handleConfirmRestore = async (strategy: "merge" | "overwrite") => {
    if (!previewData) return;
    setDriveLoading(true);
    setRestoreModalVisible(false);

    try {
      const result = await api.confirmRestore(previewData.backupId, strategy);
      setExportNotice(result.message);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      Alert.alert("Restore Error", err?.message || "Failed to restore entries");
    } finally {
      setDriveLoading(false);
    }
  };

  const triggerWebDownload = (content: string, filename: string, mime: string) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportJSON = async () => {
    setExportLoading(true);
    try {
      const data = await api.exportData("json");
      const content = JSON.stringify(data, null, 2);
      const total = typeof data === "object" && data !== null && "totalEntries" in data ? (data as any).totalEntries : 0;
      const filename = `myday-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
      triggerWebDownload(content, filename, "application/json");

      setExportNotice(`Exported ${total} entries to ${filename}.`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      Alert.alert("Export Failed", err?.message || "Could not export JSON data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportMarkdown = async () => {
    setExportLoading(true);
    try {
      const markdown = (await api.exportData("markdown")) as string;
      const filename = `myday-journal-export-${new Date().toISOString().slice(0, 10)}.md`;
      triggerWebDownload(markdown, filename, "text/markdown");

      setExportNotice(`Exported journal archive to ${filename}.`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      Alert.alert("Export Failed", err?.message || "Could not export Markdown data");
    } finally {
      setExportLoading(false);
    }
  };

  const handleOpenImportModal = () => {
    setImportPreview(null);
    setImportJsonInput("");
    setImportModalVisible(true);
  };

  const handlePreviewImport = async () => {
    if (!importJsonInput.trim()) {
      Alert.alert("Empty Input", "Please paste valid MyDay JSON backup content.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(importJsonInput);
    } catch {
      Alert.alert("JSON Syntax Error", "The pasted text is not valid JSON.");
      return;
    }

    setImportLoading(true);
    try {
      const preview = await api.previewImport(parsed);
      setImportPreview(preview);
      if (!preview.valid) {
        Alert.alert(
          "Invalid Import Schema",
          preview.validationErrors?.join("\n") || "Payload does not match MyDay export format."
        );
      }
    } catch (err: any) {
      Alert.alert("Import Preview Error", err?.message || "Could not preview import");
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async (strategy: "merge" | "overwrite") => {
    if (!importJsonInput) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(importJsonInput);
    } catch {
      return;
    }

    setImportLoading(true);
    try {
      const result = await api.confirmImport(strategy, parsed);
      setImportModalVisible(false);
      setImportPreview(null);
      setImportJsonInput("");
      setExportNotice(
        `Imported: ${result.importedCount} new, ${result.overwrittenCount} overwritten, ${result.skippedCount} skipped.`
      );
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      Alert.alert("Import Failed", err?.message || "Could not import entries");
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteAccountData = () => {
    const confirmAction = async () => {
      setExportLoading(true);
      try {
        const result = await api.deleteAccountData();
        setExportNotice(
          `All account data purged: ${result.deletedEntriesCount} entries, ${result.deletedAttachmentsCount} attachments removed.`
        );
        setTimeout(() => setExportNotice(null), 4000);
        // Refresh drive and calendar states
        loadDriveData();
      } catch (err: any) {
        Alert.alert("Deletion Failed", err?.message || "Could not delete account data");
      } finally {
        setExportLoading(false);
      }
    };

    if (Platform.OS === "web") {
      if (
        window.confirm(
          "Are you absolutely sure? This will permanently delete ALL diary entries, reflections, and attachments. This cannot be undone."
        )
      ) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Delete All Data",
        "This will permanently delete ALL your journal entries, reflections, and attachments. This action is irreversible.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Permanently Delete", style: "destructive", onPress: confirmAction },
        ]
      );
    }
  };

  const showCalendarNotice = () => {
    const msg = "Google Calendar is an optional, read-only context feature configured in Phase 8. No calendar events are modified or created.";
    if (Platform.OS === "web") {
      alert(msg);
    } else {
      Alert.alert("Google Calendar", msg);
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

      {/* Google Drive Integration (Phase 7) */}
      <Text style={styles.sectionHeading}>CLOUD BACKUP (GOOGLE DRIVE)</Text>
      <View style={styles.card}>
        <View style={styles.integrationRow}>
          <View style={styles.integrationIcon}>
            <Ionicons name="cloud-upload-outline" size={20} color={THEME.colors.accent} />
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>App-Owned Backup Folder</Text>
            <Text style={styles.integrationStatus}>
              {driveStatus.connected
                ? `Connected (${driveStatus.providerAccountId || "Google Account"})`
                : "Disconnected — diary works 100% offline"}
            </Text>
          </View>
          <Pressable
            style={[
              styles.connectButton,
              driveStatus.connected && styles.connectButtonDisconnect,
            ]}
            onPress={driveStatus.connected ? handleDisconnectDrive : handleConnectDrive}
            disabled={driveLoading}
          >
            {driveLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.textPrimary} />
            ) : (
              <Text
                style={[
                  styles.connectButtonText,
                  driveStatus.connected && styles.connectButtonTextDisconnect,
                ]}
              >
                {driveStatus.connected ? "Disconnect" : "Connect"}
              </Text>
            )}
          </Pressable>
        </View>

        {driveStatus.connected && (
          <View style={styles.driveActionsBlock}>
            <View style={styles.driveMetaRow}>
              <Text style={styles.driveMetaLabel}>Last Backup:</Text>
              <Text style={styles.driveMetaValue}>
                {driveStatus.lastBackupAt
                  ? new Date(driveStatus.lastBackupAt).toLocaleString()
                  : "Never"}
              </Text>
            </View>

            <Pressable
              style={styles.backupNowButton}
              onPress={handleBackupNow}
              disabled={driveLoading}
            >
              <Ionicons name="cloud-upload" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.backupNowButtonText}>
                {driveLoading ? "Creating Backup..." : "Create Backup Now"}
              </Text>
            </Pressable>

            {/* Backups List */}
            {backups.length > 0 && (
              <View style={styles.backupsHistoryContainer}>
                <Text style={styles.backupHistoryTitle}>Backup Snapshots ({backups.length})</Text>
                {backups.map((b) => (
                  <View key={b.id} style={styles.backupHistoryItem}>
                    <View style={styles.backupItemLeft}>
                      <Text style={styles.backupItemName}>{b.filename}</Text>
                      <Text style={styles.backupItemSub}>
                        {new Date(b.createdAt).toLocaleDateString()} • {b.entryCount} entries • {Math.round(b.sizeBytes / 1024)} KB
                      </Text>
                    </View>
                    <Pressable
                      style={styles.restoreButton}
                      onPress={() => handlePreviewRestore(b.id)}
                    >
                      <Ionicons name="arrow-undo-outline" size={13} color={THEME.colors.accent} style={{ marginRight: 4 }} />
                      <Text style={styles.restoreButtonText}>Restore</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
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

      {/* Google Calendar (Phase 8) */}
      <Text style={styles.sectionHeading}>GOOGLE CALENDAR (READ-ONLY CONTEXT)</Text>
      <View style={styles.card}>
        <View style={styles.integrationRow}>
          <View style={styles.integrationIcon}>
            <Ionicons name="calendar-outline" size={20} color={THEME.colors.accent} />
          </View>
          <View style={styles.integrationInfo}>
            <Text style={styles.integrationName}>Daily Schedule Context</Text>
            <Text style={styles.integrationStatus}>
              {calendarStatus.connected
                ? `Connected (${calendarStatus.providerAccountId || "Google Account"})`
                : "Disconnected — optional read-only context for Today tab"}
            </Text>
          </View>
          <Pressable
            style={[
              styles.connectButton,
              calendarStatus.connected && styles.connectButtonDisconnect,
            ]}
            onPress={calendarStatus.connected ? handleDisconnectCalendar : handleConnectCalendar}
            disabled={calendarLoading}
          >
            {calendarLoading ? (
              <ActivityIndicator size="small" color={THEME.colors.textPrimary} />
            ) : (
              <Text
                style={[
                  styles.connectButtonText,
                  calendarStatus.connected && styles.connectButtonTextDisconnect,
                ]}
              >
                {calendarStatus.connected ? "Disconnect" : "Connect"}
              </Text>
            )}
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

      {/* Restore Confirmation Modal */}
      <Modal
        visible={restoreModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestoreModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="cloud-download-outline" size={24} color={THEME.colors.accent} />
              <Text style={styles.modalTitle}>Restore Backup</Text>
            </View>

            {previewData && (
              <>
                <Text style={styles.modalBody}>
                  Snapshot contains <Text style={{ color: THEME.colors.textPrimary, fontWeight: "700" }}>{previewData.entryCount} entries</Text> from {new Date(previewData.createdAt).toLocaleDateString()}.
                </Text>
                <Text style={styles.modalSub}>
                  Select how you would like to restore these entries:
                </Text>

                <View style={styles.modalActions}>
                  <Pressable
                    style={styles.modalBtnMerge}
                    onPress={() => handleConfirmRestore("merge")}
                  >
                    <Text style={styles.modalBtnMergeText}>Merge (Keep Newer)</Text>
                  </Pressable>

                  <Pressable
                    style={styles.modalBtnOverwrite}
                    onPress={() => handleConfirmRestore("overwrite")}
                  >
                    <Text style={styles.modalBtnOverwriteText}>Overwrite All</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => setRestoreModalVisible(false)}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  connectButtonDisconnect: {
    backgroundColor: THEME.colors.roseMuted,
    borderColor: "rgba(244, 63, 94, 0.25)",
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  connectButtonTextDisconnect: {
    color: THEME.colors.rose,
  },
  driveActionsBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.borderSubtle,
  },
  driveMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  driveMetaLabel: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
  },
  driveMetaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  backupNowButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.accent,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    marginBottom: 12,
  },
  backupNowButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  backupsHistoryContainer: {
    gap: 8,
  },
  backupHistoryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  backupHistoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceSubtle,
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.borderSubtle,
  },
  backupItemLeft: {
    flex: 1,
    marginRight: 10,
  },
  backupItemName: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  backupItemSub: {
    fontSize: 11,
    color: THEME.colors.textTertiary,
    marginTop: 2,
  },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.accentMuted,
    borderWidth: 1,
    borderColor: THEME.colors.accentBorder,
  },
  restoreButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.accent,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.xl,
    padding: 22,
    maxWidth: 420,
    width: "100%",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: THEME.colors.textPrimary,
  },
  modalBody: {
    fontSize: 13,
    lineHeight: 19,
    color: THEME.colors.textSecondary,
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  modalBtnMerge: {
    flex: 1,
    backgroundColor: THEME.colors.accent,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: "center",
  },
  modalBtnMergeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalBtnOverwrite: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: "center",
  },
  modalBtnOverwriteText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  modalCancelBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  modalCancelBtnText: {
    fontSize: 12,
    color: THEME.colors.textTertiary,
  },
});
