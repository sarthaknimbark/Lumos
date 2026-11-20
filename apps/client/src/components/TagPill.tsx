import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { THEME } from "../theme";

interface TagPillProps {
  label: string;
  isSelected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

export function TagPill({ label, isSelected, onPress, onRemove }: TagPillProps) {
  return (
    <Pressable
      style={[
        styles.pill,
        isSelected ? styles.pillSelected : styles.pillUnselected,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.text,
          isSelected ? styles.textSelected : styles.textUnselected,
        ]}
      >
        #{label}
      </Text>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={6} style={styles.removeBtn}>
          <Ionicons name="close" size={13} color={THEME.colors.textSecondary} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
  },
  pillUnselected: {
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  pillSelected: {
    borderColor: THEME.colors.accent,
    backgroundColor: THEME.colors.accentMuted,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
  textUnselected: {
    color: THEME.colors.textSecondary,
  },
  textSelected: {
    color: THEME.colors.textPrimary,
    fontWeight: "600",
  },
  removeBtn: {
    marginLeft: 5,
  },
});
