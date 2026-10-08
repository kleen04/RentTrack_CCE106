import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";

import Header from "../../components/header";
import { Colors } from "../../constants/colors";
import { getPaymentLedger, getUnpaidBookingCount } from "../../services/database";

const FILTERS = ["All", "Paid", "Pending", "Failed", "Refunded"];

function formatAmount(amount) {
  return `₱${Number(amount || 0).toLocaleString("en-PH")}`;
}

function paymentDate(payment) {
  const date = payment.paidAt || payment.createdAt;
  if (!date) return "Date not recorded";
  return new Date(date.replace(" ", "T") + (date.includes("Z") ? "" : "Z"))
    .toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
}

function isPaymentInMonth(payment, monthKey) {
  const value = payment.paidAt || payment.createdAt || "";
  if (!value) return false;
  const normalized = /^\d{4}-\d{2}-\d{2} /.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return false;
  const paymentMonthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  return paymentMonthKey === monthKey;
}

const STATUS_STYLES = {
  PAID: { color: Colors.primary, background: "#132A16", icon: "checkmark-circle-outline" },
  PENDING: { color: Colors.warning, background: "#2A2008", icon: "time-outline" },
  FAILED: { color: Colors.danger, background: "#2B1715", icon: "close-circle-outline" },
  REFUNDED: { color: "#45BDE8", background: "#092A35", icon: "return-down-back-outline" },
};

