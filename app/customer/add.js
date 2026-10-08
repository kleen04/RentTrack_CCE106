import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import { createCustomer } from "../../services/database";

export default function AddCustomer() {
  const db = useSQLiteContext();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const returnToCustomers = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/customers");
  };

  const saveCustomer = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Enter the customer's full name.");
      return;
    }
    setIsSaving(true);
    try {
      await createCustomer(db, { name, phone, email });
      Alert.alert("Customer added", `${name.trim()} is now in the shared customer records.`, [
        { text: "View customers", onPress: returnToCustomers },
      ]);
    } catch (error) {
      Alert.alert("Could not add customer", error?.message || "Please check the customer details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={returnToCustomers}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.label}>CLIENT RECORDS</Text>
        <Text style={styles.title}>Add customer</Text>

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          autoCapitalize="words"
        />
        <Text style={styles.inputLabel}>PHONE NUMBER</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. +63 917 555 0182"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="phone-pad"
        />
        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.note}>
          <Text style={styles.noteText}>This customer will be available to select in new bookings, and their rental history will appear on their customer profile.</Text>
        </View>
        <TouchableOpacity style={[styles.button, isSaving && styles.disabled]} onPress={saveCustomer} disabled={isSaving}>
          <Text style={styles.buttonText}>{isSaving ? "Saving customer…" : "Add customer"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 35 },
  back: { color: Colors.primary, fontSize: 12, marginBottom: 35 },
  label: { color: Colors.primary, fontSize: 10, fontWeight: "800" },
  title: { color: Colors.white, fontSize: 28, fontWeight: "800", marginTop: 5, marginBottom: 23 },
  inputLabel: { color: "#B8C9C1", fontSize: 9, fontWeight: "800", marginBottom: 7, marginTop: 15 },
  input: { height: 49, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 14, color: Colors.white, fontSize: 12 },
  note: { backgroundColor: "#14251B", borderRadius: 9, padding: 12, marginTop: 18 },
  noteText: { color: "#B8C8C0", fontSize: 9, lineHeight: 14 },
  button: { height: 50, backgroundColor: Colors.primary, borderRadius: 9, justifyContent: "center", alignItems: "center", marginTop: 18 },
  disabled: { opacity: 0.65 },
  buttonText: { color: Colors.background, fontWeight: "900", fontSize: 11 },
});
