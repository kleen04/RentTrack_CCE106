import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";

import Header from "../../components/header";
import SearchBar from "../../components/searchbar";
import CustomerCard from "../../components/customercard";

import { customers } from "../../data/customers";
import { Colors } from "../../constants/colors";

export default function Customers() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Header
            label="CLIENT RECORDS"
            title="Customers"
          />

          <TouchableOpacity
            style={styles.add}
            onPress={() =>
              router.push("/customer/add")
            }
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        <SearchBar placeholder="Search customer" />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ALL CUSTOMERS
          </Text>

          <Text style={styles.count}>
            {customers.length} CUSTOMERS
          </Text>
        </View>

        <View style={styles.list}>
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  add: {
    width: 42,
    height: 42,
    backgroundColor: Colors.lime,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    fontSize: 25,
    color: Colors.black,
  },

  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#B8C8C0",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  count: {
    color: Colors.muted,
    fontSize: 9,
  },

  list: {
    borderRadius: 12,
    overflow: "hidden",
  },
});