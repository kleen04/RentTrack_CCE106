import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import { getBookingsForCustomerId, getCustomerById } from "../../services/database";

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CustomerDetails() {
  const { id } = useLocalSearchParams();
  const customerId = Array.isArray(id) ? id[0] : id;
  const db = useSQLiteContext();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isActive = true;
    const loadCustomer = async () => {
      try {
        const [customerRow, bookingRows] = await Promise.all([
          getCustomerById(db, customerId),
          getBookingsForCustomerId(db, customerId),
        ]);
        if (!isActive) return;
        setCustomer(customerRow);
        setBookings(bookingRows);
        setLoadError("");
      } catch (error) {
        if (isActive) setLoadError(error?.message || "Customer record could not be loaded.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "customers" || event.tableName === "bookings") {
        void loadCustomer();
      }
    });
    void loadCustomer();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [customerId, db]);

  const returnToCustomers = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/customers");
  };

  if (isLoading || loadError || !customer) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={returnToCustomers}>
          <Text style={styles.back}>← Back to customers</Text>
        </TouchableOpacity>
        <Text style={loadError ? styles.error : styles.message}>
          {isLoading ? "Loading customer record…" : loadError || "Customer not found"}
        </Text>
      </View>
    );
  }

  const completedRentals = bookings.filter((booking) => booking.status === "COMPLETED");

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={returnToCustomers}>
          <Text style={styles.back}>← Back to customers</Text>
        </TouchableOpacity>
        <Text style={styles.label}>CUSTOMER RECORD</Text>
        <Text style={styles.title}>{customer.name}</Text>
        <Text style={styles.subtitle}>Customer details and rental history.</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>PHONE</Text>
            <Text style={styles.summaryValue}>{customer.phone || "Not provided"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>EMAIL</Text>
            <Text style={styles.summaryValue}>{customer.email || "Not provided"}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{customer.rentals}</Text>
              <Text style={styles.statLabel}>TOTAL RENTALS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{completedRentals.length}</Text>
              <Text style={styles.statLabel}>COMPLETED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>₱{Number(customer.completedSpend).toLocaleString()}</Text>
              <Text style={styles.statLabel}>COMPLETED TOTAL</Text>
            </View>
          </View>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>RENTAL HISTORY</Text>
          <Text style={styles.historyCount}>{bookings.length} BOOKINGS</Text>
        </View>
        {bookings.length ? bookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingTop}>
              <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
              <Text style={[
                styles.status,
                booking.status === "COMPLETED" ? styles.completed : styles.upcoming,
              ]}>
                {booking.status}
              </Text>
            </View>
            <Text style={styles.vehicle}>{booking.vehicleName}</Text>
            <Text style={styles.period}>{formatDate(booking.pickupAt)} — {formatDate(booking.returnAt)}</Text>
            <View style={styles.destinationRow}>
              <Text style={styles.destinationLabel}>DESTINATION</Text>
              <Text style={styles.destination}>
                {booking.destination || "Not recorded"}
                {Number(booking.destinationKm) > 0 ? ` · ${booking.destinationKm} km` : ""}
              </Text>
            </View>
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>
                {booking.status === "COMPLETED" ? "Final rental total" : "Estimated rental total"}
              </Text>
              <Text style={styles.amount}>₱{Number(booking.totalAmount).toLocaleString()}</Text>
            </View>
            {Number(booking.paidAmount || 0) > 0 ? (
              <>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>
                    Paid · {booking.paymentMethod || "Payment"}
                  </Text>
                  <Text style={styles.amount}>₱{Number(booking.paidAmount).toLocaleString()}</Text>
                </View>
                {Number(booking.totalAmount) > Number(booking.paidAmount) ? (
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Remaining balance</Text>
                    <Text style={styles.amount}>
                      ₱{(Number(booking.totalAmount) - Number(booking.paidAmount)).toLocaleString()}
                    </Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Payment status</Text>
                <Text style={styles.amountLabel}>
                  {["RESERVED", "ACTIVE", "COMPLETED"].includes(booking.status)
                    ? "Awaiting checkout"
                    : "Not paid"}
                </Text>
              </View>
            )}
          </View>
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No rental history yet</Text>
            <Text style={styles.emptyText}>Bookings made by this customer in either view will appear here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 34 },
  back: { color: Colors.primary, fontSize: 12, marginBottom: 29 },
  label: { color: Colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  title: { color: Colors.white, fontSize: 27, fontWeight: "900", marginTop: 6 },
  subtitle: { color: Colors.muted, fontSize: 10, lineHeight: 15, marginTop: 6 },
  summaryCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, padding: 15, marginTop: 20 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, paddingVertical: 5 },
  summaryLabel: { color: Colors.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.7 },
  summaryValue: { color: Colors.white, fontSize: 10, textAlign: "right", flexShrink: 1 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 9 },
  statRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 4 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { color: Colors.primary, fontSize: 15, fontWeight: "900" },
  statLabel: { color: Colors.muted, fontSize: 7, letterSpacing: 0.5, marginTop: 5, textAlign: "center" },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 25, marginBottom: 10 },
  sectionTitle: { color: "#D7E4DB", fontSize: 9, fontWeight: "800", letterSpacing: 0.9 },
  historyCount: { color: Colors.muted, fontSize: 8 },
  bookingCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 10 },
  bookingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingCode: { color: Colors.muted, fontSize: 9, fontWeight: "700" },
  status: { fontSize: 8, fontWeight: "800" },
  completed: { color: Colors.primary },
  upcoming: { color: Colors.warning },
  vehicle: { color: Colors.white, fontSize: 15, fontWeight: "800", marginTop: 10 },
  period: { color: Colors.muted, fontSize: 9, marginTop: 5 },
  destinationRow: { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 12, paddingTop: 10, gap: 4 },
  destinationLabel: { color: Colors.muted, fontSize: 7, fontWeight: "800", letterSpacing: 0.7 },
  destination: { color: "#D7E4DB", fontSize: 10 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 11 },
  amountLabel: { color: Colors.muted, fontSize: 9 },
  amount: { color: Colors.primary, fontSize: 11, fontWeight: "900" },
  emptyCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, padding: 17, borderRadius: 12 },
  emptyTitle: { color: Colors.white, fontSize: 12, fontWeight: "800" },
  emptyText: { color: Colors.muted, fontSize: 9, lineHeight: 14, marginTop: 6 },
  message: { color: Colors.muted, marginTop: 15, fontSize: 11 },
  error: { color: Colors.warning, marginTop: 15, fontSize: 11 },
});
