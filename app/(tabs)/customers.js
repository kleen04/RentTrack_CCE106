import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import Header from "../../components/header";
import SearchBar from "../../components/searchbar";
import CustomerCard from "../../components/customercard";
import { getCustomers } from "../../services/database";
import { Colors } from "../../constants/colors";

export default function Customers() {
  const db = useSQLiteContext();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;
    const loadCustomers = () => {
      getCustomers(db)
        .then((rows) => {
          if (isActive) {
            setCustomers(rows);
            setLoadError("");
          }
        })
        .catch((error) => {
          if (isActive) setLoadError(error?.message || "Customers could not be loaded.");
        })
        .finally(() => {
          if (isActive) setIsLoading(false);
        });
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "customers" || event.tableName === "bookings") {
        loadCustomers();
      }
    });
    loadCustomers();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Header label="CLIENT RECORDS" title="Customers" fill />
          <TouchableOpacity
            style={styles.add}
            onPress={() => router.push("/customer/add")}
            accessibilityRole="button"
            accessibilityLabel="Add customer"
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>
        <SearchBar placeholder="Search customer" />
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ALL CUSTOMERS</Text>
          <Text style={styles.count}>{String(customers.length).padStart(2, "0")} CUSTOMERS</Text>
        </View>
        <View style={styles.list}>
          {isLoading && <Text style={styles.message}>Loading customer records…</Text>}
          {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onPress={() =>
                router.push({
                  pathname: "/customer/[id]",
                  params: { id: String(customer.id) },
                })
              }
            />
          ))}
          {!isLoading && !loadError && !customers.length && (
            <Text style={styles.message}>No customers yet. Add a customer to get started.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 30 },
  header: { flexDirection: "row", justifyContent: "space-between" },
  add: { width: 42, height: 42, backgroundColor: Colors.primary, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  addText: { fontSize: 25, color: Colors.background },
  section: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, marginBottom: 10 },
  sectionTitle: { color: "#B8C8C0", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  count: { color: Colors.muted, fontSize: 9 },
  list: { borderRadius: 12, overflow: "hidden" },
  message: { color: Colors.muted, fontSize: 11, textAlign: "center", paddingVertical: 24 },
  error: { color: Colors.warning, fontSize: 10, paddingVertical: 14 },
});
