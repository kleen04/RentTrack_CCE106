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

export default function Bookings() {
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <Header
            label="SCHEDULE"
            title="Bookings"
          />

          <TouchableOpacity
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
          <Text style={styles.active}>All</Text>
          <Text style={styles.filter}>Confirmed</Text>
          <Text style={styles.filter}>Upcoming</Text>
          <Text style={styles.filter}>Active</Text>
          <Text style={styles.filter}>Completed</Text>
        </View>

        <Text style={styles.section}>
          SCHEDULED RENTALS
        </Text>

        {bookings.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
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

  add: {
    width: 42,
    height: 42,
    backgroundColor: Colors.lime,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  addText: {
    color: Colors.black,
    fontSize: 25,
  },

  stats: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    marginBottom: 16,
  },

  stat: {
    flex: 1,
  },

  number: {
    color: Colors.lime,
    fontSize: 25,
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
    backgroundColor: Colors.border,
    marginHorizontal: 15,
  },

  filters: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 28,
    flexWrap: "wrap",
  },

  active: {
    backgroundColor: Colors.lime,
    color: Colors.black,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 8,
    fontSize: 10,
    fontWeight: "800",
  },

  filter: {
    color: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 8,
    fontSize: 10,
  },

  section: {
    color: "#B9C8C1",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    marginBottom: 12,
  },
});