export default function Payments() {
  const db = useSQLiteContext();
  const [payments, setPayments] = useState([]);
  const [unpaidBookingCount, setUnpaidBookingCount] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const [rows, outstanding] = await Promise.all([
          getPaymentLedger(db),
          getUnpaidBookingCount(db),
        ]);
        if (!isActive) return;
        setPayments(rows);
        setUnpaidBookingCount(Number(outstanding?.bookingCount || 0));
        setLoadError("");
      } catch (error) {
        if (isActive) {
          setLoadError(error?.message || "Payment transactions could not be loaded.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "payments" || event.tableName === "bookings") {
        void load();
      }
    });
    void load();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, reloadKey]);

  const currentMonth = useMemo(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  }, []);
  const currentKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const selectedKey = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`;
  const monthPayments = payments.filter((payment) =>
    isPaymentInMonth(payment, selectedKey)
  );
  const successfulPayments = monthPayments.filter((payment) => payment.status === "PAID");
  const processedThisMonth = successfulPayments
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const filteredPayments =
    activeFilter === "All"
      ? monthPayments
      : monthPayments.filter((payment) => payment.status === activeFilter.toUpperCase());
  const statusCounts = monthPayments.reduce((counts, payment) => {
    counts[payment.status] = (counts[payment.status] || 0) + 1;
    return counts;
  }, {});
  const selectedMonthLabel = selectedMonth.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const retry = () => {
    setIsLoading(true);
    setLoadError("");
    setReloadKey((key) => key + 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Header eyebrow="PAYMENT LEDGER" title="Transactions" />

        <View style={styles.monthSelector}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View previous month"
            style={styles.monthArrow}
            onPress={() =>
              setSelectedMonth(
                (month) => new Date(month.getFullYear(), month.getMonth() - 1, 1)
              )
            }
          >
            <Ionicons name="chevron-back" size={18} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.monthLabelContainer}>
            <Text style={styles.monthEyebrow}>PAYMENT PERIOD</Text>
            <Text style={styles.monthLabel}>{selectedMonthLabel}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="View next month"
            accessibilityState={{ disabled: selectedKey === currentKey }}
            disabled={selectedKey === currentKey}
            style={[
              styles.monthArrow,
              selectedKey === currentKey && styles.monthArrowDisabled,
            ]}
            onPress={() =>
              setSelectedMonth(
                (month) => new Date(month.getFullYear(), month.getMonth() + 1, 1)
              )
            }
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={selectedKey === currentKey ? Colors.muted : Colors.white}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryLabel}>RECEIVED · {selectedMonthLabel.toUpperCase()}</Text>
              <Text style={styles.summaryAmount}>{formatAmount(processedThisMonth)}</Text>
            </View>
            <View style={styles.summaryIcon}>
              <Ionicons name="wallet-outline" size={20} color={Colors.background} />
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryBottom}>
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryMetricValue}>{successfulPayments.length}</Text>
              <Text style={styles.summaryMetricLabel}>SUCCESSFUL THIS MONTH</Text>
            </View>
            <View style={styles.summaryMetricDivider} />
            <View style={styles.summaryMetric}>
              <Text style={styles.summaryMetricValue}>{unpaidBookingCount}</Text>
              <Text style={styles.summaryMetricLabel}>OPEN BALANCES</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionEyebrow}>{selectedMonthLabel.toUpperCase()} · SHARED BOOKING PAYMENTS</Text>
            <Text style={styles.sectionTitle}>Transaction history</Text>
          </View>
          <Text style={styles.count}>{monthPayments.length} RECORDS</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter;
            const count = filter === "All" ? monthPayments.length : statusCounts[filter.toUpperCase()] || 0;
            return (
              <TouchableOpacity
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.filterChip, selected && styles.filterChipSelected]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                  {filter}
                </Text>
                <Text style={[styles.filterCount, selected && styles.filterTextSelected]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loadError ? (
          <TouchableOpacity style={styles.errorBox} onPress={retry}>
            <Ionicons name="alert-circle-outline" size={17} color={Colors.danger} />
            <Text style={styles.errorText}>{loadError} Tap to retry.</Text>
          </TouchableOpacity>
        ) : isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.emptyCopy}>Loading transaction history…</Text>
          </View>
        ) : filteredPayments.length ? (
          <View style={styles.transactionList}>
            {filteredPayments.map((payment, index) => {
              const statusStyle = STATUS_STYLES[payment.status] || STATUS_STYLES.PENDING;
              return (
                <TouchableOpacity
                  key={payment.id}
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/booking/[id]",
                      params: { id: payment.bookingCode },
                    })
                  }
                  style={[
                    styles.transaction,
                    index !== filteredPayments.length - 1 && styles.transactionDivider,
                  ]}
                >
                  <View style={[styles.transactionIcon, { backgroundColor: statusStyle.background }]}>
                    <Ionicons
                      name={statusStyle.icon}
                      size={17}
                      color={statusStyle.color}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.customerName} numberOfLines={1}>
                      {payment.customerName}
                    </Text>
                    <Text style={styles.transactionVehicle} numberOfLines={1}>
                      {payment.vehicleName}
                    </Text>
                    <Text style={styles.transactionMeta} numberOfLines={1}>
                      {payment.bookingCode} · {payment.method}
                    </Text>
                    <Text style={styles.transactionDate}>{paymentDate(payment)}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>{formatAmount(payment.amount)}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.background }]}>
                      <Text style={[styles.statusText, { color: statusStyle.color }]}>
                        {payment.status}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name={activeFilter === "All" ? "receipt-outline" : "filter-outline"}
                size={23}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === "All" ? "No payments recorded yet" : `No ${activeFilter.toLowerCase()} payments`}
            </Text>
            <Text style={styles.emptyCopy}>
              {activeFilter === "All"
                ? `No payments were recorded in ${selectedMonthLabel}. Completed demo checkouts will appear here with their booking, payment method, and reference.`
                : `There are no ${activeFilter.toLowerCase()} payments in ${selectedMonthLabel}. Try another status filter or return to all transactions.`}
            </Text>
            {activeFilter === "All" && unpaidBookingCount > 0 ? (
              <TouchableOpacity
                style={styles.bookingsButton}
                onPress={() => router.push("/(tabs)/bookings")}
              >
                <Text style={styles.bookingsButtonText}>
                  View {unpaidBookingCount} booking{unpaidBookingCount === 1 ? "" : "s"} with an open balance
                </Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.background} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}
        <Text style={styles.disclaimer}>
          Prototype ledger · transactions are local demo records only.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 34 },
  monthSelector: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18, marginBottom: 2 },
  monthArrow: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card },
  monthArrowDisabled: { opacity: 0.45 },
  monthLabelContainer: { alignItems: "center" },
  monthEyebrow: { color: Colors.primary, fontSize: 7, fontWeight: "800", letterSpacing: 0.9 },
  monthLabel: { color: Colors.white, fontSize: 14, fontWeight: "800", marginTop: 4 },
  summaryCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 17, marginTop: 18, marginBottom: 22 },
  summaryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel: { color: "#344A00", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  summaryAmount: { color: Colors.background, fontSize: 29, fontWeight: "900", marginTop: 7 },
  summaryIcon: { width: 39, height: 39, borderRadius: 12, backgroundColor: "#D2FF70", alignItems: "center", justifyContent: "center" },
  summaryDivider: { height: 1, backgroundColor: "#47651A55", marginVertical: 13 },
  summaryBottom: { flexDirection: "row", alignItems: "center" },
  summaryMetric: { flex: 1 },
  summaryMetricValue: { color: Colors.background, fontSize: 17, fontWeight: "900" },
  summaryMetricLabel: { color: "#344A00", fontSize: 7, fontWeight: "800", letterSpacing: 0.4, marginTop: 3 },
  summaryMetricDivider: { width: 1, height: 29, backgroundColor: "#47651A55", marginHorizontal: 13 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
  sectionEyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  sectionTitle: { color: Colors.white, fontSize: 16, fontWeight: "800", marginTop: 5 },
  count: { color: Colors.muted, fontSize: 7, fontWeight: "700", letterSpacing: 0.6, marginBottom: 2 },
  filters: { gap: 7, paddingBottom: 14 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 8 },
  filterChipSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { color: Colors.muted, fontSize: 9, fontWeight: "600" },
  filterCount: { color: Colors.muted, fontSize: 8, fontWeight: "800" },
  transactionList: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 12 },
  transaction: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 13 },
  transactionDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  transactionIcon: { width: 35, height: 35, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  transactionInfo: { flex: 1, minWidth: 0 },
  customerName: { color: Colors.white, fontSize: 10, fontWeight: "800" },
  transactionVehicle: { color: "#B8C8C0", fontSize: 8, marginTop: 2 },
  transactionMeta: { color: Colors.muted, fontSize: 7, marginTop: 3 },
  transactionDate: { color: Colors.muted, fontSize: 7, marginTop: 3 },
  transactionRight: { alignItems: "flex-end" },
  transactionAmount: { color: Colors.white, fontSize: 10, fontWeight: "800" },
  statusBadge: { borderRadius: 5, paddingHorizontal: 6, paddingVertical: 4, marginTop: 5 },
  statusText: { fontSize: 6, fontWeight: "900", letterSpacing: 0.4 },
  emptyCard: { alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 24 },
  emptyIcon: { width: 46, height: 46, backgroundColor: "#10291E", borderRadius: 14, alignItems: "center", justifyContent: "center" },
  emptyTitle: { color: Colors.white, fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 12 },
  emptyCopy: { color: Colors.muted, fontSize: 9, textAlign: "center", lineHeight: 14, marginTop: 6 },
  bookingsButton: { minHeight: 39, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: Colors.primary, borderRadius: 9, paddingHorizontal: 11, marginTop: 14 },
  bookingsButtonText: { color: Colors.background, fontSize: 8, fontWeight: "900" },
  disclaimer: { color: Colors.muted, fontSize: 8, textAlign: "center", marginTop: 14 },
  loading: { minHeight: 140, alignItems: "center", justifyContent: "center", gap: 10 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 13, borderWidth: 1, borderColor: Colors.border, borderRadius: 11, backgroundColor: Colors.card },
  errorText: { flex: 1, color: Colors.danger, fontSize: 9, lineHeight: 14 },
});
