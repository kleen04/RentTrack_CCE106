import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

export default function BookingCard({
  booking,
  onCheckout,
  onDetails,
}) {
  const {
    customer = "Customer",
    vehicle = "Vehicle",
    plate = "",
    period = "",
    status = "RESERVED",
    initials = "CU",
  } = booking || {};

  const statusColor =
    status === "UPCOMING"
      ? "#F0C94A"
      : status === "COMPLETED"
      ? "#6D8178"
      : "#B8FF2C";

  return (
    <View style={styles.card}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {initials}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.label}>
            CUSTOMER
          </Text>

          <Text style={styles.customer}>
            {customer}
          </Text>

          <Text style={styles.vehicle}>
            {vehicle}
            {plate ? ` / ${plate}` : ""}
          </Text>
        </View>
      </View>

      <View style={styles.periodContainer}>
        <Text style={styles.label}>
          RENTAL PERIOD
        </Text>

        <Text style={styles.period}>
          {period}
        </Text>
      </View>

      <View
        style={[
          styles.statusBadge,
          { borderColor: statusColor },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: statusColor },
          ]}
        >
          {status}
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          onPress={onCheckout}
          style={({ pressed }) => [
            styles.checkoutButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.checkoutText}>
            Check out
          </Text>
        </Pressable>

        <Pressable
          onPress={onDetails}
          style={({ pressed }) => [
            styles.detailsButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.detailsText}>
            Details
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0E281E",
    borderWidth: 1,
    borderColor: "#203D31",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  topSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FF7D4D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#07130F",
    fontSize: 12,
    fontWeight: "800",
  },

  info: {
    flex: 1,
  },

  label: {
    color: "#718078",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },

  customer: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },

  vehicle: {
    color: "#789087",
    fontSize: 11,
  },

  periodContainer: {
    marginTop: 14,
  },

  period: {
    color: "#D2DDD8",
    fontSize: 12,
    marginTop: 3,
  },

  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 5,
    marginTop: 10,
  },

  statusText: {
    fontSize: 8,
    fontWeight: "800",
  },

  buttons: {
    flexDirection: "row",
    gap: 7,
    marginTop: 12,
  },

  checkoutButton: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    backgroundColor: "#B8FF2C",
    alignItems: "center",
    justifyContent: "center",
  },

  checkoutText: {
    color: "#07130F",
    fontSize: 11,
    fontWeight: "700",
  },

  detailsButton: {
    flex: 1,
    height: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#29453A",
    backgroundColor: "#0A1B14",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.7,
  },
});