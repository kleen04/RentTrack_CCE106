import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";

import Header from "../../components/header";
import { Colors } from "../../constants/colors";
import { VEHICLE_IMAGES } from "../../constants/vehicleImages";
import {
  getDateRangeReportRows,
  getMonthlyReportData,
  getVehicleUsageReportRows,
} from "../../services/database";

const REPORT_TABLES = new Set(["bookings", "vehicles", "customers", "rental_transactions"]);
const REPORT_TYPES = [
  { id: "income", label: "Completed rental revenue" },
  { id: "history", label: "Rental history" },
  { id: "reservations", label: "Reservations" },
  { id: "usage", label: "Vehicle usage" },
];

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateInputValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function formatCurrency(amount, compact = false) {
  if (compact && amount >= 1000000) {
    return `₱${(amount / 1000000).toFixed(1)}m`;
  }
  if (compact && amount >= 10000) {
    return `₱${(amount / 1000).toFixed(1)}k`;
  }
  return `₱${Number(amount || 0).toLocaleString("en-PH")}`;
}

function csvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function createCsv(rows) {
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

function completedBookings(bookings) {
  return bookings.filter((booking) => booking.status === "COMPLETED");
}

function completedRevenue(bookings) {
  return completedBookings(bookings).reduce(
    (total, booking) => total + Number(booking.totalAmount || 0),
    0
  );
}

function timestamp(value) {
  if (!value) return Number.NaN;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2} /.test(value)) {
    return new Date(`${value.replace(" ", "T")}Z`).getTime();
  }
  return new Date(value).getTime();
}

function calculateUtilization(bookings, monthStart, fleetVehicles) {
  const start = monthStart.getTime();
  const monthEnd = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    1
  ).getTime();
  const now = Date.now();
  const isCurrentMonth =
    monthStart.getFullYear() === new Date(now).getFullYear() &&
    monthStart.getMonth() === new Date(now).getMonth();
  const end = isCurrentMonth ? Math.min(monthEnd, now) : monthEnd;
  const bookedMilliseconds = bookings.reduce((total, booking) => {
    const released = timestamp(booking.releasedAt);
    const returned = booking.returnedAt ? timestamp(booking.returnedAt) : end;
    if (!Number.isFinite(released) || !Number.isFinite(returned)) return total;
    return total + Math.max(0, Math.min(returned, end) - Math.max(released, start));
  }, 0);
  const fleetMilliseconds = fleetVehicles.reduce((total, vehicle) => {
    const created = timestamp(vehicle.createdAt);
    const archived = vehicle.archivedAt ? timestamp(vehicle.archivedAt) : end;
    if (!Number.isFinite(created) || !Number.isFinite(archived)) return total;
    return total + Math.max(0, Math.min(archived, end) - Math.max(created, start));
  }, 0);
  if (!fleetMilliseconds) return 0;
  return Math.min(100, Math.round((bookedMilliseconds / fleetMilliseconds) * 100));
}

function changeLabel(current, previous, format = (value) => String(value)) {
  if (current === previous) return "No change vs previous month";
  if (previous === 0) {
    return current > 0 ? `${format(current)} this month` : "No activity this month";
  }
  const difference = current - previous;
  const percentage = Math.round((Math.abs(difference) / previous) * 100);
  return `${difference > 0 ? "↑" : "↓"} ${percentage}% vs previous month`;
}

function getWeeklyRevenue(bookings, monthStart) {
  const weeklyRevenue = [0, 0, 0, 0, 0];
  completedBookings(bookings).forEach((booking) => {
    if (!booking.returnedAt) return;
    const returned = new Date(booking.returnedAt);
    if (
      returned.getFullYear() === monthStart.getFullYear() &&
      returned.getMonth() === monthStart.getMonth()
    ) {
      const weekIndex = Math.min(4, Math.floor((returned.getDate() - 1) / 7));
      weeklyRevenue[weekIndex] += Number(booking.totalAmount || 0);
    }
  });
  return weeklyRevenue;
}

