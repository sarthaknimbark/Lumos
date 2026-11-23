import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PhotoAttachment } from "@myday/contracts";
import { THEME } from "../theme";

interface PhotoLightboxModalProps {
  visible: boolean;
  photos: PhotoAttachment[];
  initialIndex?: number;
  onClose: () => void;
  onSaveCaption?: (photoId: string, newCaption: string) => void;
}

export function PhotoLightboxModal({
  visible,
  photos,
  initialIndex = 0,
  onClose,
  onSaveCaption,
}: PhotoLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [caption, setCaption] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Sync index when initialIndex changes or modal opens
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    if (photos[initialIndex]) {
      setCaption(photos[initialIndex].caption || "");
    }
  }, [initialIndex, visible, photos]);

  if (!visible || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCaption(photos[currentIndex - 1]?.caption || "");
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCaption(photos[currentIndex + 1]?.caption || "");
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {/* Top Precision HUD Strip */}
        <View style={styles.topHud}>
          <Pressable
            style={styles.hudCircleBtn}
            onPress={onClose}
            hitSlop={10}
            accessibilityLabel="Close lightbox"
          >
            <Ionicons name="arrow-back" size={20} color={THEME.colors.textPrimary} />
          </Pressable>

          {/* Frame Index Badge */}
          <View style={styles.frameBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.frameText}>
              {currentIndex + 1} OF {photos.length}
            </Text>
          </View>

          {/* Utility Group */}
          <View style={styles.hudRightGroup}>
            <Pressable
              style={styles.hudCircleBtn}
              onPress={() => setIsFavorited((f) => !f)}
              hitSlop={10}
            >
              <Ionicons
                name={isFavorited ? "star" : "star-outline"}
                size={18}
                color={isFavorited ? THEME.colors.accent : THEME.colors.textSecondary}
              />
            </Pressable>
            <Pressable
              style={styles.hudCircleBtn}
              onPress={onClose}
              hitSlop={10}
            >
              <Ionicons name="close" size={20} color={THEME.colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Viewport Canvas */}
        <View style={styles.viewport}>
          <Pressable
            style={[styles.imageWrapper, isZoomed && styles.imageWrapperZoomed]}
            onPress={() => setIsZoomed((z) => !z)}
          >
            <Image
              source={{ uri: currentPhoto.url }}
              style={styles.mainImage}
              resizeMode={isZoomed ? "cover" : "contain"}
            />
          </Pressable>

          {/* Navigation Arrows for Multi-Photo */}
          {photos.length > 1 && (
            <View style={styles.navRow}>
              <Pressable
                style={[styles.arrowBtn, currentIndex === 0 && styles.arrowDisabled]}
                onPress={handlePrev}
                disabled={currentIndex === 0}
              >
                <Ionicons name="chevron-back" size={22} color={THEME.colors.textPrimary} />
              </Pressable>
              <Pressable
                style={[
                  styles.arrowBtn,
                  currentIndex === photos.length - 1 && styles.arrowDisabled,
                ]}
                onPress={handleNext}
                disabled={currentIndex === photos.length - 1}
              >
                <Ionicons name="chevron-forward" size={22} color={THEME.colors.textPrimary} />
              </Pressable>
            </View>
          )}
        </View>

        {/* Bottom Archival Instrument Panel */}
        <ScrollView
          style={styles.bottomSheet}
          contentContainerStyle={styles.bottomSheetContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Chronology & Filename */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={THEME.colors.cyan} />
                <Text style={styles.metaTitle} numberOfLines={1}>
                  {currentPhoto.filename || "Archival Capture"}
                </Text>
              </View>
              <Text style={styles.metaDate}>
                {new Date(currentPhoto.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })} • {new Date(currentPhoto.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>

            <View style={styles.badgeRaw}>
              <Text style={styles.badgeRawText}>RAW JPEG</Text>
            </View>
          </View>

          {/* Machined Optical Telemetry Strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.telemetryScroll}
            contentContainerStyle={styles.telemetryTrack}
          >
            <View style={styles.telemetryChip}>
              <Ionicons name="scan-outline" size={12} color={THEME.colors.cyan} />
              <Text style={styles.telemetryVal}>4032 × 3024</Text>
              <Text style={styles.telemetrySub}>12.2 MP</Text>
            </View>
            <View style={styles.telemetryChip}>
              <Ionicons name="camera-outline" size={12} color={THEME.colors.accent} />
              <Text style={styles.telemetryVal}>28mm</Text>
              <Text style={styles.telemetrySub}>ƒ/1.8</Text>
            </View>
            <View style={styles.telemetryChip}>
              <Ionicons name="speedometer-outline" size={12} color={THEME.colors.accent} />
              <Text style={styles.telemetryVal}>1/500s</Text>
            </View>
            <View style={styles.telemetryChip}>
              <Text style={[styles.telemetrySub, { color: THEME.colors.accent }]}>ISO</Text>
              <Text style={styles.telemetryVal}>64</Text>
            </View>
          </ScrollView>

          {/* Editable Field Log / Caption */}
          <View style={styles.captionContainer}>
            <View style={styles.captionHeader}>
              <Text style={styles.captionLabel}>FIELD LOG / EDITABLE CAPTION</Text>
              <Ionicons name="pencil-outline" size={13} color={THEME.colors.accent} />
            </View>
            <TextInput
              style={styles.captionInput}
              value={caption}
              onChangeText={(txt) => {
                setCaption(txt);
                onSaveCaption?.(currentPhoto.id, txt);
              }}
              placeholder="Add observation caption..."
              placeholderTextColor={THEME.colors.textTertiary}
              multiline
              numberOfLines={2}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    justifyContent: "space-between",
  },
  topHud: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.gutter,
    paddingTop: Platform.OS === "ios" ? 54 : 20,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: "rgba(17, 19, 26, 0.75)",
  },
  hudCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  frameBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.accent,
  },
  frameText: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
    letterSpacing: 1,
  },
  hudRightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapperZoomed: {
    transform: [{ scale: 1.25 }],
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  navRow: {
    position: "absolute",
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    pointerEvents: "box-none",
  },
  arrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(17, 19, 26, 0.7)",
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: {
    opacity: 0.25,
  },
  bottomSheet: {
    maxHeight: 280,
    backgroundColor: THEME.colors.surfaceContainerLow,
    borderTopLeftRadius: THEME.radius.xl,
    borderTopRightRadius: THEME.radius.xl,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  bottomSheetContent: {
    paddingHorizontal: THEME.spacing.gutter,
    paddingTop: 10,
    paddingBottom: 32,
  },
  dragHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.colors.border,
    alignSelf: "center",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metaLeft: {
    flex: 1,
    paddingRight: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  metaTitle: {
    fontFamily: THEME.typography.title,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.textPrimary,
  },
  metaDate: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textSecondary,
  },
  badgeRaw: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  badgeRawText: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.accent,
  },
  telemetryScroll: {
    marginBottom: 12,
  },
  telemetryTrack: {
    flexDirection: "row",
    gap: 8,
  },
  telemetryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  telemetryVal: {
    fontFamily: THEME.typography.mono,
    fontSize: 11,
    color: THEME.colors.textPrimary,
    fontWeight: "500",
  },
  telemetrySub: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    color: THEME.colors.textTertiary,
  },
  captionContainer: {
    padding: 12,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  captionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  captionLabel: {
    fontFamily: THEME.typography.mono,
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.textSecondary,
    letterSpacing: 0.8,
  },
  captionInput: {
    fontFamily: THEME.typography.body,
    fontSize: 13,
    color: THEME.colors.textPrimary,
    lineHeight: 18,
    padding: 0,
  },
});
