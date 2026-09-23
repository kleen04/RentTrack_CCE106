import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from "react-native";

export default function CustomerCard({
  customer,
  onPress,
}) {
  const {
    name = "Customer",
    phone = "",
    rentals = 0,
    initials,
  } = customer || {};

  const getInitials = () => {
    if (initials) {
      return initials;
    }

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getInitials()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>
          {name}
        </Text>

        <Text style={styles.phone}>
          {phone}
        </Text>
      </View>

      <View style={styles.rentalContainer}>
        <Text style={styles.rentalNumber}>
          {rentals}
        </Text>

        <Text style={styles.rentalLabel}>
          RENTALS
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    backgroundColor: "#0D2018",
    borderBottomWidth: 1,
    borderBottomColor: "#243D32",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#B8FF2C",
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

  name: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },

  phone: {
    color: "#718078",
    fontSize: 11,
  },

  rentalContainer: {
    alignItems: "flex-end",
  },

  rentalNumber: {
    color: "#B8FF2C",
    fontSize: 18,
    fontWeight: "800",
  },

  rentalLabel: {
    color: "#687A72",
    fontSize: 7,
    letterSpacing: 0.8,
    marginTop: 2,
  },

  pressed: {
    opacity: 0.75,
  },
});