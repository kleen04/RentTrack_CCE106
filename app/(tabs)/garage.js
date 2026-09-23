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
import VehicleCard from "../../components/vehiclecard";

import { vehicles } from "../../data/vehicles";
import { Colors } from "../../constants/colors";

export default function Garage() {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <Header
            label="FLEET CONTROL"
            title="The garage"
          />

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/vehicle/add")}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pulse}>
          <Text style={styles.pulseLabel}>
            FLEET PULSE
          </Text>

          <Text style={styles.pulseText}>
            5 ready · 1 out
          </Text>

          <View style={styles.live}>
            <Text style={styles.liveText}>● LIVE</Text>
          </View>
        </View>

        <SearchBar placeholder="Search a vehicle" />

        <View style={styles.filters}>
          <Text style={styles.activeFilter}>All</Text>
          <Text style={styles.filter}>Available</Text>
          <Text style={styles.filter}>Reserved</Text>
          <Text style={styles.filter}>Rented</Text>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            FLEET INVENTORY
          </Text>

          <Text style={styles.count}>
            {vehicles.length} VEHICLES
          </Text>
        </View>

        {vehicles.map((vehicle) => (
          <VehicleCard
            key={vehicle.id}
            vehicle={vehicle}
          />
        ))}
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
    padding: 14,
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  addButton: {
    backgroundColor: Colors.lime,
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: Colors.black,
    fontSize: 26,
  },

  pulse: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 14,
  },

  pulseLabel: {
    color: Colors.lime,
    fontSize: 9,
    fontWeight: "800",
  },

  pulseText: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 6,
  },

  live: {
    position: "absolute",
    right: 16,
    top: 22,
    backgroundColor: "#183622",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },

  liveText: {
    color: Colors.lime,
    fontSize: 8,
    fontWeight: "800",
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
  },

  activeFilter: {
    backgroundColor: Colors.lime,
    color: Colors.black,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "800",
  },

  filter: {
    color: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 10,
  },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#B9C8C1",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },

  count: {
    color: Colors.muted,
    fontSize: 9,
  },
});