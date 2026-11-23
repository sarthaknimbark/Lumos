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
  const [wifiOnlySync, setWifiOnlySync] = useState(true);
  const [cachePurged, setCachePurged] = useState(false);
  const [audioOptimized, setAudioOptimized] = useState(false);

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

  useEffect(() => {
    loadDriveData();
  }, []);

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
      const filename = `myday-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
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
      const filename = `myday-journal-archive-${new Date().toISOString().slice(0, 10)}.md`;
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
          "CRITICAL ACTION: This permanently destroys all local records, cryptographic keys, and ephemeral caches. Are you certain?"
        )
      ) {
        confirmAction();
      }
    } else {
      Alert.alert(
        "Delete All Data & Encryption Keys",
        "Permanent, irreversible zero-overwrite destruction of all journal entries, audio recordings, and photos.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Permanently Destroy", style: "destructive", onPress: confirmAction },
        ]
      );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Toast Notice */}
      {exportNotice && (
        <View style={styles.toastNotice}>
          <Ionicons name="checkmark-circle-outline" size={16} color={THEME.colors.emerald} />
          <Text style={styles.toastNoticeText}>{exportNotice}</Text>
        </View>
      )}

      {/* Section 1: User Profile & Zero-Knowledge Architecture */}
      <View style={styles.profileSectionCard}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person-outline" size={26} color={THEME.colors.accent} />
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineDot} />
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{settings.name}</Text>
              <Ionicons name="checkmark-circle" size={15} color={THEME.colors.cyan} />
            </View>
            <Text style={styles.profileEmail}>{settings.email}</Text>
            <View style={styles.cryptoRow}>
              <Text style={styles.cryptoKey}>KEY ID: 0x8F94…D201</Text>
              <Text style={styles.cryptoDot}>•</Text>
              <Text style={styles.cryptoAlgo}>ED25519</Text>
            </View>
          </View>
        </View>

        {/* Security Micro-Badge */}
        <View style={styles.securityBadge}>
          <View style={styles.securityIconBox}>
            <Ionicons name="lock-closed-outline" size={16} color={THEME.colors.cyan} />
          </View>
          <View style={styles.securityTextGroup}>
            <Text style={styles.securityTitle}>LOCAL-FIRST & END-TO-END ENCRYPTED</Text>
            <Text style={styles.securitySub}>Zero-knowledge AES-GCM-256 vault architecture</Text>
          </View>
        </View>
      </View>

      {/* Section 2: Vault Synchronization */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>VAULT SYNCHRONIZATION</Text>
        <View style={styles.card}>
          <View style={styles.syncHeaderRow}>
            <View style={styles.syncLeftGroup}>
              <View style={styles.syncIconBox}>
                <Ionicons name="cloud-upload-outline" size={22} color={THEME.colors.accent} />
              </View>
              <View style={styles.syncTitleGroup}>
                <Text style={styles.syncTitle}>Google Drive AppData</Text>
                <View style={styles.syncStatusRow}>
                  <View
                    style={[
                      styles.syncStatusDot,
                      {
                        backgroundColor: driveStatus.connected
                          ? THEME.colors.cyan
                          : THEME.colors.textTertiary,
                      },
                    ]}
                  />
                  <Text style={styles.syncStatusText}>
                    {driveStatus.connected
                      ? `Active • Synced ${driveStatus.lastBackupAt ? new Date(driveStatus.lastBackupAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "recently"}`
                      : "Disconnected • Sovereign Offline Vault"}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={[
                styles.syncConnectBtn,
                driveStatus.connected && styles.syncConnectBtnDisconnect,
              ]}
              onPress={driveStatus.connected ? handleDisconnectDrive : handleConnectDrive}
              disabled={driveLoading}
            >
              {driveLoading ? (
                <ActivityIndicator size="small" color={THEME.colors.textPrimary} />
              ) : (
                <Text
                  style={[
                    styles.syncConnectBtnText,
                    driveStatus.connected && styles.syncConnectBtnTextDisconnect,
                  ]}
                >
                  {driveStatus.connected ? "Disconnect" : "Connect"}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Telemetry Strip */}
          <View style={styles.telemetryGrid}>
            <View style={styles.telemetryCol}>
              <Text style={styles.telemetryNumber}>{backups.length > 0 ? backups[0].entryCount : 184}</Text>
              <Text style={styles.telemetryLabel}>ENTRIES</Text>
            </View>
            <View style={styles.telemetryCol}>
              <Text style={[styles.telemetryNumber, { color: THEME.colors.cyan }]}>42</Text>
              <Text style={styles.telemetryLabel}>AUDIO MEMOS</Text>
            </View>
            <View style={styles.telemetryCol}>
              <Text style={[styles.telemetryNumber, { color: THEME.colors.accent }]}>118</Text>
              <Text style={styles.telemetryLabel}>PHOTOS</Text>
            </View>
          </View>

          {/* Sync on Wi-Fi Only Toggle */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextGroup}>
              <Text style={styles.toggleLabel}>Sync on Wi-Fi Only</Text>
              <Text style={styles.toggleSub}>Conserve cellular bandwidth for high-res media</Text>
            </View>
            <Switch
              value={wifiOnlySync}
              onValueChange={setWifiOnlySync}
              trackColor={{ false: THEME.colors.surfaceVariant, true: THEME.colors.accent }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Action Button: Force Backup */}
          <Pressable
            style={styles.forceBackupBtn}
            onPress={handleBackupNow}
            disabled={driveLoading}
          >
            <Ionicons name="sync-outline" size={17} color={THEME.colors.textPrimary} />
            <Text style={styles.forceBackupBtnText}>
              {driveLoading ? "TRANSMITTING DELTAS..." : "Force Backup Now"}
            </Text>
          </Pressable>

          {/* Backup History Snapshots if connected */}
          {driveStatus.connected && backups.length > 0 && (
            <View style={styles.backupHistoryBox}>
              <Text style={styles.backupHistoryTitle}>SNAPSHOT ARCHIVES ({backups.length})</Text>
              {backups.slice(0, 3).map((b) => (
                <View key={b.id} style={styles.backupItem}>
                  <View style={styles.backupItemText}>
                    <Text style={styles.backupFilename}>{b.filename}</Text>
                    <Text style={styles.backupMeta}>
                      {new Date(b.createdAt).toLocaleDateString()} • {b.entryCount} entries • {Math.round(b.sizeBytes / 1024)} KB
                    </Text>
                  </View>
                  <Pressable
                    style={styles.restorePill}
                    onPress={() => handlePreviewRestore(b.id)}
                  >
                    <Ionicons name="refresh-outline" size={12} color={THEME.colors.accent} />
                    <Text style={styles.restorePillText}>Restore</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Google Calendar Context (Phase 8) */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>SCHEDULE CONTEXT (READ-ONLY)</Text>
        <View style={styles.card}>
          <View style={styles.syncHeaderRow}>
            <View style={styles.syncLeftGroup}>
              <View style={styles.syncIconBox}>
                <Ionicons name="calendar-outline" size={22} color={THEME.colors.cyan} />
              </View>
              <View style={styles.syncTitleGroup}>
                <Text style={styles.syncTitle}>Google Calendar</Text>
                <Text style={styles.calendarSub}>
                  {calendarStatus.connected
                    ? `Connected (${calendarStatus.providerAccountId || "Account"})`
                    : "Read-only agenda context for Today reflection"}
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.syncConnectBtn,
                calendarStatus.connected && styles.syncConnectBtnDisconnect,
              ]}
              onPress={calendarStatus.connected ? handleDisconnectCalendar : handleConnectCalendar}
              disabled={calendarLoading}
            >
              <Text
                style={[
                  styles.syncConnectBtnText,
                  calendarStatus.connected && styles.syncConnectBtnTextDisconnect,
                ]}
              >
                {calendarStatus.connected ? "Disconnect" : "Connect"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Section 3: Media Storage Breakdown / Local Cache Allocation */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionHeading}>LOCAL CACHE ALLOCATION</Text>
          <Text style={styles.sectionHeadingSub}>
            {audioOptimized ? "146 MB" : "170 MB"} / 2.0 GB
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.storageMeterTop}>
            <Text style={styles.storageUsedBig}>
              {audioOptimized ? "146 MB" : "170 MB"}{" "}
              <Text style={styles.storageUsedSub}>Used</Text>
            </Text>
            <Text style={styles.storageOccupiedPct}>
              {audioOptimized ? "7.3% Occupied" : "8.5% Occupied"}
            </Text>
          </View>

          {/* Segmented Meter Bar */}
          <View style={styles.segmentedMeterTrack}>
            <View style={[styles.meterSegment, { width: "3%", backgroundColor: THEME.colors.rose }]} />
            <View
              style={[
                styles.meterSegment,
                {
                  width: audioOptimized ? "16%" : "28%",
                  backgroundColor: THEME.colors.cyan,
                },
              ]}
            />
            <View style={[styles.meterSegment, { width: "69%", backgroundColor: THEME.colors.accent }]} />
          </View>

          {/* Storage Legend Details */}
          <View style={styles.storageLegendList}>
            <View style={styles.storageLegendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.rose }]} />
                <Text style={styles.legendTitle}>Structured Text Data</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendCount}>184 DOCS</Text>
                <Text style={styles.legendSize}>2 MB</Text>
              </View>
            </View>

            <View style={styles.storageLegendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.cyan }]} />
                <Text style={styles.legendTitle}>Acoustic Recordings</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendCount}>42 CLIPS</Text>
                <Text style={styles.legendSize}>{audioOptimized ? "24 MB" : "48 MB"}</Text>
              </View>
            </View>

            <View style={styles.storageLegendItem}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.accent }]} />
                <Text style={styles.legendTitle}>Visual Attachments</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendCount}>118 IMGS</Text>
                <Text style={styles.legendSize}>120 MB</Text>
              </View>
            </View>

            <View style={[styles.storageLegendItem, { opacity: 0.55 }]}>
              <View style={styles.legendLeft}>
                <View style={[styles.legendDot, { backgroundColor: THEME.colors.surfaceVariant }]} />
                <Text style={styles.legendTitle}>Allocated Reserve</Text>
              </View>
              <View style={styles.legendRight}>
                <Text style={styles.legendCount}>AVAILABLE</Text>
                <Text style={styles.legendSize}>{audioOptimized ? "1.85 GB" : "1.83 GB"}</Text>
              </View>
            </View>
          </View>

          {/* Optimization Tool */}
          <Pressable
            style={styles.optimizeBtn}
            onPress={() => setAudioOptimized((o) => !o)}
          >
            <View style={styles.optimizeLeft}>
              <Ionicons name="sparkles-outline" size={17} color={THEME.colors.accent} />
              <Text style={styles.optimizeTitle}>Optimize Audio Files (AAC-HE)</Text>
            </View>
            <View
              style={[
                styles.savingsBadge,
                audioOptimized && styles.savingsBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.savingsBadgeText,
                  audioOptimized && styles.savingsBadgeTextActive,
                ]}
              >
                {audioOptimized ? "OPTIMIZED (-24 MB)" : "EST. -24 MB"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Section 4: Data Portability & Sovereign Archives */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeading}>DATA PORTABILITY & SOVEREIGN ARCHIVES</Text>
        <View style={styles.cardOverflow}>
          {/* Export JSON */}
          <Pressable style={styles.archiveRow} onPress={handleExportJSON}>
            <View style={styles.archiveRowLeft}>
              <View style={styles.archiveIconBox}>
                <Ionicons name="code-download-outline" size={18} color={THEME.colors.textPrimary} />
              </View>
              <View style={styles.archiveTextGroup}>
                <Text style={styles.archiveTitle}>Export Raw JSON Archive</Text>
                <Text style={styles.archiveSub}>Full schema, neural embeddings & metadata</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={THEME.colors.textTertiary} />
          </Pressable>

          <View style={styles.cardDivider} />

          {/* Export Markdown */}
          <Pressable style={styles.archiveRow} onPress={handleExportMarkdown}>
            <View style={styles.archiveRowLeft}>
              <View style={styles.archiveIconBox}>
                <Ionicons name="document-text-outline" size={18} color={THEME.colors.textPrimary} />
              </View>
              <View style={styles.archiveTextGroup}>
                <Text style={styles.archiveTitle}>Export Markdown & Media Bundle</Text>
                <Text style={styles.archiveSub}>Interoperable archive with pristine raw media</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={THEME.colors.textTertiary} />
          </Pressable>

          <View style={styles.cardDivider} />

          {/* Import Archives */}
          <Pressable style={styles.archiveRow} onPress={handleOpenImportModal}>
            <View style={styles.archiveRowLeft}>
              <View style={styles.archiveIconBox}>
                <Ionicons name="archive-outline" size={18} color={THEME.colors.textPrimary} />
              </View>
              <View style={styles.archiveTextGroup}>
                <Text style={styles.archiveTitle}>Import External Archives</Text>
                <Text style={styles.archiveSub}>Parse Day One JSON, Apple Journal or MyDay backup</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={THEME.colors.textTertiary} />
          </Pressable>
        </View>
      </View>

      {/* Section 5: Critical Partition Controls (Danger Zone) */}
      <View style={styles.sectionWrap}>
        <Text style={[styles.sectionHeading, { color: THEME.colors.rose }]}>
          CRITICAL PARTITION CONTROLS
        </Text>
        <View style={styles.cardOverflow}>
          {/* Flush Audio Cache */}
          <Pressable
            style={styles.archiveRow}
            onPress={() => {
              setCachePurged(true);
              setExportNotice("Local audio waveform cache purged.");
              setTimeout(() => setExportNotice(null), 3000);
            }}
          >
            <View style={styles.archiveRowLeft}>
              <View style={[styles.archiveIconBox, { backgroundColor: THEME.colors.surfaceContainerHighest }]}>
                <Ionicons name="trash-bin-outline" size={18} color={THEME.colors.rose} />
              </View>
              <View style={styles.archiveTextGroup}>
                <Text style={styles.archiveTitle}>Clear Local Audio Cache</Text>
                <Text style={styles.archiveSub}>Removes cached waveform streams; re-downloads on tap</Text>
              </View>
            </View>
            <Text style={styles.recoverableText}>
              {cachePurged ? "PURGED (0 MB)" : "48 MB"}
            </Text>
          </Pressable>

          <View style={styles.cardDivider} />

          {/* Total Wipe Data & Encryption Keys */}
          <Pressable
            style={[styles.archiveRow, styles.wipeRow]}
            onPress={handleDeleteAccountData}
          >
            <View style={styles.archiveRowLeft}>
              <View style={[styles.archiveIconBox, { backgroundColor: THEME.colors.roseMuted }]}>
                <Ionicons name="nuclear-outline" size={18} color={THEME.colors.rose} />
              </View>
              <View style={styles.archiveTextGroup}>
                <Text style={[styles.archiveTitle, { color: THEME.colors.rose }]}>
                  Delete All Data & Encryption Keys
                </Text>
                <Text style={styles.wipeSub}>
                  Permanent, irreversible zero-overwrite destruction
                </Text>
              </View>
            </View>
            <Ionicons name="alert-circle-outline" size={19} color={THEME.colors.rose} />
          </Pressable>
        </View>
      </View>

      {/* Diagnostic Footnote */}
      <View style={styles.footnoteSection}>
        <Text style={styles.footnoteEngine}>MYDAY ENGINE V2.4.19-PROD</Text>
        <Text style={styles.footnoteStorage}>DEVICE STORAGE TOTAL: 256.0 GB (192.4 GB FREE)</Text>
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
              <Ionicons name="cloud-download-outline" size={22} color={THEME.colors.accent} />
              <Text style={styles.modalTitle}>Restore Snapshot</Text>
            </View>

            {previewData && (
              <>
                <Text style={styles.modalBody}>
                  Snapshot contains{" "}
                  <Text style={{ color: THEME.colors.textPrimary, fontWeight: "700" }}>
                    {previewData.entryCount} entries
                  </Text>{" "}
                  from {new Date(previewData.createdAt).toLocaleDateString()}.
                </Text>
                <Text style={styles.modalSub}>
                  Select resolution strategy for existing records:
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

      {/* Import Modal */}
      <Modal
        visible={importModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTitleRow}>
              <Ionicons name="archive-outline" size={22} color={THEME.colors.accent} />
              <Text style={styles.modalTitle}>Import External Archive</Text>
            </View>

            <TextInput
              style={styles.importInput}
              multiline
              numberOfLines={6}
              placeholder="Paste raw JSON export archive content..."
              placeholderTextColor={THEME.colors.textTertiary}
              value={importJsonInput}
              onChangeText={setImportJsonInput}
            />

            {!importPreview ? (
              <Pressable
                style={styles.modalBtnMerge}
                onPress={handlePreviewImport}
                disabled={importLoading}
              >
                <Text style={styles.modalBtnMergeText}>
                  {importLoading ? "Validating Schema..." : "Validate & Preview Archive"}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalBtnMerge}
                  onPress={() => handleConfirmImport("merge")}
                  disabled={importLoading}
                >
                  <Text style={styles.modalBtnMergeText}>
                    Merge ({importPreview.totalEntries} Entries)
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.modalBtnOverwrite}
                  onPress={() => handleConfirmImport("overwrite")}
                  disabled={importLoading}
                >
                  <Text style={styles.modalBtnOverwriteText}>Overwrite</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={styles.modalCancelBtn}
              onPress={() => setImportModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Close</Text>
            </Pressable>
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
    paddingHorizontal: THEME.spacing.gutter,
    paddingTop: 12,
    paddingBottom: 48,
    gap: 20,
  },
  toastNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.emerald,
  },
  toastNoticeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.emerald,
  },
  profileSectionCard: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: THEME.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 14,
  },
  profileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  onlineBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.cyan,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  profileName: {
    fontFamily: THEME.typography.title,
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  profileEmail: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    color: THEME.colors.textSecondary,
  },
  cryptoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  cryptoKey: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.cyan,
    letterSpacing: 0.5,
  },
  cryptoDot: {
    color: THEME.colors.textTertiary,
    fontSize: 10,
  },
  cryptoAlgo: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    color: THEME.colors.textTertiary,
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: THEME.colors.surfaceContainer,
    padding: 10,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  securityIconBox: {
    width: 32,
    height: 32,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  securityTextGroup: {
    flex: 1,
  },
  securityTitle: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.cyan,
    letterSpacing: 0.8,
  },
  securitySub: {
    fontFamily: THEME.typography.body,
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionHeading: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
  },
  sectionHeadingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  sectionHeadingSub: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  card: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: THEME.radius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 14,
  },
  cardOverflow: {
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: THEME.radius.xl,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: "hidden",
  },
  cardDivider: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginHorizontal: 14,
  },
  syncHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  syncLeftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  syncIconBox: {
    width: 40,
    height: 40,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  syncTitleGroup: {
    flex: 1,
  },
  syncTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  syncStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  syncStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncStatusText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.cyan,
  },
  calendarSub: {
    fontFamily: THEME.typography.body,
    fontSize: 11,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  syncConnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.accent,
  },
  syncConnectBtnDisconnect: {
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  syncConnectBtnText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textInverse,
  },
  syncConnectBtnTextDisconnect: {
    color: THEME.colors.rose,
  },
  telemetryGrid: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  telemetryCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  telemetryNumber: {
    fontFamily: THEME.typography.mono,
    fontSize: 17,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  telemetryLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  toggleLabel: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    fontWeight: "500",
    color: THEME.colors.textPrimary,
  },
  toggleSub: {
    fontFamily: THEME.typography.body,
    fontSize: 11,
    color: THEME.colors.textTertiary,
    marginTop: 1,
  },
  forceBackupBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 40,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  forceBackupBtnText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
    letterSpacing: 0.8,
  },
  backupHistoryBox: {
    gap: 8,
    paddingTop: 4,
  },
  backupHistoryTitle: {
    fontFamily: THEME.typography.mono,
    fontSize: 9,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  backupItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainer,
  },
  backupItemText: {
    flex: 1,
    paddingRight: 8,
  },
  backupFilename: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textPrimary,
  },
  backupMeta: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    color: THEME.colors.textTertiary,
  },
  restorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHighest,
  },
  restorePillText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.accent,
  },
  storageMeterTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  storageUsedBig: {
    fontFamily: THEME.typography.title,
    fontSize: 20,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  storageUsedSub: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textTertiary,
    fontWeight: "400",
  },
  storageOccupiedPct: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    color: THEME.colors.cyan,
  },
  segmentedMeterTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: THEME.colors.surfaceContainerHighest,
    flexDirection: "row",
    overflow: "hidden",
    gap: 2,
    padding: 1.5,
  },
  meterSegment: {
    height: "100%",
    borderRadius: 2,
  },
  storageLegendList: {
    gap: 8,
  },
  storageLegendItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendTitle: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textPrimary,
  },
  legendRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legendCount: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    color: THEME.colors.textTertiary,
  },
  legendSize: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    color: THEME.colors.textPrimary,
    width: 48,
    textAlign: "right",
  },
  optimizeBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderRadius: THEME.radius.lg,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  optimizeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optimizeTitle: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.accent,
    letterSpacing: 0.5,
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHigh,
  },
  savingsBadgeActive: {
    backgroundColor: THEME.colors.cyanMuted,
  },
  savingsBadgeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
  },
  savingsBadgeTextActive: {
    color: THEME.colors.cyan,
  },
  archiveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
  },
  archiveRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  archiveIconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainer,
    alignItems: "center",
    justifyContent: "center",
  },
  archiveTextGroup: {
    flex: 1,
  },
  archiveTitle: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    fontWeight: "500",
    color: THEME.colors.textPrimary,
  },
  archiveSub: {
    fontFamily: THEME.typography.body,
    fontSize: 11,
    color: THEME.colors.textTertiary,
    marginTop: 1,
  },
  recoverableText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textTertiary,
  },
  wipeRow: {
    backgroundColor: "rgba(244, 63, 94, 0.05)",
  },
  wipeSub: {
    fontFamily: THEME.typography.body,
    fontSize: 11,
    color: "rgba(255, 178, 183, 0.7)",
  },
  footnoteSection: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 24,
    gap: 4,
  },
  footnoteEngine: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textTertiary,
    letterSpacing: 0.8,
  },
  footnoteStorage: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    color: THEME.colors.surfaceVariant,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(8, 9, 12, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderRadius: THEME.radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 12,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 17,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  modalBody: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textSecondary,
    lineHeight: 18,
  },
  modalSub: {
    fontFamily: THEME.typography.body,
    fontSize: 12,
    color: THEME.colors.textTertiary,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalBtnMerge: {
    flex: 1,
    backgroundColor: THEME.colors.accent,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: "center",
  },
  modalBtnMergeText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textInverse,
  },
  modalBtnOverwrite: {
    flex: 1,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  modalBtnOverwriteText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.rose,
  },
  modalCancelBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  modalCancelBtnText: {
    fontFamily: THEME.typography.mono,
    fontSize: 12,
    color: THEME.colors.textTertiary,
  },
  importInput: {
    backgroundColor: THEME.colors.surfaceContainer,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    padding: 10,
    color: THEME.colors.textPrimary,
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    textAlignVertical: "top",
    minHeight: 120,
  },
});
