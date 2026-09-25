import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { Colors } from "../../constants/colors";

const PAYMENT_METHODS = [
  {
    id: "cash",
    label: "Cash",
    subtext: "Pay at counter",
  },
  {
    id: "gcash",
    label: "GCash",
    subtext: "Mobile wallet",
  },
  {
    id: "card",
    label: "Card",
    subtext: "•••• 4242",
  },
];

export default function Checkout() {
  const [selectedMethod, setSelectedMethod] = useState("gcash");

  const rental = {
    vehicle: "Ford Ranger",
    plate: "NCR 1912",
    customer: "Alex Rivera",
    start: "Sep 16, 9:00 AM",
    end: "Sep 19, 9:00 AM",
    days: 3,
    ratePerDay: 4600,
    cleaning: 450,
  };

  const subtotal = rental.days * rental.ratePerDay;
  const total = subtotal + rental.cleaning;

  const handleConfirm = () => {
    Alert.alert(
      "Checkout confirmed",
      `Payment via ${
        PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label
      } — PHP ${total.toLocaleString()}`,
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View>
          <Text style={styles.label}>SIMULATED PAYMENT</Text>
          <Text style={styles.title}>Rental checkout</Text>
        </View>
      </View>

      {/* PROTOTYPE NOTICE */}
      <View style={styles.notice}>
        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color={Colors.primary}
        />

        <View style={styles.noticeText}>
          <Text style={styles.noticeTitle}>Prototype transaction</Text>
          <Text style={styles.noticeSubtext}>
            No real payment will be processed.
          </Text>
        </View>
      </View>

      {/* RENTAL INFO */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>RENTAL INFORMATION</Text>

        <Text style={styles.vehicleName}>{rental.vehicle}</Text>

        <Text style={styles.customerInfo}>
          {rental.plate} · {rental.customer}
        </Text>

        <View style={styles.divider} />

        <View style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View>
            <Text style={styles.timelineLabel}>START</Text>
            <Text style={styles.timelineValue}>{rental.start}</Text>
          </View>
        </View>

        <View style={styles.timelineRow}>
          <View style={styles.timelineDot} />
          <View>
            <Text style={styles.timelineLabel}>END</Text>
            <Text style={styles.timelineValue}>{rental.end}</Text>
          </View>
        </View>
      </View>

      {/* PRICE BREAKDOWN */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Price breakdown</Text>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>
            {rental.days} days × ₱{rental.ratePerDay.toLocaleString()}
          </Text>
          <Text style={styles.priceValue}>
            ₱{subtotal.toLocaleString()}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Additional cleaning</Text>
          <Text style={styles.priceValue}>
            ₱{rental.cleaning.toLocaleString()}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceLabelMuted}>Subtotal</Text>
          <Text style={styles.priceValueMuted}>
            ₱{total.toLocaleString()}
          </Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total amount</Text>
          <Text style={styles.totalValue}>
            ₱{total.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* PAYMENT METHOD */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Payment method</Text>

        {PAYMENT_METHODS.map((method) => {
          const isSelected = selectedMethod === method.id;

          return (
            <TouchableOpacity
              key={method.id}
              style={[
                styles.methodRow,
                isSelected && styles.methodRowSelected,
              ]}
              onPress={() => setSelectedMethod(method.id)}
            >
              <View style={styles.methodLeft}>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={isSelected ? Colors.primary : Colors.muted}
                />

                <View>
                  <Text style={styles.methodLabel}>{method.label}</Text>
                  <Text style={styles.methodSubtext}>
                    {method.subtext}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.radio,
                  isSelected && styles.radioSelected,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.confirmButton}
        onPress={handleConfirm}
      >
        <Text style={styles.confirmText}>
          Confirm checkout · ₱{total.toLocaleString()}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    padding: 18,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: Colors.white,
    fontSize: 24,
    marginTop: 3,
  },

  notice: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#132A16",
    borderWidth: 1,
    borderColor: "#2E4A1F",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  noticeText: {
    flex: 1,
  },

  noticeTitle: {
    color: Colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  noticeSubtext: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 3,
  },

  card: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
  },

  sectionLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },

  vehicleName: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: "600",
  },

  customerInfo: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },

  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },

  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },

  timelineLabel: {
    color: Colors.muted,
    fontSize: 9,
    letterSpacing: 0.5,
  },

  timelineValue: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

  sectionTitle: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 14,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  priceLabel: {
    color: Colors.muted,
    fontSize: 13,
  },

  priceValue: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
  },

  priceLabelMuted: {
    color: "#6E8078",
    fontSize: 12,
  },

  priceValueMuted: {
    color: "#6E8078",
    fontSize: 12,
    fontWeight: "600",
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },

  totalLabel: {
    color: Colors.white,
    fontSize: 13,
  },

  totalValue: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "800",
  },

  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },

  methodRowSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#122015",
  },

  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  methodLabel: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "600",
  },

  methodSubtext: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 2,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: Colors.border,
  },

  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },

  confirmButton: {
    height: 54,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },

  confirmText: {
    color: Colors.background,
    fontWeight: "800",
    fontSize: 14,
  },
});