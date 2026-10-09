import { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";

import AccountPage, { accountPageStyles } from "../components/AccountPage";
import { Colors } from "../constants/colors";
import { useAuth } from "../context/AuthContext";
import { seedDemoData } from "../services/database";

export default function Settings() {
  const { admin } = useAuth();
  const db = useSQLiteContext();
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  if (!admin) return <Redirect href="/(auth)/signin" />;

  const resetDemoData = async () => {
    setIsResettingDemo(true);
    try {
      await seedDemoData(db);
      if (Platform.OS === "web") {
        globalThis.alert("The sample records have been restored.");
      } else {
        Alert.alert("Sample records restored", "The sample records have been restored.");
      }
    } catch (error) {
      const message = error?.message || "Please try again.";
      if (Platform.OS === "web") {
        globalThis.alert(`Could not restore sample records: ${message}`);
      } else {
        Alert.alert("Could not restore sample records", message);
      }
    } finally {
      setIsResettingDemo(false);
    }
  };

  const confirmDemoDataReset = () => {
    const message =
      "This will replace all saved vehicles, customers, bookings, and payments with the sample records. This cannot be undone.";
    if (Platform.OS === "web") {
      if (globalThis.confirm(`Restore sample records?\n\n${message}`)) {
        void resetDemoData();
      }
      return;
    }

    Alert.alert("Restore sample records?", message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore sample records",
        style: "destructive",
        onPress: () => void resetDemoData(),
      },
    ]);
  };

  return (
    <AccountPage title="Settings">
      <ScrollView contentContainerStyle={accountPageStyles.content}>
        <View style={accountPageStyles.card}>
          <Text style={accountPageStyles.sectionLabel}>DATA MANAGEMENT</Text>
          <Text style={styles.title}>Restore sample records</Text>
          <Text style={accountPageStyles.bodyText}>
            Replace all saved vehicles, customers, bookings, and payments with
            the original sample records. This action cannot be undone.
          </Text>
          <TouchableOpacity
            style={[styles.restoreButton, isResettingDemo && styles.disabledButton]}
            onPress={confirmDemoDataReset}
            disabled={isResettingDemo}
            accessibilityRole="button"
            accessibilityLabel="Restore sample records"
          >
            <Ionicons name="refresh-outline" size={18} color={Colors.warning} />
            <Text style={styles.restoreButtonText}>
              {isResettingDemo ? "Restoring sample records..." : "Restore sample records"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  restoreButton: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  disabledButton: {
    opacity: 0.6,
  },
  restoreButtonText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },
});
