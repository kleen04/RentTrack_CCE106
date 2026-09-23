import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { useLocalSearchParams, router } from "expo-router";

import { vehicles } from "../../data/vehicles";
import { Colors } from "../../constants/colors";

export default function VehicleDetails() {
  const { id } = useLocalSearchParams();

  const vehicle = vehicles.find(
    (item) => item.id === id
  );

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Vehicle not found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>VEHICLE</Text>

      <Text style={styles.title}>
        {vehicle.model}
      </Text>

      <View style={styles.card}>
        <Text style={styles.brand}>
          {vehicle.brand}
        </Text>

        <Text style={styles.plate}>
          {vehicle.plateNumber}
        </Text>

        <Text style={styles.price}>
          PHP {vehicle.pricePerDay.toLocaleString()}
          {" / day"}
        </Text>

        <Text style={styles.status}>
          {vehicle.status}
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
    marginBottom: 40,
  },

  label: {
    color: Colors.lime,
    fontSize: 10,
    fontWeight: "800",
  },

  title: {
    color: Colors.white,
    fontSize: 30,
    marginTop: 5,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 20,
    marginTop: 25,
  },

  brand: {
    color: Colors.muted,
    fontSize: 11,
  },

  plate: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },

  price: {
    color: Colors.lime,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 20,
  },

  status: {
    color: Colors.lime,
    marginTop: 20,
  },

  text: {
    color: Colors.white,
  },
});