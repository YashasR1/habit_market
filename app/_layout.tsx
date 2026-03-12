import FontAwesome from "@expo/vector-icons/FontAwesome";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import "react-native-reanimated";
import { View, Animated, StyleSheet, Text, Platform } from "react-native";
import { SQLiteProvider } from 'expo-sqlite';
import { Colors } from "../constants/Colors";
import { Zap } from "lucide-react-native";
import { initDB } from "../context/db";

import { HabitProvider, useHabits } from "../context/HabitContext";
import { SyncProvider, SyncContext } from "../context/SyncContext";
import { PodProvider, usePod } from "../context/PodContext";

import { GestureHandlerRootView } from "react-native-gesture-handler";

// Initialize Firebase
import "../firebaseConfig";

// Dummy provider to bypass the real SyncProvider which depends on expo-sqlite hooks
const WebSyncProvider = ({ children }: { children: React.ReactNode }) => (
  <SyncContext.Provider value={{ isOnline: true, isSyncing: false, triggerSync: () => {} }}>
    {children}
  </SyncContext.Provider>
);

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// ...

// Define a custom theme that matches our app's colors
const CustomTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.background, // #0F172A
    card: Colors.surface, // #1E293B (for headers/tab bars if standard)
    text: Colors.text,
    border: Colors.border,
    primary: Colors.primary,
  },
};

function LoadingScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={{ transform: [{ scale: pulseAnim }], opacity: pulseAnim }}
      >
        <Zap color={Colors.primary} size={64} fill={Colors.primary} />
      </Animated.View>
      <Text style={styles.loadingText}>MARHABS</Text>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={CustomTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="profile"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name="weekly-review"
          options={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

function AppContent() {
  const { isLoaded: isHabitsLoaded } = useHabits();
  const { isLoaded: isPodLoaded } = usePod();

  if (!isHabitsLoaded || !isPodLoaded) {
    return <LoadingScreen />;
  }

  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {Platform.OS === 'web' ? (
        <WebSyncProvider>
          <HabitProvider>
            <PodProvider>
              <AppContent />
            </PodProvider>
          </HabitProvider>
        </WebSyncProvider>
      ) : (
        <SQLiteProvider databaseName="habitmarket.db" onInit={initDB}>
          <SyncProvider>
            <HabitProvider>
              <PodProvider>
                <AppContent />
              </PodProvider>
            </HabitProvider>
          </SyncProvider>
        </SQLiteProvider>
      )}
    </GestureHandlerRootView>
  );

}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: Colors.text,
    marginTop: 20,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 4,
  },
});
