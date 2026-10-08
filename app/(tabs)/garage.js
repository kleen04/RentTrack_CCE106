import { useEffect, useState } from "react";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";
import {
  addDatabaseChangeListener,
  useSQLiteContext,
} from "expo-sqlite";

import Header from "../../components/header";
import SearchBar from "../../components/searchbar";
import VehicleCard from "../../components/vehiclecard";

import { getVehicles } from "../../services/database";
import { Colors } from "../../constants/colors";

const FILTERS = ["All", "Available", "Reserved", "Rented", "Maintenance"];

export default function Garage() {
  const [activeFilterTab, setActiveFilterTab] = useState("All");
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const db = useSQLiteContext();

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      try {
        const rows = await getVehicles(db);
        if (isMounted) setVehicles(rows);
      } catch {
        if (isMounted) setVehicles([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "vehicles") loadVehicles();
    });

    loadVehicles();
    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [db]);

  const filteredVehicles =
    activeFilterTab === "All"
      ? vehicles
      : vehicles.filter(
          (vehicle) =>
            (vehicle.status || "AVAILABLE").toUpperCase() ===
            activeFilterTab.toUpperCase()
        );

  const availableCount = vehicles.filter(
    (vehicle) => vehicle.status === "AVAILABLE"
  ).length;
  const rentedCount = vehicles.filter(
    (vehicle) => vehicle.status === "RENTED"
  ).length;
  const maintenanceCount = vehicles.filter(
    (vehicle) => vehicle.status === "MAINTENANCE"
  ).length;

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
            fill
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
            {availableCount} ready · {rentedCount} out · {maintenanceCount} in service
          </Text>

          <View style={styles.live}>
            <Text style={styles.liveText}>
              ● LIVE
            </Text>
          </View>
        </View>

        
        <SearchBar placeholder="Search a vehicle" />

        
        <View style={styles.filters}>
          {FILTERS.map((label) => {
            const isActive = activeFilterTab === label;

            return (
              <TouchableOpacity
                key={label}
                onPress={() => setActiveFilterTab(label)}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
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

        {isLoading ? (
          <Text style={styles.emptyText}>Loading fleet...</Text>
        ) : filteredVehicles.length ? (
          filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() =>
                router.push({
                  pathname: "/vehicle/[id]",
                  params: { id: String(vehicle.id) },
                })
              }
            />
          ))
        ) : (
          <Text style={styles.emptyText}>No vehicles found.</Text>
        )}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  addButton: {
    backgroundColor: Colors.primary,
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: Colors.background,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
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
    color: Colors.primary,
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
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "800",
  },

  filters: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 28,
    flexWrap: "wrap",
  },

  filterChip: {
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },

  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  filterText: {
    color: Colors.muted,
    fontSize: 11,
    textAlign: "center",
  },

  filterTextActive: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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

  emptyText: {
    color: Colors.muted,
    fontSize: 12,
    paddingVertical: 24,
    textAlign: "center",
  },
});