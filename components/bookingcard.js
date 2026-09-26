import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors } from "../constants/colors";

export default function BookingCard({ booking }) {
  const {
    id = "",
    customer = "Customer",
    vehicle = "Vehicle",
    plate = "",
    start = "",
    end = "",
    total = 0,
    status = "RESERVED",
  } = booking || {};

  const statusStyles = {
    RESERVED: {
      border: "#C98A2E",
      bg: "#2A2008",
      text: "#F0C94A",
    },
    ACTIVE: {
      border: "#167DA2",
      bg: "#092A35",
      text: "#45BDE8",
    },
    COMPLETED: {
      border: Colors.primary,
      bg: "#132A16",
      text: Colors.primary,
    },
    PENDING: {
      border: Colors.border,
      bg: Colors.surface,
      text: Colors.muted,
    },
  };

  const statusStyle = statusStyles[status] || statusStyles.RESERVED;
  const isActive = status === "ACTIVE";

  const handlePress = () => {
    if (isActive) {
      router.push("/booking/checkout");
    } else {
      router.push(`/booking/${id}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.id}>{id}</Text>

        <View
          style={[
            styles.statusBadge,
            {
              borderColor: statusStyle.border,
              backgroundColor: statusStyle.bg,
            },
          ]}
        >
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {status}
          </Text>
        </View>
      </View>

      <Text style={styles.vehicle}>{vehicle}</Text>

      <Text style={styles.subInfo}>
        {plate} · {customer}
      </Text>

      <View style={styles.dateBox}>
        <Ionicons name="calendar-outline" size={18} color={Colors.muted} />

        <View>
          <Text style={styles.dateMain}>{start}</Text>
          <Text style={styles.dateSecondary}>to {end}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalAmount}>
            ₱{Number(total).toLocaleString()}
          </Text>
        </View>

        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.actionText}>
            {isActive ? "Checkout" : "View details"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  id: {
    color: Colors.muted,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  vehicle: {
    color: Colors.white,
    fontSize: 19,
    fontWeight: "600",
    marginTop: 14,
  },

  subInfo: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },

  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#081A13",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },

  dateMain: {
    color: "#8BABA0",
    fontSize: 12,
    fontWeight: "600",
  },

  dateSecondary: {
    color: "#536D63",
    fontSize: 11,
    marginTop: 2,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
  },

  totalLabel: {
    color: Colors.muted,
    fontSize: 9,
    marginBottom: 3,
  },

  totalAmount: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },

  actionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },

  actionText: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },

  pressed: {
    opacity: 0.7,
  },
});