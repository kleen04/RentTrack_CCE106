import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";

import { Colors } from "../../constants/colors";
import { createPayment, getBookingByCode } from "../../services/database";

const PAYMENT_METHODS = [
  { id: "GCASH", label: "GCash", subtext: "Demo mobile wallet", icon: "phone-portrait-outline" },
  { id: "CARD", label: "Card", subtext: "Demo card ending in 4242", icon: "card-outline" },
  { id: "CASH", label: "Cash", subtext: "Record payment at counter", icon: "cash-outline" },
];

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(amount) {
  return `₱${Number(amount || 0).toLocaleString("en-PH")}`;
}

export default function Checkout() {
  const params = useLocalSearchParams();
  const bookingCode = Array.isArray(params.id) ? params.id[0] : params.id;
  const db = useSQLiteContext();
  const [booking, setBooking] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("GCASH");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [successReference, setSuccessReference] = useState("");

  const loadBooking = useCallback(async () => {
    const row = await getBookingByCode(db, bookingCode);
    setBooking(row);
    setLoadError(row ? "" : "This booking could not be found.");
    return row;
  }, [db, bookingCode]);

  useEffect(() => {
    let isActive = true;
    const refresh = async () => {
      try {
        const row = await getBookingByCode(db, bookingCode);
        if (!isActive) return;
        setBooking(row);
        setLoadError(row ? "" : "This booking could not be found.");
      } catch (error) {
        if (isActive) setLoadError(error?.message || "Booking details could not be loaded.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "bookings" || event.tableName === "payments") {
        void refresh();
      }
    });
    void refresh();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, bookingCode]);

  const returnToBookings = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/bookings");
  };

  const handleSuccessfulCheckout = async () => {
    if (!booking || isSubmitting || booking.paymentStatus === "PAID") return;
    setIsSubmitting(true);
    setCheckoutError("");
    const reference = `DEMO-${Date.now().toString().slice(-8)}`;
    try {
      await createPayment(db, {
        bookingId: booking.id,
        method: selectedMethod,
        reference,
      });
      setSuccessReference(reference);
      await loadBooking();
    } catch (error) {
      setCheckoutError(error?.message || "The demo checkout could not be completed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.helperText}>Loading booking checkout…</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={returnToBookings}>
          <Ionicons name="arrow-back" size={19} color={Colors.white} />
          <Text style={styles.backText}>Back to bookings</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  const isPaid = booking.paymentStatus === "PAID";
  const distanceCharge =
    Number(booking.destinationKm || 0) *
    Number(booking.distanceRatePerKm || 20);
  const baseRental = Math.max(0, Number(booking.totalAmount || 0) - distanceCharge);
  const amountDue = Math.max(
    0,
    Number(booking.totalAmount || 0) - Number(booking.paidAmount || 0)
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back to bookings"
            style={styles.backButton}
            onPress={returnToBookings}
          >
            <Ionicons name="arrow-back" size={19} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PAYMENT CHECKOUT</Text>
            <Text style={styles.title}>Complete payment</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={19} color={Colors.primary} />
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>Prototype transaction</Text>
            <Text style={styles.noticeText}>No real payment will be processed.</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.bookingHeader}>
            <View>
              <Text style={styles.sectionLabel}>BOOKING SUMMARY</Text>
              <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
            </View>
            <View style={[styles.statusBadge, isPaid && styles.paidBadge]}>
              <Text style={[styles.statusText, isPaid && styles.paidText]}>
                {isPaid ? "PAID" : booking.status}
              </Text>
            </View>
          </View>
          <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
          <Text style={styles.customerName}>{booking.customerName}</Text>
          <View style={styles.divider} />
          <InfoRow
            icon="calendar-outline"
            label="Pickup"
            value={formatDate(booking.pickupAt)}
          />
          <InfoRow
            icon="return-down-back-outline"
            label="Return"
            value={formatDate(booking.returnAt)}
          />
          <InfoRow
            icon="navigate-outline"
            label="Destination"
            value={booking.destination || "Not recorded"}
            last
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment summary</Text>
          <PriceRow
            label={booking.status === "COMPLETED" ? "Final rental amount" : "Rental estimate"}
            value={formatAmount(baseRental)}
          />
          {distanceCharge > 0 ? (
            <PriceRow
              label={`${booking.destinationKm} km × ₱${Number(
                booking.distanceRatePerKm || 20
              )}/km`}
              value={formatAmount(distanceCharge)}
            />
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total rental amount</Text>
            <Text style={styles.totalValue}>{formatAmount(booking.totalAmount)}</Text>
          </View>
          {Number(booking.paidAmount || 0) > 0 ? (
            <PriceRow
              label="Already paid"
              value={`− ${formatAmount(booking.paidAmount)}`}
            />
          ) : null}
          {Number(booking.paidAmount || 0) > Number(booking.totalAmount || 0) ? (
            <PriceRow
              label="Paid above final rental amount"
              value={formatAmount(
                Number(booking.paidAmount) - Number(booking.totalAmount)
              )}
            />
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount due now</Text>
            <Text style={styles.totalValue}>{formatAmount(amountDue)}</Text>
          </View>
        </View>

        {isPaid ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={22} color={Colors.background} />
            </View>
            <Text style={styles.successTitle}>Payment successful</Text>
            <Text style={styles.successCopy}>
              {successReference || booking.paymentReference || "Payment recorded"} ·{" "}
              {PAYMENT_METHODS.find((method) => method.id === booking.paymentMethod)?.label ||
                "Payment"}
            </Text>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace("/(tabs)/payment")}
            >
              <Text style={styles.secondaryButtonText}>View payment ledger</Text>
              <Ionicons name="arrow-forward" size={15} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Choose a demo payment method</Text>
              {PAYMENT_METHODS.map((method) => {
                const selected = selectedMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    style={[
                      styles.methodRow,
                      selected && styles.methodRowSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.id)}
                  >
                    <View style={styles.methodIcon}>
                      <Ionicons
                        name={method.icon}
                        size={18}
                        color={selected ? Colors.primary : Colors.muted}
                      />
                    </View>
                    <View style={styles.methodCopy}>
                      <Text style={styles.methodTitle}>{method.label}</Text>
                      <Text style={styles.methodSubtext}>{method.subtext}</Text>
                    </View>
                    <View style={[styles.radio, selected && styles.radioSelected]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            {checkoutError ? <Text style={styles.errorText}>{checkoutError}</Text> : null}
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.confirmButton, isSubmitting && styles.confirmDisabled]}
              onPress={handleSuccessfulCheckout}
              disabled={isSubmitting}
            >
              <Ionicons name="lock-closed-outline" size={16} color={Colors.background} />
              <Text style={styles.confirmText}>
                {isSubmitting
                  ? "Processing demo payment…"
                  : `Demo successful checkout · ${formatAmount(amountDue)}`}
              </Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>
              This button records a simulated payment for the outstanding balance only.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoLabelRow}>
        <Ionicons name={icon} size={14} color={Colors.primary} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function PriceRow({ label, value }) {
  return (
    <View style={styles.priceRow}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 38 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.background },
  helperText: { color: Colors.muted, fontSize: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 18 },
  backButton: { width: 39, height: 39, borderRadius: 10, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" },
  backText: { color: Colors.white, fontSize: 11, marginLeft: 8 },
  headerCopy: { flex: 1 },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  title: { color: Colors.white, fontSize: 22, fontWeight: "900", marginTop: 3 },
  notice: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#132A16", borderWidth: 1, borderColor: "#2E4A1F", borderRadius: 12, padding: 13, marginBottom: 14 },
  noticeCopy: { flex: 1 },
  noticeTitle: { color: Colors.primary, fontSize: 10, fontWeight: "800" },
  noticeText: { color: Colors.muted, fontSize: 9, marginTop: 3 },
  card: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 15, marginBottom: 13 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionLabel: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  bookingCode: { color: Colors.muted, fontSize: 9, marginTop: 4 },
  statusBadge: { borderWidth: 1, borderColor: Colors.warning, backgroundColor: "#2A2008", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { color: Colors.warning, fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  paidBadge: { borderColor: Colors.primary, backgroundColor: "#132A16" },
  paidText: { color: Colors.primary },
  vehicleName: { color: Colors.white, fontSize: 17, fontWeight: "800", marginTop: 13 },
  customerName: { color: Colors.muted, fontSize: 10, marginTop: 4 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12 },
  infoRow: { minHeight: 38, borderBottomWidth: 1, borderBottomColor: Colors.border, justifyContent: "center", paddingVertical: 7 },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  infoLabel: { color: Colors.muted, fontSize: 8 },
  infoValue: { color: Colors.white, fontSize: 10, fontWeight: "600", marginTop: 4, marginLeft: 21 },
  sectionTitle: { color: Colors.white, fontSize: 13, fontWeight: "800", marginBottom: 10 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  priceLabel: { color: Colors.muted, fontSize: 9, flex: 1, marginRight: 8 },
  priceValue: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 13, marginTop: 4 },
  totalLabel: { color: Colors.white, fontSize: 11, fontWeight: "800" },
  totalValue: { color: Colors.primary, fontSize: 19, fontWeight: "900" },
  methodRow: { minHeight: 62, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 10, marginTop: 8 },
  methodRowSelected: { borderColor: Colors.primary, backgroundColor: "#10291E" },
  methodIcon: { width: 33, height: 33, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#081A13" },
  methodCopy: { flex: 1 },
  methodTitle: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  methodSubtext: { color: Colors.muted, fontSize: 8, marginTop: 3 },
  radio: { width: 17, height: 17, borderWidth: 1, borderColor: Colors.muted, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  radioSelected: { borderColor: Colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  confirmButton: { minHeight: 49, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, borderRadius: 11, paddingHorizontal: 12, marginTop: 2 },
  confirmDisabled: { opacity: 0.65 },
  confirmText: { color: Colors.background, fontSize: 10, fontWeight: "900", textAlign: "center" },
  disclaimer: { color: Colors.muted, fontSize: 8, textAlign: "center", marginTop: 9 },
  errorText: { color: Colors.danger, fontSize: 10, lineHeight: 15, marginBottom: 10 },
  successCard: { alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, padding: 20 },
  successIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  successTitle: { color: Colors.white, fontSize: 17, fontWeight: "900", marginTop: 12 },
  successCopy: { color: Colors.muted, fontSize: 9, textAlign: "center", marginTop: 6 },
  secondaryButton: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 13, marginTop: 16 },
  secondaryButtonText: { color: Colors.primary, fontSize: 9, fontWeight: "800" },
});
