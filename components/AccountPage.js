import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors } from "../constants/colors";

export default function AccountPage({ title, children }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
      {children}
    </View>
  );
}

export const accountPageStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 32,
  },
  card: {
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  sectionLabel: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  bodyText: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },
  fieldLabel: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  fieldValue: {
    color: Colors.white,
    fontSize: 15,
    marginBottom: 18,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 24,
  },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  title: {
    flex: 1,
    color: Colors.white,
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 14,
  },
  headerSpacer: {
    width: 40,
  },
});
