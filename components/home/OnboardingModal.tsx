import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Colors } from "../../constants/Colors";

interface OnboardingModalProps {
  visible: boolean;
  userName: string;
  updateUserName: (name: string) => void;
  onClose: () => void;
}

export const OnboardingModal = ({
  visible,
  userName,
  updateUserName,
  onClose,
}: OnboardingModalProps) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.onboardingOverlay}
      >
        <View style={styles.onboardingContent}>
          <Text style={styles.onboardingTitle}>Welcome to HabitMarket</Text>
          <Text style={styles.onboardingText}>
            Every habit you complete adds to your &quot;Daily Candle&quot;.
            {"\n\n"}
            <Text style={{ color: Colors.success }}>Green Candle</Text>
            <Text style={styles.textPlain}> = Productive Day.{"\n"}</Text>
            <Text style={{ color: Colors.error }}>Red Candle</Text>
            <Text style={styles.textPlain}> = Slump.{"\n\n"}</Text>
            Treat your life like a stock chart. Keep the trend bullish!
          </Text>

          <View style={{ width: "100%", marginBottom: 20 }}>
            <Text style={styles.label}>What should we call you?</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Trader, Builder, Yash..."
              placeholderTextColor={Colors.textMuted}
              value={userName} // Bind to context variable
              onChangeText={updateUserName}
            />
          </View>

          <Pressable style={styles.onboardingBtn} onPress={onClose}>
            <Text style={styles.onboardingBtnText}>Let&apos;s Trade</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  onboardingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  onboardingContent: {
    backgroundColor: Colors.surface,
    padding: 30,
    borderRadius: 20,
    width: "100%",
    alignItems: "center",
  },
  onboardingTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  onboardingText: {
    color: Colors.textSecondary,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 30,
  },
  textPlain: { color: Colors.textSecondary },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    color: Colors.text,
    padding: 15,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  onboardingBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  onboardingBtnText: { color: Colors.white, fontWeight: "bold", fontSize: 16 },
});
