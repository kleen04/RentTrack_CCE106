import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import {
  createCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "../../services/database";

function normalizePhone(phone) {
  const compact = phone.trim().replace(/[\s()-]/g, "");
  if (/^09\d{9}$/.test(compact)) return `+63${compact.slice(1)}`;
  if (/^\+639\d{9}$/.test(compact)) return compact;
  return null;
}

export default function AddCustomer() {
  const db = useSQLiteContext();
  const params = useLocalSearchParams();
  const customerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(customerId);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!isEditing) return undefined;

    let isActive = true;
    getCustomerById(db, customerId)
      .then((customer) => {
        if (!isActive) return;
        if (!customer) {
          setLoadError("Customer record could not be found.");
          return;
        }
        setName(customer.name || "");
        setPhone(customer.phone || "");
        setEmail(customer.email || "");
      })
      .catch((error) => {
        if (isActive) {
          setLoadError(error?.message || "Customer record could not be loaded.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [customerId, db, isEditing]);

  const returnToCustomers = () => {
    if (router.canGoBack()) router.back();
    else if (isEditing) {
      router.replace({
        pathname: "/customer/[id]",
        params: { id: String(customerId) },
      });
    }
    else router.replace("/(tabs)/customers");
  };

  const saveCustomer = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanEmail = email.trim();
    const errors = {};
    if (!cleanName) errors.name = "Enter the customer's full name.";
    if (!cleanPhone) {
      errors.phone = "Enter a Philippine mobile number.";
    } else if (!normalizePhone(cleanPhone)) {
      errors.phone = "Use 11 digits starting with 09 or a +63 number.";
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaveError("");
    setIsSaving(true);
    try {
      const existingCustomers = await getCustomers(db);
      const normalizedPhone = normalizePhone(cleanPhone);
      const duplicate = existingCustomers.some(
        (customer) =>
          Number(customer.id) !== Number(customerId) &&
          customer.name.trim().toLocaleLowerCase() === cleanName.toLocaleLowerCase() &&
          normalizePhone(customer.phone || "") === normalizedPhone
      );
      if (duplicate) {
        setFieldErrors({ phone: "A customer with this name and phone number already exists." });
        return;
      }

      if (isEditing) {
        await updateCustomer(db, customerId, {
          name: cleanName,
          phone: cleanPhone,
          email: cleanEmail,
        });
        returnToCustomers();
        return;
      }
      await createCustomer(db, {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
      });
      Alert.alert("Customer added", `${cleanName} is now in the shared customer records.`, [
        { text: "View customers", onPress: returnToCustomers },
      ]);
    } catch (error) {
      const message = error?.message || "";
      if (message.includes("customers.phone")) {
        setFieldErrors({ phone: "This phone number is already in use." });
      } else if (message.includes("customers.email")) {
        setFieldErrors({ email: "This email address is already in use." });
      } else {
        setSaveError(message || "Customer details could not be saved. Please try again.");
      }
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
        <Text style={styles.title}>{isEditing ? "Edit customer" : "Add customer"}</Text>
        {isLoading ? <Text style={styles.message}>Loading customer details…</Text> : null}
        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          value={name}
          onChangeText={(value) => {
            setName(value);
            setFieldErrors((current) => ({ ...current, name: "" }));
          }}
          placeholder="Full name"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          autoCapitalize="words"
        />
        {fieldErrors.name ? <Text style={styles.error}>{fieldErrors.name}</Text> : null}
        <Text style={styles.inputLabel}>PHONE NUMBER</Text>
        <TextInput
          value={phone}
          onChangeText={(value) => {
            setPhone(value);
            setFieldErrors((current) => ({ ...current, phone: "" }));
          }}
          placeholder="e.g. +63 917 555 0182"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="phone-pad"
        />
        {fieldErrors.phone ? <Text style={styles.error}>{fieldErrors.phone}</Text> : null}
        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFieldErrors((current) => ({ ...current, email: "" }));
          }}
          placeholder="name@email.com"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {fieldErrors.email ? <Text style={styles.error}>{fieldErrors.email}</Text> : null}

        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
        {!isEditing ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>This customer will be available to select in new bookings, and their rental history will appear on their customer profile.</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.button, (isSaving || isLoading || Boolean(loadError)) && styles.disabled]}
          onPress={saveCustomer}
          disabled={isSaving || isLoading || Boolean(loadError)}
        >
          <Text style={styles.buttonText}>
            {isSaving
              ? isEditing ? "Saving changes…" : "Saving customer…"
              : isEditing ? "Save changes" : "Add customer"}
          </Text>
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
  message: { color: Colors.muted, fontSize: 11, marginTop: 8 },
  error: { color: Colors.danger, fontSize: 11, marginTop: 8 },
});
