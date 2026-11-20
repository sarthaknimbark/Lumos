import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { THEME, THEME_ENERGIES } from "../theme";

interface EnergySelectorProps {
  value: number | null;
  onChange: (level: number) => void;
  disabled?: boolean;
}

export function EnergySelector({ value, onChange, disabled }: EnergySelectorProps) {
  return (
    <View style={styles.container}>
      {THEME_ENERGIES.map((item) => {
        const isSelected = value === item.level;
        return (
          <Pressable
            key={item.level}
            disabled={disabled}
            style={[
              styles.card,
              isSelected ? styles.cardSelected : styles.cardUnselected,
            ]}
            onPress={() => onChange(item.level)}
          >
            {/* Segmented signal bars */}
            <View style={styles.barsContainer}>
              {[1, 2, 3, 4, 5].map((barIndex) => {
                const isBarActive = barIndex <= item.activeBars;
                return (
                  <View
                    key={barIndex}
                    style={[
                      styles.bar,
                      { height: 4 + barIndex * 2.5 },
                      isBarActive
                        ? isSelected
                          ? styles.barActiveSelected
                          : styles.barActive
                        : styles.barInactive,
                    ]}
                  />
                );
              })}
            </View>
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
  card: {
    flex: 1,
    minWidth: 58,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
  },
  cardUnselected: {
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surfaceSubtle,
  },
  cardSelected: {
    borderColor: THEME.colors.accent,
    backgroundColor: THEME.colors.accentMuted,
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2.5,
    height: 18,
    marginBottom: 6,
  },
  bar: {
    width: 3.5,
    borderRadius: 1.5,
  },
  barActive: {
    backgroundColor: THEME.colors.textSecondary,
  },
  barActiveSelected: {
    backgroundColor: THEME.colors.accent,
  },
  barInactive: {
    backgroundColor: THEME.colors.borderStrong,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  labelUnselected: {
    color: THEME.colors.textSecondary,
  },
  labelSelected: {
    color: THEME.colors.accent,
  },
});
