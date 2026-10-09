import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";

import AccountPage, { accountPageStyles } from "../components/AccountPage";
import { Colors } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

export default function About() {
  const { admin } = useAuth();
  if (!admin) return <Redirect href="/(auth)/signin" />;

  return (
    <AccountPage title="About us">
      <ScrollView contentContainerStyle={accountPageStyles.content}>
        <View style={styles.brandCard}>
          <View style={styles.logo}>
            <Ionicons name="car-sport-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.brand}>RentTrack</Text>
          <Text style={styles.version}>VERSION 1.0.0</Text>
        </View>

        <View style={accountPageStyles.card}>
          <Text style={accountPageStyles.sectionLabel}>ABOUT RENTTRACK</Text>
          <Text style={accountPageStyles.bodyText}>
            RentTrack helps rental teams manage their vehicles, customers,
            bookings, payments, and business reports in one place.
          </Text>
          <Text style={[accountPageStyles.bodyText, styles.localData]}>
            Your records are stored locally on this device and are not synced
            with other devices.
          </Text>
        </View>
      </ScrollView>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  brandCard: {
    alignItems: "center",
    paddingVertical: 30,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  logo: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: Colors.card,
    marginBottom: 14,
  },
  brand: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "700",
  },
  version: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 6,
  },
  localData: {
    marginTop: 12,
  },
});
