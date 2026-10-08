import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";

import Header from "../../components/header";
import SearchBar from "../../components/searchbar";
import BookingCard from "../../components/bookingcard";

import { getBookings } from "../../services/database";
import { Colors } from "../../constants/colors";

const FILTERS = ["All", "Reserved", "Active", "Completed", "Cancelled"];

export default function Bookings() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [liveBookings, setLiveBookings] = useState([]);
  const [loadError, setLoadError] = useState("");
  const db = useSQLiteContext();

  const loadLiveBookings = useCallback(async () => {
    try {
      setLiveBookings(await getBookings(db));
      setLoadError("");
    } catch (error) {
      setLoadError(error?.message || "Bookings could not be loaded.");
    }
  }, [db]);

  useEffect(() => {
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "bookings" || event.tableName === "vehicles") {
        loadLiveBookings();
      }
    });
    getBookings(db)
      .then((rows) => {
        setLiveBookings(rows);
        setLoadError("");
      })
      .catch((error) => {
        setLoadError(error?.message || "Bookings could not be loaded.");
      });
    return () => subscription.remove();
  }, [db, loadLiveBookings]);

  const bookings = [
    ...liveBookings.map((booking) => ({
      id: booking.bookingCode,
      customer: booking.customerName,
      vehicle: booking.vehicleName,
      plate: booking.plateNumber || "Plate pending",
      start: new Date(booking.pickupAt).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      end: new Date(booking.returnAt).toLocaleString("en-PH", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      total: booking.totalAmount,
      status: booking.status,
      destination: booking.destination,
      destinationKm: booking.destinationKm,
      distanceRatePerKm: booking.distanceRatePerKm,
      bookingChannel: booking.bookingChannel,
      remarks: booking.remarks,
    })),
  ];

  const filteredBookings =
    activeFilter === "All"
      ? bookings
      : bookings.filter(
          (booking) =>
            (booking.status || "").toUpperCase() ===
            activeFilter.toUpperCase()
        );

  const activeCount = bookings.filter((b) => b.status === "ACTIVE").length;
  const reservedCount = bookings.filter((b) => b.status === "RESERVED").length;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <Header eyebrow="RENTAL OPERATIONS" title="Bookings" fill />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.add}
            onPress={() => router.push("/booking/add")}
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.number}>
              {String(bookings.length).padStart(2, "0")}
            </Text>
            <Text style={styles.label}>ALL BOOKINGS</Text>
          </View>

          <View style={styles.line} />

          <View style={styles.stat}>
            <Text style={styles.number}>
              {String(activeCount).padStart(2, "0")}
            </Text>
            <Text style={styles.label}>ACTIVE</Text>
          </View>

          <View style={styles.line} />

          <View style={styles.stat}>
            <Text style={styles.number}>
              {String(reservedCount).padStart(2, "0")}
            </Text>
            <Text style={styles.label}>RESERVED</Text>
          </View>
        </View>

        <SearchBar placeholder="Search bookings" />

        {liveBookings.length > 0 && (
          <View style={styles.syncBanner}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>
              LOCAL BOOKINGS · {liveBookings.length} RECORD{liveBookings.length === 1 ? "" : "S"}
            </Text>
          </View>
        )}
        {loadError ? <Text style={styles.loadError}>{loadError}</Text> : null}

        <View style={styles.filters}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterButton,
                  isActive && styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No {activeFilter.toLowerCase()} bookings
            </Text>
          </View>
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
    paddingTop: 26,
    paddingBottom: 30,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 21,
  },

  add: {
    width: 42,
    height: 42,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  addText: {
    color: Colors.background,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
    textAlign: "center",
  },

  stats: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  number: {
    color: Colors.primary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  label: {
    color: Colors.muted,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 3,
    textAlign: "center",
  },

  line: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },

  filters: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },

  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#14281C",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginTop: 14,
  },

  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },

  syncText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  loadError: {
    color: Colors.warning,
    fontSize: 10,
    marginTop: 10,
  },

  filterButton: {
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    paddingHorizontal: 14,
  },

  filterText: {
    color: Colors.muted,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },

  filterTextActive: {
    color: Colors.background,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  empty: {
    paddingVertical: 35,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    color: Colors.muted,
    fontSize: 12,
  },
});