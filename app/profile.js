import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";

import AccountPage, { accountPageStyles } from "../components/AccountPage";
import { Colors } from "../constants/colors";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { admin } = useAuth();
  if (!admin) return <Redirect href="/(auth)/signin" />;

  return (
    <AccountPage title="Profile">
      <ScrollView contentContainerStyle={accountPageStyles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{admin.name}</Text>
          <Text style={styles.role}>RentTrack administrator</Text>
        </View>

        <View style={[accountPageStyles.card, styles.detailsCard]}>
          <Text style={accountPageStyles.sectionLabel}>ACCOUNT DETAILS</Text>
          <Text style={accountPageStyles.fieldLabel}>FULL NAME</Text>
          <Text style={accountPageStyles.fieldValue}>{admin.name}</Text>
          <Text style={accountPageStyles.fieldLabel}>EMAIL ADDRESS</Text>
          <Text style={[accountPageStyles.fieldValue, styles.lastField]}>
            {admin.email}
          </Text>
        </View>
      </ScrollView>
    </AccountPage>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 18,
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  avatar: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    backgroundColor: Colors.card,
    marginBottom: 14,
  },
  name: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: "700",
  },
  role: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 5,
  },
  detailsCard: {
    paddingBottom: 2,
  },
  lastField: {
    marginBottom: 12,
  },
});
