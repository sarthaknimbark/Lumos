import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { THEME } from "../../src/theme";

interface TabIconProps {
  focused: boolean;
  outlineName: keyof typeof Ionicons.glyphMap;
  filledName: keyof typeof Ionicons.glyphMap;
}

function TabIcon({ focused, outlineName, filledName }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconFocused]}>
      <Ionicons
        name={focused ? filledName : outlineName}
        size={21}
        color={focused ? THEME.colors.accent : THEME.colors.textSecondary}
      />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: THEME.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: THEME.colors.border,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: "600",
          color: THEME.colors.textPrimary,
          letterSpacing: -0.2,
        },
        tabBarActiveTintColor: THEME.colors.accent,
        tabBarInactiveTintColor: THEME.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: THEME.colors.background,
          borderTopWidth: 1,
          borderTopColor: THEME.colors.border,
          height: Platform.OS === "ios" ? 86 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          headerTitle: "Today",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="sunny-outline"
              filledName="sunny"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Stream",
          headerTitle: "Timeline Stream",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="time-outline"
              filledName="time"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          headerTitle: "Vault Search",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="search-outline"
              filledName="search"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Vault",
          headerTitle: "Vault Storage & Settings",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              outlineName="shield-checkmark-outline"
              filledName="shield-checkmark"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 32,
    borderRadius: THEME.radius.md,
  },
  iconFocused: {
    backgroundColor: THEME.colors.accentMuted,
  },
});
