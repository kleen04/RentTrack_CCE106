import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";

import { Colors } from "../../constants/colors";
import useFleetVehicles from "../../hooks/useFleetVehicles";
import { getBookings, getCustomers, getMonthlyReportData } from "../../services/database";

function formatCurrency(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH")}`;
}

function getRevenueChange(current, previous) {
  if (!previous) {
    return current > 0 ? "Rental income recorded this month" : "No returned rentals recorded this month";
  }
  const difference = current - previous;
  const percentage = Math.round((Math.abs(difference) / previous) * 100);
  return `${difference >= 0 ? "↗" : "↘"} ${percentage}% vs last month`;
}

function getWeeklyRevenue(bookings, month) {
  const values = [0, 0, 0, 0, 0];
  bookings.forEach((booking) => {
    if (!booking.returnedAt) return;
    const returnedAt = new Date(booking.returnedAt);
    if (
      returnedAt.getFullYear() !== month.getFullYear() ||
      returnedAt.getMonth() !== month.getMonth()
    ) {
      return;
    }
    const weekIndex = Math.min(4, Math.floor((returnedAt.getDate() - 1) / 7));
    values[weekIndex] += Number(booking.totalAmount || 0);
  });
  return values;
}

export default function Overview() {
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const db = useSQLiteContext();
  const { vehicles, error: fleetError } = useFleetVehicles();
  const [liveBookings, setLiveBookings] = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [dataError, setDataError] = useState("");

  const loadOverviewData = useCallback(async () => {
    try {
      const currentDate = new Date();
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const [bookingRows, customerRows, report] = await Promise.all([
        getBookings(db),
        getCustomers(db),
        getMonthlyReportData(db, monthStart),
      ]);
      setLiveBookings(bookingRows);
      setCustomerCount(customerRows.length);
      setMonthlyReport(report);
      setDataError("");
    } catch (error) {
      setDataError(error?.message || "Dashboard data could not be loaded.");
    }
  }, [db]);

  useEffect(() => {
    let isActive = true;
    const subscription = addDatabaseChangeListener((event) => {
      if (
        ["bookings", "customers", "rental_transactions"].includes(event.tableName)
      ) {
        loadOverviewData();
      }
    });
    const currentDate = new Date();
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    Promise.all([
      getBookings(db),
      getCustomers(db),
      getMonthlyReportData(db, monthStart),
    ])
      .then(([bookingRows, customerRows, report]) => {
        if (!isActive) return;
        setLiveBookings(bookingRows);
        setCustomerCount(customerRows.length);
        setMonthlyReport(report);
        setDataError("");
      })
      .catch((error) => {
        if (isActive) setDataError(error?.message || "Dashboard data could not be loaded.");
      });
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, loadOverviewData]);

  const availableCount = vehicles.filter((vehicle) => vehicle.status === "AVAILABLE").length;
  const activeCount = liveBookings.filter((booking) => booking.status === "ACTIVE").length;
  const totalBookingCount = liveBookings.length;
  const reservedCount = liveBookings.filter((booking) => booking.status === "RESERVED").length;
  const today = new Date();
  const currentRevenue = (monthlyReport?.incomeBookings || []).reduce(
    (total, booking) => total + Number(booking.totalAmount || 0),
    0
  );
  const previousRevenue = (monthlyReport?.previousIncomeBookings || []).reduce(
    (total, booking) => total + Number(booking.totalAmount || 0),
    0
  );
  const weeklyRevenue = getWeeklyRevenue(
    monthlyReport?.incomeBookings || [],
    today
  );
  const maxWeeklyRevenue = Math.max(...weeklyRevenue, 1);
  const attentionBooking =
    liveBookings.find((booking) => booking.status === "ACTIVE") ||
    liveBookings.find((booking) => booking.status === "RESERVED");

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.date}>
              {today.toLocaleDateString("en-PH", {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              }).toUpperCase()}
            </Text>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setProfileMenuVisible((visible) => !visible)}
              accessibilityRole="button"
              accessibilityLabel="Open profile menu"
              activeOpacity={0.8}
            >
              <Ionicons name="person-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Fleet overview</Text>

          <Text style={styles.subtitle}>
            Here&apos;s what&apos;s happening today.
          </Text>
        </View>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>
            RENTAL INCOME • {today.toLocaleDateString("en-PH", { month: "long" }).toUpperCase()}
          </Text>

          <Text style={styles.revenueAmount}>
            {formatCurrency(currentRevenue)}
          </Text>

          <Text style={styles.revenueChange}>
            {getRevenueChange(currentRevenue, previousRevenue)}
          </Text>

          <View style={styles.chart}>
            {weeklyRevenue.map((revenue, index) => (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    height: revenue
                      ? Math.max(4, Math.round((revenue / maxWeeklyRevenue) * 60))
                      : 3,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="car-outline"
            label="TOTAL FLEET"
            value={String(vehicles.length).padStart(2, "0")}
            subtext={`${availableCount} available`}
          />

          <StatCard
            icon="time-outline"
            label="ACTIVE RENTALS"
            value={String(activeCount).padStart(2, "0")}
            subtext={`${reservedCount} confirmed reservations`}
          />

          <StatCard
            icon="calendar-outline"
            label="BOOKINGS"
            value={String(totalBookingCount).padStart(2, "0")}
            subtext="Across all booking channels"
          />

          <StatCard
            icon="people-outline"
            label="CUSTOMERS"
            value={String(customerCount).padStart(2, "0")}
            subtext="in customer records"
          />
        </View>
        {fleetError || dataError ? (
          <Text style={styles.dataError}>{fleetError || dataError}</Text>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionLabel}>
              TODAY
            </Text>

            <Text style={styles.sectionTitle}>
              Needs attention
            </Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.viewAll}>
              VIEW ALL
            </Text>
          </TouchableOpacity>
        </View>

        {attentionBooking ? (
          <View style={styles.rentalCard}>
            <View style={styles.rentalTop}>
              <Text style={styles.rentalId}>{attentionBooking.bookingCode}</Text>

              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>
                  {attentionBooking.status === "ACTIVE" ? "RENTED" : "CONFIRMED"}
                </Text>
              </View>
            </View>

            <Text style={styles.vehicleName}>{attentionBooking.vehicleName}</Text>

            <Text style={styles.customerInfo}>
              {attentionBooking.plateNumber || "Plate pending"} • {attentionBooking.customerName}
            </Text>

            <View style={styles.dateBox}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.muted}
              />

              <View>
                <Text style={styles.dateMain}>
                  {new Date(attentionBooking.pickupAt).toLocaleString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>

                <Text style={styles.dateSecondary}>
                  to {new Date(attentionBooking.returnAt).toLocaleString("en-PH", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </View>

            <View style={styles.rentalBottom}>
              <View>
                <Text style={styles.totalLabel}>TOTAL</Text>
                <Text style={styles.totalAmount}>
                  ₱{Number(attentionBooking.totalAmount).toLocaleString("en-PH")}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() =>
                  router.push({
                    pathname: "/booking/checkout",
                    params: { id: attentionBooking.bookingCode },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Open checkout for booking ${attentionBooking.bookingCode}`}
              >
                <Text style={styles.checkoutText}>Checkout</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.rentalCard}>
            <Text style={styles.customerInfo}>No confirmed or active bookings need attention.</Text>
            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push("/(tabs)/bookings")}
            >
              <Text style={styles.checkoutText}>View bookings</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.quickActions}>
          <QuickAction
            icon="add"
            label="Add vehicle"
            onPress={() => router.push("/vehicle/add")}
          />

          <QuickAction
            icon="calendar-outline"
            label="New booking"
            onPress={() => router.push("/booking/add")}
          />

          <QuickAction
            icon="bar-chart-outline"
            label="Run report"
            onPress={() => router.push("/(tabs)/reports")}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {profileMenuVisible && (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setProfileMenuVisible(false)}
            accessibilityLabel="Close profile menu"
          />

          <View style={styles.profileMenu}>
            <View style={styles.profileSummary}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={18} color={Colors.primary} />
              </View>
              <Text style={styles.accountName}>Fleet Admin</Text>
            </View>

            <View style={styles.menuDivider} />

            <MenuItem icon="person-outline" label="Profile" />
            <MenuItem icon="settings-outline" label="Settings" />
            <MenuItem icon="information-circle-outline" label="About us" />
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.replace("/(auth)/signin")}
              accessibilityRole="button"
            >
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

function MenuItem({ icon, label }) {
  return (
    <TouchableOpacity style={styles.menuItem} accessibilityRole="button">
      <Ionicons name={icon} size={18} color={Colors.muted} />
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({ icon, label, value, subtext }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>

      <Text style={styles.statLabel}>{label}</Text>

      <Text style={styles.statValue}>{value}</Text>

      <Text style={styles.statSubtext}>{subtext}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity
      style={styles.quickAction}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={23} color={Colors.primary} />

      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 30,
  },

  header: {
    marginBottom: 26,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },

  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  profileMenu: {
    position: "absolute",
    top: 76,
    right: 22,
    width: 224,
    padding: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    zIndex: 2,
    elevation: 8,
  },

  profileSummary: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 6,
  },

  profileAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
  },

  accountName: {
    flex: 1,
    color: Colors.white,
    fontSize: 13,
    fontWeight: "700",
  },

  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
  },

  menuItem: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 8,
  },

  menuItemText: {
    color: Colors.white,
    fontSize: 12,
  },

  logoutText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: "600",
  },

  date: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.3,
    marginBottom: 7,
  },

  title: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: "500",
  },

  subtitle: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 5,
  },

  revenueCard: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    padding: 20,
    height: 170,
    marginBottom: 12,
    overflow: "hidden",
  },

  revenueLabel: {
    color: "#172000",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },

  revenueAmount: {
    color: "#000000",
    fontSize: 29,
    fontWeight: "800",
    marginTop: 14,
  },

  revenueChange: {
    color: "#344A00",
    fontSize: 9,
    marginTop: 5,
  },

  chart: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    height: 65,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  bar: {
    width: "8%",
    backgroundColor: "#79A51F",
    borderRadius: 4,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  statCard: {
    width: "48.5%",
    minHeight: 136,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },

  dataError: {
    color: Colors.warning,
    fontSize: 10,
    marginBottom: 12,
  },

  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 13,
  },

  statLabel: {
    color: Colors.muted,
    fontSize: 8,
    letterSpacing: 0.7,
    marginBottom: 5,
  },

  statValue: {
    color: Colors.white,
    fontSize: 23,
    fontWeight: "800",
  },

  statSubtext: {
    color: "#50665D",
    fontSize: 8,
    marginTop: 4,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 17,
    marginBottom: 14,
  },

  sectionLabel: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 7,
  },

  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: "500",
  },

  viewAll: {
    color: Colors.muted,
    fontSize: 8,
    letterSpacing: 0.7,
    marginBottom: 2,
  },

  rentalCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
  },

  rentalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  rentalId: {
    color: Colors.muted,
    fontSize: 9,
    letterSpacing: 1,
  },

  activeBadge: {
    borderWidth: 1,
    borderColor: "#167DA2",
    backgroundColor: "#092A35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  activeText: {
    color: "#45BDE8",
    fontSize: 8,
    fontWeight: "800",
  },

  vehicleName: {
    color: Colors.white,
    fontSize: 18,
    marginTop: 16,
  },

  customerInfo: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 5,
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
    fontSize: 9,
  },

  dateSecondary: {
    color: "#536D63",
    fontSize: 9,
    marginTop: 3,
  },

  rentalBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 16,
  },

  totalLabel: {
    color: Colors.muted,
    fontSize: 8,
    marginBottom: 3,
  },

  totalAmount: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },

  checkoutButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },

  checkoutText: {
    color: "#000000",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },

  quickAction: {
    width: "31.5%",
    height: 78,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionText: {
    color: "#9AADA5",
    fontSize: 8,
    marginTop: 8,
    textAlign: "center",
  },
});