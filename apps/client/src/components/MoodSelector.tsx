import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { THEME, THEME_MOODS } from "../theme";

interface MoodSelectorProps {
  value: number | null;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export function MoodSelector({ value, onChange, disabled }: MoodSelectorProps) {
  return (
    <View style={styles.container}>
      {THEME_MOODS.map((item) => {
        const isSelected = value === item.level;
        return (
          <Pressable
            key={item.level}
            disabled={disabled}
            style={[
              styles.chip,
              isSelected ? [styles.chipSelected, { backgroundColor: item.accentColor }] : styles.chipUnselected,
            ]}
            onPress={() => onChange(item.level)}
          >
            <Ionicons
              name={isSelected ? item.iconFilled : item.iconOutline}
              size={18}
              color={isSelected ? THEME.colors.textInverse : THEME.colors.textSecondary}
              style={styles.icon}
            />
            <Text
              style={[
                styles.label,
                isSelected ? styles.labelSelected : styles.labelUnselected,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    flexWrap: "wrap",
    marginTop: THEME.spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: THEME.radius.full,
    borderWidth: 1,
    transitionProperty: "all",
  },
  chipUnselected: {
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  chipSelected: {
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  labelUnselected: {
    color: THEME.colors.textSecondary,
  },
  labelSelected: {
    color: THEME.colors.textInverse,
  },
});
