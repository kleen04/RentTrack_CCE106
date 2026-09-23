import { useState } from "react";
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

const FILTERS = [
  "All",
  "Available",
  "Reserved",
  "Rented",
];

export default function Garage() {
  const [activeFilterTab, setActiveFilterTab] =
    useState("All");

  const filteredVehicles =
    activeFilterTab === "All"
      ? vehicles
      : vehicles.filter(
          (vehicle) =>
            (vehicle.status || "AVAILABLE").toUpperCase() ===
            activeFilterTab.toUpperCase()
        );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <Header
            eyebrow="FLEET CONTROL"
            title="The garage"
          />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addButton}
            onPress={() => router.push("/vehicle/add")}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pulse}>
          <View>
            <Text style={styles.pulseLabel}>
              FLEET PULSE
            </Text>

            <Text style={styles.pulseText}>
              5 ready · 1 out
            </Text>
          </View>

          <View style={styles.live}>
            <Text style={styles.liveText}>
              • LIVE
            </Text>
          </View>
        </View>

        <View style={styles.searchWrapper}>
          <SearchBar placeholder="Search a vehicle" />
        </View>

        <View style={styles.filters}>
          {FILTERS.map((label) => {
            const isActive =
              activeFilterTab === label;

            return (
              <TouchableOpacity
                key={label}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveFilterTab(label)
                }
                style={[
                  styles.filterChip,
                  isActive &&
                    styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive &&
                      styles.filterTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            FLEET INVENTORY
          </Text>

          <Text style={styles.count}>
            {filteredVehicles.length} VEHICLES
          </Text>
        </View>

        {filteredVehicles.map((vehicle) => (
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
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 30,
  },


  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  addButton: {
    width: 42,
    height: 42,

    backgroundColor: Colors.primary,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 0,
  },

  addText: {
    color: Colors.background,
    fontSize: 23,
    fontWeight: "700",
    lineHeight: 25,
    textAlign: "center",
  },


  pulse: {
    height: 74,

    backgroundColor: Colors.card,

    borderWidth: 1,
    borderColor: Colors.border,

    borderRadius: 12,

    paddingHorizontal: 16,

    justifyContent: "center",

    marginBottom: 14,
  },

  pulseLabel: {
    color: Colors.primary,

    fontSize: 9,
    fontWeight: "800",

    letterSpacing: 0.4,

    marginBottom: 6,
  },

  pulseText: {
    color: Colors.white,

    fontSize: 17,
    fontWeight: "800",

    lineHeight: 20,
  },

  live: {
    position: "absolute",

    right: 17,
    top: 22,

    backgroundColor: "#183622",

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 6,
  },

  liveText: {
    color: Colors.primary,

    fontSize: 8,
    fontWeight: "800",

    letterSpacing: 0.2,
  },


  searchWrapper: {
    marginBottom: 8,
  },


  filters: {
    flexDirection: "row",
    alignItems: "center",

    gap: 8,

    marginTop: 0,
    marginBottom: 28,
  },

  filterChip: {
    height: 34,

    paddingHorizontal: 13,

    borderWidth: 1,
    borderColor: Colors.border,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",
  },

  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,

    paddingHorizontal: 14,
  },

  filterText: {
    color: Colors.muted,

    fontSize: 10,

    fontWeight: "500",
  },

  filterTextActive: {
    color: Colors.background,

    fontSize: 10,

    fontWeight: "800",
  },


  sectionRow: {
    flexDirection: "row",

    alignItems: "center",
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

    letterSpacing: 0.3,
  },
});
