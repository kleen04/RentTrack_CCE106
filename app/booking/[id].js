import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import { bookings } from "../../data/bookings";
import { Colors } from "../../constants/colors";

export default function BookingDetails() {
  const { id } = useLocalSearchParams();

  const booking = bookings.find(
    (item) => item.id === id
  );

  if (!booking) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          Booking not found
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>BOOKING</Text>

      <Text style={styles.title}>
        Booking details
      </Text>

      <View style={styles.card}>
        <Text style={styles.name}>
          {booking.customerName}
        </Text>

        <Text style={styles.muted}>
          {booking.vehicle}
        </Text>

        <Text style={styles.muted}>
          {booking.plateNumber}
        </Text>

        <Text style={styles.section}>
          RENTAL PERIOD
        </Text>

        <Text style={styles.text}>
          {booking.startDate}
        </Text>

        <Text style={styles.text}>
          {booking.endDate}
        </Text>

        <Text style={styles.status}>
          {booking.status}
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

  name: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "800",
  },

  muted: {
    color: Colors.muted,
    marginTop: 6,
  },

  section: {
    color: Colors.lime,
    fontSize: 9,
    fontWeight: "800",
    marginTop: 25,
    marginBottom: 8,
  },

  text: {
    color: Colors.white,
    marginTop: 5,
  },

  status: {
    color: Colors.lime,
    marginTop: 20,
    fontWeight: "800",
  },
});