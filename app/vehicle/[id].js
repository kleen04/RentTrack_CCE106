import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { VEHICLE_IMAGES } from "../../constants/vehicleImages";
import {
  getBookingsForVehicle,
  getVehicleById,
  removeVehicleFromFleet,
  setVehicleMaintenance,
} from "../../services/database";

const STATUS_COLORS = {
  AVAILABLE: Colors.primary,
  RESERVED: Colors.warning,
  RENTED: "#45BDE8",
  MAINTENANCE: "#FF8A65",
};

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VehicleDetails() {
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const db = useSQLiteContext();
  const [vehicle, setVehicle] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const refreshDetails = useCallback(async () => {
    const [vehicleRow, bookingRows] = await Promise.all([
      getVehicleById(db, id),
      getBookingsForVehicle(db, id),
    ]);
    setVehicle(vehicleRow);
    setBookings(bookingRows);
    setLoadError("");
  }, [db, id]);

  useEffect(() => {
    let isActive = true;
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "vehicles" || event.tableName === "bookings") {
        refreshDetails().catch((error) => {
          setActionError(error?.message || "Vehicle details could not be refreshed.");
        });
      }
    });

    Promise.all([getVehicleById(db, id), getBookingsForVehicle(db, id)])
      .then(([vehicleRow, bookingRows]) => {
        if (!isActive) return;
        setVehicle(vehicleRow);
        setBookings(bookingRows);
        setLoadError("");
      })
      .catch((error) => {
        if (isActive) setLoadError(error?.message || "Vehicle details could not be loaded.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, id, refreshDetails]);

  const returnToFleet = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/garage");
  };

  const toggleMaintenance = async () => {
    if (!vehicle || isUpdating) return;
    const isUnderMaintenance = vehicle.status === "AVAILABLE";
    setIsUpdating(true);
    setActionError("");
    try {
      await setVehicleMaintenance(db, vehicle.id, isUnderMaintenance);
      await refreshDetails();
    } catch (error) {
      setActionError(error?.message || "Vehicle status could not be updated.");
    } finally {
      setIsUpdating(false);
    }
  };

  const removeFromFleet = async () => {
    if (!vehicle || isRemoving) return;
    setIsRemoving(true);
    setActionError("");
    try {
      await removeVehicleFromFleet(db, vehicle.id);
      router.replace("/(tabs)/garage");
    } catch (error) {
      setActionError(error?.message || "Vehicle could not be removed from the fleet.");
      setIsRemoving(false);
      setConfirmRemoval(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.message}>Loading vehicle details…</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={returnToFleet}>
          <Text style={styles.back}>← Back to fleet</Text>
        </TouchableOpacity>
        <Text style={styles.message}>{loadError || "Vehicle not found."}</Text>
      </View>
    );
  }

  const statusColor = STATUS_COLORS[vehicle.status] || Colors.muted;
  const imageSource = vehicle.imageUri
    ? { uri: vehicle.imageUri }
    : VEHICLE_IMAGES[vehicle.imageAssetKey];
  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED");
  const activeBookings = bookings.filter((booking) =>
    ["RESERVED", "ACTIVE"].includes(booking.status)
  );
  const canToggleMaintenance = ["AVAILABLE", "MAINTENANCE"].includes(vehicle.status);
  const canRemoveVehicle =
    ["AVAILABLE", "MAINTENANCE"].includes(vehicle.status) &&
    activeBookings.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={returnToFleet}>
          <Text style={styles.back}>← Back to fleet</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          {imageSource ? (
            <Image source={imageSource} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Ionicons name="car-sport-outline" size={78} color={Colors.primary} />
            </View>
          )}
          <View style={styles.heroShade} />
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{vehicle.status}</Text>
          </View>
          <Text style={styles.plateOverlay}>{vehicle.plateNumber || "PLATE PENDING"}</Text>
        </View>

        <Text style={styles.eyebrow}>FLEET VEHICLE · RT-{String(vehicle.id).padStart(3, "0")}</Text>
        <Text style={styles.title}>{vehicle.brand} {vehicle.name}</Text>
        <Text style={styles.subtitle}>{vehicle.vehicleType || "Vehicle"} · Added {formatDate(vehicle.createdAt)}</Text>

        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>DAILY RATE</Text>
            <Text style={styles.rate}>₱{Number(vehicle.price).toLocaleString()}</Text>
            <Text style={styles.summaryHint}>per rental day</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>CURRENT STATUS</Text>
            <Text style={[styles.summaryStatus, { color: statusColor }]}>{vehicle.status}</Text>
            <Text style={styles.summaryHint}>
              {vehicle.status === "MAINTENANCE"
                ? "Not available for new bookings"
                : vehicle.status === "AVAILABLE"
                  ? "No current rental or reservation"
                  : "Availability depends on rental dates"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>VEHICLE INFORMATION</Text>
          <Text style={styles.sourceTag}>SHARED FLEET RECORD</Text>
        </View>
        <View style={styles.infoCard}>
          <InfoRow label="Brand" value={vehicle.brand} />
          <InfoRow label="Model" value={vehicle.name} />
          <InfoRow label="Vehicle type" value={vehicle.vehicleType || "Not specified"} />
          <InfoRow label="Plate number" value={vehicle.plateNumber || "Not provided"} />
          <InfoRow label="Listed daily rate" value={`₱${Number(vehicle.price).toLocaleString()} / day`} last />
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>RENTAL ACTIVITY</Text>
          <Text style={styles.historyCount}>{bookings.length} RECORDS</Text>
        </View>
        <View style={styles.activityStats}>
          <ActivityStat value={String(bookings.length)} label="TOTAL BOOKINGS" />
          <View style={styles.activityDivider} />
          <ActivityStat value={String(activeBookings.length)} label="OPEN BOOKINGS" />
          <View style={styles.activityDivider} />
          <ActivityStat value={String(completedBookings.length)} label="COMPLETED" />
        </View>

        {bookings.length ? bookings.map((booking) => (
          <View key={booking.id} style={styles.bookingCard}>
            <View style={styles.bookingTop}>
              <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
              <Text style={[styles.bookingStatus, { color: STATUS_COLORS[booking.status] || Colors.muted }]}>
                {booking.status}
              </Text>
            </View>
            <Text style={styles.bookingCustomer}>{booking.customerName}</Text>
            <Text style={styles.bookingDate}>{formatDate(booking.pickupAt)} – {formatDate(booking.returnAt)}</Text>
            {booking.destination ? (
              <Text style={styles.bookingDestination}>
                {booking.destination}
                {Number(booking.destinationKm) > 0 ? ` · ${booking.destinationKm} km` : ""}
              </Text>
            ) : null}
            <View style={styles.bookingBottom}>
              <Text style={styles.bookingTotal}>BOOKING TOTAL</Text>
              <Text style={styles.bookingAmount}>₱{Number(booking.totalAmount).toLocaleString()}</Text>
            </View>
          </View>
        )) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyCopy}>Bookings for this vehicle will appear here and in the customer rental history.</Text>
          </View>
        )}

        {!canToggleMaintenance && (
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.warning} />
            <Text style={styles.warningText}>
              This vehicle is {vehicle.status.toLowerCase()}. It must be available before it can be marked under maintenance.
            </Text>
          </View>
        )}
        {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}
        {canToggleMaintenance && (
          <TouchableOpacity
            style={[styles.maintenanceButton, vehicle.status === "MAINTENANCE" && styles.restoreButton]}
            onPress={toggleMaintenance}
            disabled={isUpdating}
          >
            <Ionicons
              name={vehicle.status === "MAINTENANCE" ? "checkmark-circle-outline" : "construct-outline"}
              size={18}
              color={vehicle.status === "MAINTENANCE" ? Colors.background : "#FF9B75"}
            />
            <Text style={[styles.maintenanceText, vehicle.status === "MAINTENANCE" && styles.restoreText]}>
              {isUpdating
                ? "Updating fleet status…"
                : vehicle.status === "MAINTENANCE"
                  ? "Mark vehicle available"
                  : "Mark under maintenance"}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.maintenanceHint}>
          Vehicles under maintenance cannot be booked until they are returned to service.
        </Text>

        {confirmRemoval ? (
          <View style={styles.confirmRemovalCard}>
            <Text style={styles.confirmRemovalTitle}>Remove this vehicle?</Text>
            <Text style={styles.confirmRemovalCopy}>
              {vehicle.brand} {vehicle.name} will be removed from the active fleet.
              Existing rental history will be preserved.
            </Text>
            <View style={styles.confirmRemovalActions}>
              <TouchableOpacity
                style={styles.cancelRemovalButton}
                onPress={() => setConfirmRemoval(false)}
                disabled={isRemoving}
              >
                <Text style={styles.cancelRemovalText}>Keep vehicle</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmRemovalButton}
                onPress={removeFromFleet}
                disabled={isRemoving}
              >
                <Text style={styles.confirmRemovalButtonText}>
                  {isRemoving ? "Removing…" : "Remove vehicle"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: !canRemoveVehicle || isRemoving }}
            style={[
              styles.removeVehicleButton,
              !canRemoveVehicle && styles.removeVehicleButtonDisabled,
            ]}
            onPress={() => {
              setActionError("");
              setConfirmRemoval(true);
            }}
            disabled={!canRemoveVehicle || isRemoving}
          >
            <Ionicons
              name="trash-outline"
              size={17}
              color={canRemoveVehicle ? Colors.danger : Colors.muted}
            />
            <Text
              style={[
                styles.removeVehicleText,
                !canRemoveVehicle && styles.removeVehicleTextDisabled,
              ]}
            >
              Remove from fleet
            </Text>
          </TouchableOpacity>
        )}
        <Text style={styles.removeVehicleHint}>
          Removal hides this vehicle from active fleet lists and keeps its rental
          history. Vehicles with active or reserved bookings cannot be removed.
        </Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, last }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Not recorded"}</Text>
    </View>
  );
}

