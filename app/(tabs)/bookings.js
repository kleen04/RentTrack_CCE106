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
import BookingCard from "../../components/bookingcard";

import { bookings } from "../../data/bookings";
import { Colors } from "../../constants/colors";

const FILTERS = [
  "All",
  "Confirmed",
  "Upcoming",
  "Active",
  "Completed",
];

export default function Bookings() {
  const [activeFilter, setActiveFilter] =
    useState("All");

  const filteredBookings =
    activeFilter === "All"
      ? bookings
      : bookings.filter((booking) => {
          const status = (
            booking.status || ""
          ).toUpperCase();

          return (
            status === activeFilter.toUpperCase()
          );
        });

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <Header
            label="SCHEDULE"
            title="Bookings"
          />

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.add}
            onPress={() =>
              router.push("/booking/add")
            }
          >
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.number}>02</Text>

            <Text style={styles.label}>
              OPEN BOOKINGS
            </Text>
          </View>

          <View style={styles.line} />

          <View style={styles.stat}>
            <Text style={styles.number}>01</Text>

            <Text style={styles.label}>
              PICKUP TODAY
            </Text>
          </View>
        </View>

        <SearchBar placeholder="Search bookings" />

        <View style={styles.filters}>
          {FILTERS.map((filter) => {
            const isActive =
              activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() =>
                  setActiveFilter(filter)
                }
                style={[
                  styles.filterButton,
                  isActive &&
                    styles.filterButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    isActive &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>
            SCHEDULED RENTALS
          </Text>

          <Text style={styles.records}>
            {filteredBookings.length} RECORDS
          </Text>
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
            />
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

    backgroundColor: Colors.lime,

    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 10,
  },

  addText: {
    color: Colors.black,
    fontSize: 25,
    fontWeight: "400",
    lineHeight: 27,
  },

  /* STATS */

  stats: {
    height: 80,

    backgroundColor: Colors.card,

    borderWidth: 1,
    borderColor: Colors.border,

    borderRadius: 12,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 16,
  },

  stat: {
    flex: 1,
    justifyContent: "center",
  },

  number: {
    color: Colors.lime,

    fontSize: 25,
    lineHeight: 28,

    fontWeight: "800",
  },

  label: {
    color: Colors.muted,

    fontSize: 8,

    letterSpacing: 1,

    marginTop: 3,
  },

  line: {
    width: 1,
    height: 49,

    backgroundColor: Colors.border,

    marginHorizontal: 15,
  },


  filters: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    marginTop: 12,
    marginBottom: 28,

    flexWrap: "wrap",
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
    backgroundColor: Colors.lime,
    borderColor: Colors.lime,

    paddingHorizontal: 14,
  },

  filterText: {
    color: Colors.muted,

    fontSize: 10,

    fontWeight: "500",
  },

  filterTextActive: {
    color: Colors.black,

    fontSize: 10,

    fontWeight: "800",
  },


  sectionRow: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 12,
  },

  section: {
    color: "#B9C8C1",

    fontSize: 10,

    letterSpacing: 1,

    fontWeight: "700",
  },

  records: {
    color: "#71847C",

    fontSize: 9,

    letterSpacing: 0.5,
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
