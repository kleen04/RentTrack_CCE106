import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
} from "react-native";

export default function VehicleCard({
  vehicle,
  onPress,
}) {
  const {
    image,
    brand,
    name,
    price,
    status = "AVAILABLE",
  } = vehicle || {};

  const statusColor =
    status === "AVAILABLE"
      ? "#B8FF2C"
      : status === "RENTED"
      ? "#F0C94A"
      : "#B8FF2C";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageContainer}>
        {image ? (
          <Image
            source={
              typeof image === "string"
                ? { uri: image }
                : image
            }
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>
              NO IMAGE
            </Text>
          </View>
        )}

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
      </View>

      <View style={styles.details}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.brand}>{brand}</Text>

          <Text style={styles.name}>
            {name}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            PHP {Number(price || 0).toLocaleString()}
          </Text>

          <Text style={styles.perDay}>
            / DAY
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0E281E",
    borderWidth: 1,
    borderColor: "#203D31",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 14,
  },

  imageContainer: {
    height: 180,
    backgroundColor: "#020504",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#050807",
  },

  placeholderText: {
    color: "#53635B",
    fontSize: 12,
  },

  statusBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "#07130F",
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  details: {
    minHeight: 86,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  vehicleInfo: {
    flex: 1,
  },

  brand: {
    color: "#799087",
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },

  priceContainer: {
    alignItems: "flex-end",
  },

  price: {
    color: "#B8FF2C",
    fontSize: 16,
    fontWeight: "800",
  },

  perDay: {
    color: "#6E8078",
    fontSize: 9,
    marginTop: 3,
  },

  pressed: {
    opacity: 0.8,
  },
});