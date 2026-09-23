import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { customers } from "../../data/customers";
import { Colors } from "../../constants/colors";

export default function CustomerDetails() {
  const { id } = useLocalSearchParams();

  const customer = customers.find(
    (item) => item.id === id
  );

  if (!customer) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Customer not found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>
        CUSTOMER
      </Text>

      <Text style={styles.title}>
        {customer.name}
      </Text>

      <View style={styles.card}>
        <Text style={styles.phone}>
          {customer.phone}
        </Text>

        <Text style={styles.section}>
          TOTAL RENTALS
        </Text>

        <Text style={styles.rentals}>
          {customer.rentals}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 18,
  },

  back: {
    color: Colors.lime,
    marginBottom: 35,
  },

  label: {
    color: Colors.lime,
    fontSize: 10,
    fontWeight: "800",
  },

  title: {
    color: Colors.white,
    fontSize: 29,
    marginTop: 5,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 20,
    marginTop: 25,
  },

  phone: {
    color: Colors.muted,
  },

  section: {
    color: Colors.lime,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 25,
  },

  rentals: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 8,
  },

  text: {
    color: Colors.white,
  },
});