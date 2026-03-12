import React from "react";
import { Tabs } from "expo-router";
import { Home, Calendar, LineChart, PenTool } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { StyleSheet, Platform } from "react-native";
import { Colors } from "../../constants/Colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: "transparent", // Important for BlurView
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              style={StyleSheet.absoluteFill}
              tint="dark"
            />
          ) : (
            <BlurView
              intensity={30}
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(15, 23, 42, 0.9)" },
              ]}
              tint="dark"
            />
          ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="impact"
        options={{
          title: "Impact",
          tabBarIcon: ({ color }) => <LineChart color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="pod"
        options={{
          title: "POD",
          tabBarIcon: ({ color }) => <PenTool color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