function ActivityStat({ value, label }) {
  return (
    <View style={styles.activityStat}>
      <Text style={styles.activityValue}>{value}</Text>
      <Text style={styles.activityLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 35 },
  centered: { flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" },
  back: { color: Colors.primary, fontSize: 12, marginBottom: 20 },
  hero: { height: 205, borderRadius: 15, overflow: "hidden", backgroundColor: Colors.card, position: "relative", marginBottom: 20 },
  heroImage: { width: "100%", height: "100%" },
  heroPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  heroShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "#06130E35" },
  statusBadge: { position: "absolute", top: 13, left: 13, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#07130F", borderWidth: 1, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 4 },
  statusText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  plateOverlay: { position: "absolute", bottom: 12, right: 13, color: Colors.white, backgroundColor: "#07130FDD", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 5, fontSize: 9, letterSpacing: 0.8 },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  title: { color: Colors.white, fontSize: 26, fontWeight: "900", marginTop: 7 },
  subtitle: { color: Colors.muted, fontSize: 10, marginTop: 5 },
  summary: { flexDirection: "row", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginTop: 18 },
  summaryCell: { flex: 1 },
  summaryDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 13 },
  summaryLabel: { color: Colors.muted, fontSize: 7, fontWeight: "800", letterSpacing: 0.6 },
  rate: { color: Colors.primary, fontSize: 19, fontWeight: "900", marginTop: 7 },
  summaryStatus: { fontSize: 13, fontWeight: "900", marginTop: 10 },
  summaryHint: { color: Colors.muted, fontSize: 8, marginTop: 4 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 },
  sectionTitle: { color: "#D7E4DB", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  sourceTag: { color: Colors.primary, fontSize: 7, fontWeight: "800", letterSpacing: 0.4 },
  infoCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 13 },
  infoRow: { minHeight: 43, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10 },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { color: Colors.muted, fontSize: 9 },
  infoValue: { color: Colors.white, fontSize: 10, fontWeight: "600", textAlign: "right", flex: 1 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 24, marginBottom: 10 },
  historyCount: { color: Colors.muted, fontSize: 8 },
  activityStats: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingVertical: 13, marginBottom: 10 },
  activityStat: { flex: 1, alignItems: "center" },
  activityValue: { color: Colors.primary, fontSize: 18, fontWeight: "900" },
  activityLabel: { color: Colors.muted, fontSize: 6, letterSpacing: 0.4, marginTop: 4, textAlign: "center" },
  activityDivider: { width: 1, height: 31, backgroundColor: Colors.border },
  bookingCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 11, padding: 13, marginBottom: 9 },
  bookingTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bookingCode: { color: Colors.muted, fontSize: 8, fontWeight: "800" },
  bookingStatus: { fontSize: 8, fontWeight: "900" },
  bookingCustomer: { color: Colors.white, fontSize: 12, fontWeight: "700", marginTop: 8 },
  bookingDate: { color: Colors.muted, fontSize: 9, marginTop: 5 },
  bookingDestination: { color: "#B8C8C0", fontSize: 9, marginTop: 7 },
  bookingBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 10, paddingTop: 9 },
  bookingTotal: { color: Colors.muted, fontSize: 7, fontWeight: "700" },
  bookingAmount: { color: Colors.primary, fontSize: 11, fontWeight: "900" },
  emptyCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 11, padding: 14 },
  emptyTitle: { color: Colors.white, fontSize: 11, fontWeight: "800" },
  emptyCopy: { color: Colors.muted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  warningBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2A2008", borderWidth: 1, borderColor: "#6E5023", borderRadius: 9, padding: 11, marginTop: 18 },
  warningText: { color: Colors.warning, fontSize: 9, lineHeight: 14, flex: 1 },
  actionError: { color: Colors.danger, fontSize: 10, marginTop: 12 },
  maintenanceButton: { minHeight: 47, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#9A523A", backgroundColor: "#2B1B16", borderRadius: 10, marginTop: 18 },
  restoreButton: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  maintenanceText: { color: "#FF9B75", fontSize: 10, fontWeight: "800" },
  restoreText: { color: Colors.background },
  maintenanceHint: { color: Colors.muted, fontSize: 8, lineHeight: 13, textAlign: "center", marginTop: 8 },
  confirmRemovalCard: { backgroundColor: "#211513", borderWidth: 1, borderColor: "#75423A", borderRadius: 11, padding: 13, marginTop: 18 },
  confirmRemovalTitle: { color: Colors.white, fontSize: 12, fontWeight: "800" },
  confirmRemovalCopy: { color: "#C7A7A2", fontSize: 9, lineHeight: 14, marginTop: 6 },
  confirmRemovalActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelRemovalButton: { flex: 1, minHeight: 39, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: 8 },
  cancelRemovalText: { color: Colors.white, fontSize: 9, fontWeight: "700" },
  confirmRemovalButton: { flex: 1, minHeight: 39, justifyContent: "center", alignItems: "center", backgroundColor: Colors.danger, borderRadius: 8 },
  confirmRemovalButtonText: { color: Colors.white, fontSize: 9, fontWeight: "800" },
  removeVehicleButton: { minHeight: 46, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#75423A", backgroundColor: "#211513", borderRadius: 10, marginTop: 18 },
  removeVehicleButtonDisabled: { borderColor: Colors.border, backgroundColor: Colors.surface },
  removeVehicleText: { color: Colors.danger, fontSize: 10, fontWeight: "800" },
  removeVehicleTextDisabled: { color: Colors.muted },
  removeVehicleHint: { color: Colors.muted, fontSize: 8, lineHeight: 13, textAlign: "center", marginTop: 8 },
  message: { color: Colors.muted, fontSize: 11, marginTop: 12 },
});
