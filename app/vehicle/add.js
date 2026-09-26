import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router } from "expo-router";

import { vehicles } from "../../data/vehicles";
import { Colors } from "../../constants/colors";

export default function AddVehicle() {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");

  const handleSave = () => {
    if (!brand || !model || !plateNumber || !pricePerDay) {
      Alert.alert("Missing info", "Palihug i-fill ang tanan fields.");
      return;
    }

    const newVehicle = {
      id: Date.now().toString(),
      brand,
      model,
      plateNumber,
      pricePerDay: Number(pricePerDay),
      status: "AVAILABLE",
      image: null,
    };

    vehicles.push(newVehicle);

    router.back();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>NEW VEHICLE</Text>

      <Text style={styles.title}>Add a vehicle</Text>

      <Text style={styles.inputLabel}>BRAND</Text>
      <TextInput
        placeholder="e.g. Toyota"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={brand}
        onChangeText={setBrand}
      />

      <Text style={styles.inputLabel}>MODEL</Text>
      <TextInput
        placeholder="e.g. Fortuner"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={model}
        onChangeText={setModel}
      />

      <Text style={styles.inputLabel}>PLATE NUMBER</Text>
      <TextInput
        placeholder="e.g. NCR 1912"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={plateNumber}
        onChangeText={setPlateNumber}
      />

      <Text style={styles.inputLabel}>PRICE PER DAY</Text>
      <TextInput
        placeholder="e.g. 4200"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={pricePerDay}
        onChangeText={setPricePerDay}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save vehicle</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  back: {
    color: Colors.primary,
    marginBottom: 40,
  },

  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  title: {
    color: Colors.white,
    fontSize: 28,
    marginTop: 5,
    marginBottom: 30,
  },

  inputLabel: {
    color: "#B8C9C1",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 15,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    backgroundColor: Colors.surface,
  },

  button: {
    height: 50,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },
});