function getTopPerformer(bookings) {
  const byVehicle = new Map();
  bookings.forEach((booking) => {
    if (!["ACTIVE", "COMPLETED"].includes(booking.status)) return;
    const performer = byVehicle.get(booking.vehicleId) || {
      id: booking.vehicleId,
      brand: booking.vehicleBrand,
      name: booking.vehicleName,
      imageAssetKey: booking.imageAssetKey,
      rentals: 0,
      completedRevenue: 0,
    };
    performer.rentals += 1;
    if (booking.status === "COMPLETED") {
      performer.completedRevenue += Number(booking.totalAmount || 0);
    }
    byVehicle.set(booking.vehicleId, performer);
  });
  return [...byVehicle.values()].sort(
    (a, b) => b.rentals - a.rentals || b.completedRevenue - a.completedRevenue
  )[0] || null;
}

export default function Reports() {
  const db = useSQLiteContext();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [reportStartDate, setReportStartDate] = useState(() =>
    dateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [reportEndDate, setReportEndDate] = useState(() => dateInputValue(now));
  const [selectedReportType, setSelectedReportType] = useState("income");
  const [rangeRows, setRangeRows] = useState([]);
  const [usageRows, setUsageRows] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [rangeError, setRangeError] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadReport = async () => {
      try {
        const nextReport = await getMonthlyReportData(db, selectedMonth);
        if (!isActive) return;
        setReport({ ...nextReport, monthKey: monthKey(selectedMonth) });
        setLoadError("");
      } catch (error) {
        if (isActive) {
          setLoadError(error?.message || "The monthly report could not be loaded.");
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    const subscription = addDatabaseChangeListener((event) => {
      if (REPORT_TABLES.has(event.tableName)) void loadReport();
    });
    void loadReport();

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, selectedMonth, reloadKey]);

  useEffect(() => {
    let isActive = true;

    const loadRangeRows = async () => {
      const start = parseDateInput(reportStartDate);
      const end = parseDateInput(reportEndDate);
      if (!start || !end || end < start) {
        setRangeRows([]);
        setRangeError("Enter a valid date range using YYYY-MM-DD.");
        setRangeLoading(false);
        return;
      }

      const endExclusive = new Date(end);
      endExclusive.setDate(endExclusive.getDate() + 1);
      setRangeLoading(true);
      try {
        const [rows, vehicleRows] = await Promise.all([
          getDateRangeReportRows(db, start, endExclusive),
          getVehicleUsageReportRows(db, start, endExclusive),
        ]);
        if (!isActive) return;
        setRangeRows(rows);
        setUsageRows(vehicleRows);
        setRangeError("");
      } catch (error) {
        if (isActive) setRangeError(error?.message || "The selected report could not be loaded.");
      } finally {
        if (isActive) setRangeLoading(false);
      }
    };

    const subscription = addDatabaseChangeListener((event) => {
      if (REPORT_TABLES.has(event.tableName)) void loadRangeRows();
    });
    void loadRangeRows();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, reportStartDate, reportEndDate, reloadKey]);

  const selectedKey = monthKey(selectedMonth);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const isCurrentMonth =
    selectedMonth.getFullYear() === currentMonth.getFullYear() &&
    selectedMonth.getMonth() === currentMonth.getMonth();
  const reportIsCurrent = report?.monthKey === selectedKey;
  const currentData = reportIsCurrent ? report : null;
  const bookings = currentData?.bookings || [];
  const incomeBookings = currentData?.incomeBookings || [];
  const previousIncomeBookings = currentData?.previousIncomeBookings || [];
  const monthRevenue = completedRevenue(incomeBookings);
  const previousRevenue = completedRevenue(previousIncomeBookings);
  const completedCount = completedBookings(incomeBookings).length;
  const previousCompletedCount = completedBookings(previousIncomeBookings).length;
  const averageBooking = completedCount ? monthRevenue / completedCount : 0;
  const previousAverage =
    previousCompletedCount ? previousRevenue / previousCompletedCount : 0;
  const utilization = currentData
    ? calculateUtilization(
        currentData.utilizationBookings,
        selectedMonth,
        currentData.fleetVehicles
      )
    : 0;
  const previousMonth = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() - 1,
    1
  );
  const previousUtilization = currentData
    ? calculateUtilization(
        currentData.previousUtilizationBookings,
        previousMonth,
        currentData.fleetVehicles
      )
    : 0;
  const weeklyRevenue = getWeeklyRevenue(incomeBookings, selectedMonth);
  const maxWeeklyRevenue = Math.max(...weeklyRevenue, 1);
  const topPerformer = getTopPerformer(bookings);
  const monthlyRentalCount = bookings.filter((booking) =>
    ["ACTIVE", "COMPLETED"].includes(booking.status)
  ).length;
  const topShare = monthlyRentalCount
    ? Math.round((topPerformer?.rentals || 0) / monthlyRentalCount * 100)
    : 0;
  const monthTitle = selectedMonth.toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
  const rangeEnd = new Date(
    selectedMonth.getFullYear(),
    selectedMonth.getMonth() + 1,
    0
  );
  const dateRange = `${selectedMonth.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })} – ${rangeEnd.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
  const reportStart = parseDateInput(reportStartDate);
  const reportEndExclusive = parseDateInput(reportEndDate);
  if (reportEndExclusive) reportEndExclusive.setDate(reportEndExclusive.getDate() + 1);
  const isDateInRange = (value) => {
    if (!value || !reportStart || !reportEndExclusive) return false;
    const timestamp = new Date(value).getTime();
    return timestamp >= reportStart.getTime() && timestamp < reportEndExclusive.getTime();
  };
  const reservationRows = rangeRows.filter((row) => isDateInRange(row.pickupAt));
  const transactionRows = rangeRows.filter(
    (row) => isDateInRange(row.releasedAt) || isDateInRange(row.returnedAt)
  );
  const completedRangeRows = rangeRows.filter((row) =>
    row.status === "COMPLETED" && isDateInRange(row.returnedAt)
  );
  const reportRevenue = completedRangeRows.reduce(
    (sum, row) => sum + Number(row.totalAmount || 0),
    0
  );
  const statusCounts = reservationRows.reduce((counts, row) => {
    counts[row.status] = (counts[row.status] || 0) + 1;
    return counts;
  }, {});
  const channelCounts = reservationRows.reduce((counts, row) => {
    counts[row.bookingChannel] = (counts[row.bookingChannel] || 0) + 1;
    return counts;
  }, {});
  const vehicleUsage = Object.entries(
    usageRows.reduce((usage, row) => {
        if (!Object.prototype.hasOwnProperty.call(usage, row.vehicleName)) {
          usage[row.vehicleName] = 0;
        }
        if (!row.releasedAt) return usage;
        const release = new Date(row.releasedAt).getTime();
        const returnedAt = row.returnedAt
          ? new Date(row.returnedAt).getTime()
          : Number.POSITIVE_INFINITY;
        const start = Math.max(release, reportStart?.getTime() || release);
        const end = Math.min(returnedAt, reportEndExclusive?.getTime() || returnedAt);
        const days = Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
        if (!days) return usage;
        usage[row.vehicleName] = (usage[row.vehicleName] || 0) + days;
        return usage;
      }, {})
  ).sort((a, b) => b[1] - a[1]);
  const totalUsageDays = vehicleUsage.reduce((total, row) => total + row[1], 0);

  const exportReportSpreadsheet = async () => {
    setIsExporting(true);
    try {
      const rows = [
        ["RentTrack Business Intelligence Report"],
        ["Monthly report", monthTitle],
        ["Monthly period", dateRange],
        [],
        ["Monthly overview"],
        ["Metric", "Value", "Compared with previous month"],
        ["Completed rental revenue (PHP)", monthRevenue, changeLabel(monthRevenue, previousRevenue, formatCurrency)],
        ["Fleet utilization (%)", utilization, changeLabel(utilization, previousUtilization, (value) => `${value}%`)],
        ["Completed rentals", completedCount, changeLabel(completedCount, previousCompletedCount)],
        ["Average booking (PHP)", averageBooking, changeLabel(averageBooking, previousAverage, (value) => formatCurrency(value, true))],
        ["New customers", currentData?.customerCount || 0, changeLabel(
          currentData?.customerCount || 0,
          currentData?.previousCustomerCount || 0
        )],
        ["Bookings", bookings.length, ""],
        [],
        ["Weekly revenue"],
        ["Week", "Completed rental revenue (PHP)"],
        ...weeklyRevenue.map((amount, index) => [`Week ${index + 1}`, amount]),
        [],
        ["Top performer"],
        ["Vehicle", "Rentals", "Completed revenue (PHP)", "Share of released rentals (%)"],
        topPerformer
          ? [
              `${topPerformer.brand} ${topPerformer.name}`.trim(),
              topPerformer.rentals,
              topPerformer.completedRevenue,
              topShare,
            ]
          : ["No bookings to rank for this month.", 0, 0, 0],
        [],
        ["Monthly bookings"],
        ["Booking ID", "Vehicle", "Status", "Pickup", "Expected return", "Total amount (PHP)"],
        ...(bookings.length
          ? bookings.map((booking) => [
              booking.id,
              `${booking.vehicleBrand} ${booking.vehicleName}`.trim(),
              booking.status,
              booking.pickupAt,
              booking.returnAt,
              Number(booking.totalAmount || 0),
            ])
          : [["No monthly booking records", "", "", "", "", ""]]),
        [],
        ["Date-range reports", `${reportStartDate} to ${reportEndDate}`],
        [],
        ["Completed rental revenue by vehicle type"],
        ["Vehicle type", "Returned rentals", "Revenue (PHP)"],
        ...["All vehicle types", "Car", "Motorcycle"].map((type) => {
          const matchingRows = type === "All vehicle types"
            ? completedRangeRows
            : completedRangeRows.filter(
                (row) => row.vehicleType?.toLowerCase() === type.toLowerCase()
              );
          return [
            type,
            matchingRows.length,
            matchingRows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0),
          ];
        }),
        [],
        ["Reservations"],
        ["Category", "Metric", "Count"],
        ...["RESERVED", "ACTIVE", "COMPLETED", "CANCELLED"].map((status) => [
          "Reservation status",
          status === "RESERVED" ? "Confirmed" : status === "ACTIVE" ? "Rented" : status === "COMPLETED" ? "Returned" : status,
          statusCounts[status] || 0,
        ]),
        ...[
          ["FACEBOOK", "Facebook"],
          ["PHONE_MESSENGER", "Phone / Messenger"],
          ["WALK_IN", "Walk-in"],
        ].map(([channel, label]) => ["Booking channel", label, channelCounts[channel] || 0]),
        [],
        ["Rental history"],
        ["Booking code", "Customer", "Vehicle", "Vehicle type", "Status", "Booking channel", "Pickup", "Expected return", "Released", "Returned", "Total amount (PHP)", "Processed by", "Remarks"],
        ...(transactionRows.length
          ? transactionRows.map((row) => [
              row.bookingCode,
              row.customerName,
              row.vehicleName,
              row.vehicleType,
              row.status,
              row.bookingChannel,
              row.pickupAt,
              row.returnAt,
              row.releasedAt,
              row.returnedAt,
              Number(row.totalAmount || 0),
              row.processedBy,
              row.remarks,
            ])
          : [["No rental history in this date range"]]),
        [],
        ["Vehicle usage"],
        ["Rank", "Vehicle", "Rental days"],
        ...(vehicleUsage.length
          ? vehicleUsage.map(([vehicleName, days], index) => [index + 1, vehicleName, days])
          : [["No vehicles found for this date range", "", ""]]),
        ["Total vehicle rental days", "", totalUsageDays],
      ];
      const csv = createCsv(rows);
      const filename = `RentTrack_Report_${monthKey(selectedMonth)}_${reportStartDate}_to_${reportEndDate}.csv`;

      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const downloadUrl = globalThis.URL.createObjectURL(blob);
        const link = globalThis.document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        globalThis.document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.setTimeout(() => globalThis.URL.revokeObjectURL(downloadUrl), 1000);
      } else {
        const file = new File(Paths.cache, filename);
        file.create({ overwrite: true });
        file.write(csv);
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Save report spreadsheet",
        });
      }
    } catch (error) {
      const message = error?.message || "The report spreadsheet could not be exported.";
      if (Platform.OS === "web") {
        globalThis.alert(`Unable to export report: ${message}`);
      } else {
        Alert.alert("Unable to export report", message);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const shiftMonth = (offset) => {
    setIsLoading(true);
    setLoadError("");
    setSelectedMonth(
      new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1)
    );
  };

  const retryLoad = () => {
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
        <Header eyebrow="BUSINESS INTELLIGENCE" title="Reports" />

        <View style={styles.periodCard}>
          <View style={styles.periodHeading}>
            <View>
              <Text style={styles.sectionEyebrow}>REPORTING PERIOD</Text>
              <Text style={styles.periodRange}>{dateRange}</Text>
            </View>
            <View style={styles.periodTag}>
              <View style={styles.periodDot} />
              <Text style={styles.periodTagText}>MONTHLY</Text>
            </View>
          </View>
          <View style={styles.monthSelector}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show previous month"
              onPress={() => shiftMonth(-1)}
              style={({ pressed }) => [
                styles.monthArrow,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={Colors.primary} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthTitle}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show next month"
              accessibilityState={{ disabled: isCurrentMonth }}
              disabled={isCurrentMonth}
              onPress={() => shiftMonth(1)}
              style={({ pressed }) => [
                styles.monthArrow,
                isCurrentMonth && styles.monthArrowDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={isCurrentMonth ? Colors.muted : Colors.primary}
              />
            </Pressable>
          </View>
        </View>

        {loadError ? (
          <Pressable
            accessibilityRole="button"
            onPress={retryLoad}
            style={styles.errorBox}
          >
            <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{loadError} Tap to retry.</Text>
          </Pressable>
        ) : isLoading && !currentData ? (
          <View style={styles.loading}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Loading monthly report…</Text>
          </View>
        ) : (
          <>
            <View style={styles.revenueCard}>
              <View style={styles.revenueHeader}>
                <View>
                  <Text style={styles.revenueLabel}>COMPLETED RENTAL REVENUE</Text>
                  <Text style={styles.revenueHint}>Counted when the return is recorded</Text>
                </View>
                <View style={styles.revenueIcon}>
                  <Ionicons name="trending-up-outline" size={19} color={Colors.primary} />
                </View>
              </View>
              <Text style={styles.revenueAmount}>{formatCurrency(monthRevenue)}</Text>
              <Text style={styles.revenueChange}>
                {changeLabel(monthRevenue, previousRevenue, formatCurrency)}
              </Text>

              <View style={styles.chartDivider} />
              <View style={styles.chartHeading}>
                <Text style={styles.chartTitle}>WEEKLY REVENUE</Text>
                <Text style={styles.chartUnit}>COMPLETED RENTALS</Text>
              </View>
              <View style={styles.chartRow}>
                {weeklyRevenue.map((amount, index) => {
                  const height = amount
                    ? Math.max(7, Math.round((amount / maxWeeklyRevenue) * 70))
                    : 4;
                  return (
                    <View key={index} style={styles.chartCol}>
                      <Text style={styles.chartAmount}>
                        {amount ? formatCurrency(amount, true) : "—"}
                      </Text>
                      <View style={styles.chartTrack}>
                        <View style={[styles.chartBar, { height }]} />
                      </View>
                      <Text style={styles.chartDay}>W{index + 1}</Text>
                    </View>
                  );
                })}
              </View>
              {!monthRevenue && (
                <Text style={styles.chartEmpty}>
                  No completed rental revenue recorded for this month.
                </Text>
              )}
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>MONTHLY SNAPSHOT</Text>
                <Text style={styles.sectionTitle}>Performance overview</Text>
              </View>
              <Text style={styles.bookingCount}>
                {bookings.length} BOOKING{bookings.length === 1 ? "" : "S"}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <StatCard
                icon="car-outline"
                label="FLEET UTILIZATION"
                value={`${utilization}%`}
                change={changeLabel(utilization, previousUtilization, (value) => `${value}%`)}
              />
              <StatCard
                icon="checkmark-done-outline"
                label="COMPLETED RENTALS"
                value={String(completedCount)}
                change={changeLabel(completedCount, previousCompletedCount)}
              />
              <StatCard
                icon="card-outline"
                label="AVG. BOOKING"
                value={formatCurrency(averageBooking, true)}
                change={changeLabel(averageBooking, previousAverage, (value) =>
                  formatCurrency(value, true)
                )}
              />
              <StatCard
                icon="person-add-outline"
                label="NEW CUSTOMERS"
                value={String(currentData?.customerCount || 0)}
                change={changeLabel(
                  currentData?.customerCount || 0,
                  currentData?.previousCustomerCount || 0
                )}
              />
            </View>

            <View style={styles.topCard}>
              <View style={styles.topCardHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>MOST RENTED VEHICLE</Text>
                  <Text style={styles.sectionTitle}>Top performer</Text>
                </View>
                <View style={styles.topBadge}>
                  <Ionicons name="trophy-outline" size={13} color={Colors.primary} />
                  <Text style={styles.topBadgeText}>#1</Text>
                </View>
              </View>
              {topPerformer ? (
                <>
                  <View style={styles.performerRow}>
                    <View style={styles.performerImageWrap}>
                      {VEHICLE_IMAGES[topPerformer.imageAssetKey] ? (
                        <Image
                          source={VEHICLE_IMAGES[topPerformer.imageAssetKey]}
                          style={styles.performerImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name="car-sport-outline"
                          size={27}
                          color={Colors.primary}
                        />
                      )}
                    </View>
                    <View style={styles.performerInfo}>
                      <Text style={styles.performerMake}>{topPerformer.brand}</Text>
                      <Text style={styles.performerName}>{topPerformer.name}</Text>
                      <Text style={styles.performerSubtext}>
                        {topPerformer.rentals} rental
                        {topPerformer.rentals === 1 ? "" : "s"}
                        {topPerformer.completedRevenue > 0
                          ? ` · ${formatCurrency(topPerformer.completedRevenue, true)} completed revenue`
                          : ""}
                      </Text>
                    </View>
                    <Text style={styles.performerRevenue}>
                      {topPerformer.rentals}
                      <Text style={styles.performerRentalLabel}> rentals</Text>
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${topShare}%` }]} />
                  </View>
                  <Text style={styles.progressCaption}>
                    {topShare}% of this month&apos;s released rentals
                  </Text>
                </>
              ) : (
                <View style={styles.emptyPerformer}>
                  <Ionicons name="car-outline" size={24} color={Colors.muted} />
                  <Text style={styles.emptyPerformerText}>
                    No bookings to rank for this month.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.reportCard}>
              <View style={styles.reportHeading}>
                <View>
                  <Text style={styles.sectionEyebrow}>REPORTS</Text>
                  <Text style={styles.sectionTitle}>Date-range reports</Text>
                </View>
                <Text style={styles.bookingCount}>{rangeRows.length} RECORDS</Text>
              </View>
              <View style={styles.reportDateRow}>
                <View style={styles.reportDateField}>
                  <Text style={styles.reportDateLabel}>FROM · YYYY-MM-DD</Text>
                  <TextInput
                    value={reportStartDate}
                    onChangeText={setReportStartDate}
                    style={styles.reportDateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.muted}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.reportDateField}>
                  <Text style={styles.reportDateLabel}>TO · YYYY-MM-DD</Text>
                  <TextInput
                    value={reportEndDate}
                    onChangeText={setReportEndDate}
                    style={styles.reportDateInput}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={Colors.muted}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.reportTypeRow}>
                {REPORT_TYPES.map((type) => {
                  const selected = selectedReportType === type.id;
                  return (
                    <TouchableOpacity
                      key={type.id}
                      onPress={() => setSelectedReportType(type.id)}
                      style={[styles.reportTypeChip, selected && styles.reportTypeChipActive]}
                    >
                      <Text style={[styles.reportTypeText, selected && styles.reportTypeTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {rangeError ? (
                <Text style={styles.rangeError}>{rangeError}</Text>
              ) : rangeLoading ? (
                <View style={styles.rangeLoading}>
                  <ActivityIndicator color={Colors.primary} />
                  <Text style={styles.rangeLoadingText}>Loading selected report…</Text>
                </View>
              ) : (
                <View style={styles.rangeReportBody}>
                  {selectedReportType === "income" ? (
                    <>
                      <ReportMetric label="INCOME FROM RETURNED RENTALS" value={formatCurrency(reportRevenue)} />
                      {["Car", "Motorcycle"].map((type) => {
                        const amount = completedRangeRows
                          .filter((row) => row.vehicleType?.toLowerCase() === type.toLowerCase())
                          .reduce((sum, row) => sum + Number(row.totalAmount || 0), 0);
                        return <ReportMetric key={type} label={type.toUpperCase()} value={formatCurrency(amount)} />;
                      })}
                      <Text style={styles.reportHint}>Income is counted when a vehicle return is recorded.</Text>
                    </>
                  ) : null}
                  {selectedReportType === "history" ? (
                    transactionRows.length ? transactionRows.map((row) => (
                      <View key={row.id} style={styles.reportRecord}>
                        <Text style={styles.reportRecordTitle}>{row.bookingCode} · {row.vehicleName}</Text>
                        <Text style={styles.reportRecordText}>{row.customerName} · {row.status}</Text>
                        <Text style={styles.reportRecordText}>Released {row.releasedAt ? new Date(row.releasedAt).toLocaleDateString("en-PH") : "Not released"} · Returned {row.returnedAt ? new Date(row.returnedAt).toLocaleDateString("en-PH") : "Not returned"}</Text>
                        <Text style={styles.reportRecordText}>{formatCurrency(row.totalAmount)} · {row.processedBy || "No transaction recorded"}</Text>
                      </View>
                    )) : <Text style={styles.reportHint}>No rental history in this date range.</Text>
                  ) : null}
                  {selectedReportType === "reservations" ? (
                    <>
                      <Text style={styles.reportSubheading}>BY STATUS</Text>
                      {["RESERVED", "ACTIVE", "COMPLETED", "CANCELLED"].map((status) => (
                        <ReportMetric key={status} label={status === "RESERVED" ? "CONFIRMED" : status === "ACTIVE" ? "RENTED" : status === "COMPLETED" ? "RETURNED" : status} value={String(statusCounts[status] || 0)} />
                      ))}
                      <Text style={[styles.reportSubheading, styles.reportSubheadingSpaced]}>BY BOOKING CHANNEL</Text>
                      {[
                        ["FACEBOOK", "Facebook"],
                        ["PHONE_MESSENGER", "Phone / Messenger"],
                        ["WALK_IN", "Walk-in"],
                      ].map(([channel, label]) => (
                        <ReportMetric key={channel} label={label} value={String(channelCounts[channel] || 0)} />
                      ))}
                    </>
                  ) : null}
                  {selectedReportType === "usage" ? (
                    vehicleUsage.length && totalUsageDays ? vehicleUsage.map(([vehicleName, days], index) => (
                      <ReportMetric
                        key={vehicleName}
                        label={`${index === 0 ? "MOST USED · " : index === vehicleUsage.length - 1 ? "LEAST USED · " : ""}${vehicleName}`}
                        value={`${days} day${days === 1 ? "" : "s"}`}
                      />
                    )) : <Text style={styles.reportHint}>No released rentals in this date range; each active fleet vehicle has zero rental days.</Text>
                  ) : null}
                </View>
              )}

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{
                  disabled: isExporting || isLoading || !currentData || rangeLoading || Boolean(rangeError),
                }}
                disabled={isExporting || isLoading || !currentData || rangeLoading || Boolean(rangeError)}
                style={[
                  styles.reportExportButton,
                  (isExporting || isLoading || !currentData || rangeLoading || Boolean(rangeError)) &&
                    styles.reportExportButtonDisabled,
                ]}
                onPress={exportReportSpreadsheet}
              >
                <Ionicons name="download-outline" size={15} color={Colors.background} />
                <Text style={styles.reportExportText}>
                  {isExporting ? "Exporting spreadsheet…" : "Download full report spreadsheet"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.reportHint}>
                Exports the monthly overview and all date-range report details as a CSV spreadsheet.
              </Text>
            </View>

            <View style={styles.note}>
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={Colors.muted}
              />
              <Text style={styles.noteText}>
                Completed rental revenue is counted when a return is recorded; it is
                separate from payments received. Utilization uses recorded release-to-return
                time against fleet availability; the current month is measured to date.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({ icon, label, value, change }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={17} color={Colors.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text adjustsFontSizeToFit numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
      <Text numberOfLines={2} style={styles.statChange}>
        {change}
      </Text>
    </View>
  );
}

function ReportMetric({ label, value }) {
  return (
    <View style={styles.reportMetric}>
      <Text style={styles.reportMetricLabel}>{label}</Text>
      <Text style={styles.reportMetricValue}>{value}</Text>
    </View>
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
    paddingBottom: 34,
  },
  periodCard: {
    marginTop: 20,
    marginBottom: 14,
    padding: 15,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
  },
  periodHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionEyebrow: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  periodRange: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 5,
  },
  periodTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#10291E",
  },
  periodDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  periodTagText: {
    color: Colors.primary,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  monthArrow: {
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  monthArrowDisabled: {
    opacity: 0.45,
  },
  monthTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.7,
  },
  revenueCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 17,
    marginBottom: 20,
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  revenueLabel: {
    color: Colors.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  revenueHint: {
    color: Colors.muted,
    fontSize: 9,
    marginTop: 5,
  },
  revenueIcon: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
  },
  revenueAmount: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: "900",
    marginTop: 12,
  },
  revenueChange: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "700",
    marginTop: 5,
  },
  chartDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 17,
  },
  chartHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  chartTitle: {
    color: "#D7E4DB",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  chartUnit: {
    color: Colors.muted,
    fontSize: 7,
    letterSpacing: 0.4,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 112,
    marginTop: 10,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  chartAmount: {
    color: Colors.muted,
    fontSize: 7,
    height: 13,
  },
  chartTrack: {
    height: 76,
    justifyContent: "flex-end",
    width: 18,
    backgroundColor: "#0A1E15",
    borderRadius: 6,
    overflow: "hidden",
  },
  chartBar: {
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
    opacity: 0.9,
  },
  chartDay: {
    color: Colors.muted,
    fontSize: 8,
    marginTop: 6,
  },
  chartEmpty: {
    color: Colors.muted,
    fontSize: 9,
    marginTop: 9,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },
  bookingCount: {
    color: Colors.muted,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    width: "48.5%",
    minHeight: 133,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statLabel: {
    color: Colors.muted,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.55,
    marginBottom: 5,
  },
  statValue: {
    color: Colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  statChange: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "600",
    marginTop: 5,
  },
  topCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 16,
    marginTop: 2,
  },
  topCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    backgroundColor: "#10291E",
    borderRadius: 8,
  },
  topBadgeText: {
    color: Colors.primary,
    fontSize: 9,
    fontWeight: "900",
  },
  performerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  performerImageWrap: {
    width: 58,
    height: 48,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: "#10291E",
    alignItems: "center",
    justifyContent: "center",
  },
  performerImage: {
    width: "100%",
    height: "100%",
  },
  performerInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },
  performerMake: {
    color: Colors.muted,
    fontSize: 8,
    fontWeight: "700",
  },
  performerName: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
  },
  performerSubtext: {
    color: Colors.muted,
    fontSize: 8,
    marginTop: 4,
  },
  performerRevenue: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },
  progressTrack: {
    height: 5,
    borderRadius: 4,
    backgroundColor: "#183428",
    overflow: "hidden",
    marginTop: 16,
  },
  progressBar: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressCaption: {
    color: Colors.muted,
    fontSize: 8,
    marginTop: 6,
  },
  emptyPerformer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  emptyPerformerText: {
    flex: 1,
    color: Colors.muted,
    fontSize: 10,
  },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    marginTop: 15,
    paddingHorizontal: 2,
  },
  noteText: {
    flex: 1,
    color: Colors.muted,
    fontSize: 8,
    lineHeight: 13,
  },
  reportCard: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 15,
    padding: 14,
    marginTop: 16,
  },
  reportHeading: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  reportDateRow: {
    flexDirection: "row",
    gap: 9,
    marginTop: 15,
  },
  reportDateField: {
    flex: 1,
  },
  reportDateLabel: {
    color: Colors.muted,
    fontSize: 7,
    fontWeight: "800",
    marginBottom: 6,
  },
  reportDateInput: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 9,
    color: Colors.white,
    backgroundColor: Colors.surface,
    fontSize: 9,
  },
  reportTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  reportTypeChip: {
    minHeight: 31,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 7,
    paddingHorizontal: 8,
  },
  reportTypeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: "#14271A",
  },
  reportTypeText: {
    color: Colors.muted,
    fontSize: 8,
    fontWeight: "700",
  },
  reportTypeTextActive: {
    color: Colors.primary,
  },
  rangeReportBody: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  rangeLoading: {
    minHeight: 90,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rangeLoadingText: {
    color: Colors.muted,
    fontSize: 9,
  },
  rangeError: {
    color: Colors.danger,
    fontSize: 9,
    paddingVertical: 15,
  },
  reportMetric: {
    minHeight: 35,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  reportMetricLabel: {
    color: Colors.muted,
    fontSize: 8,
    flex: 1,
  },
  reportMetricValue: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: "800",
  },
  reportSubheading: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginTop: 8,
    marginBottom: 3,
  },
  reportSubheadingSpaced: {
    marginTop: 13,
  },
  reportRecord: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 9,
  },
  reportRecordTitle: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "800",
  },
  reportRecordText: {
    color: Colors.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 3,
  },
  reportHint: {
    color: Colors.muted,
    fontSize: 8,
    lineHeight: 13,
    marginTop: 8,
  },
  reportExportButton: {
    minHeight: 41,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    marginTop: 12,
  },
  reportExportButtonDisabled: {
    opacity: 0.6,
  },
  reportExportText: {
    color: Colors.background,
    fontSize: 9,
    fontWeight: "900",
  },
  loading: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: Colors.muted,
    fontSize: 10,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.card,
  },
  errorText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 10,
    lineHeight: 15,
  },
});
