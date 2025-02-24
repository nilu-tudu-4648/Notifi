import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: "absolute",
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Contacts"
        options={{
          title: "Contacts",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="CallLogsScreen"
        options={{
          title: "Call Logs",
          tabBarIcon: ({ color }) => (
            <Ionicons name="call-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="UninstallProtection"
        options={{
          title: "Uninstall Protection",
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-outline" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="IconToggle"
        options={{
          title: "Icon Toggle",
          tabBarIcon: ({ color }) => (
            <Ionicons name="apps-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AutoCallRecording"
        options={{
          title: "Auto Call Recording",
          tabBarIcon: ({ color }) => (
            <Ionicons name="recording" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
