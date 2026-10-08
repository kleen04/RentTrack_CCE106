import { useEffect, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";

import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import {
  extendBooking,
  getBookingByCode,
  releaseBooking,
  returnBooking,
  updateBooking,
  updateBookingStatus,
} from "../../services/database";
import { calculateRentalQuote } from "../../services/pricing";

const STATUS_COLORS = {
  RESERVED: Colors.warning,
  ACTIVE: "#45BDE8",
  COMPLETED: Colors.primary,
  CANCELLED: Colors.danger,
};

function formatDate(value) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH")}`;
}

function dateInputValue(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 9);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

export default function BookingDetails() {
  const params = useLocalSearchParams();
  const bookingCode = Array.isArray(params.id) ? params.id[0] : params.id;
  const db = useSQLiteContext();
  const { admin } = useAuth();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [verification, setVerification] = useState({
    validId: false,
    contact: false,
    emergencyContact: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editingMode, setEditingMode] = useState(null);
  const [editPickupDate, setEditPickupDate] = useState("");
  const [editReturnDate, setEditReturnDate] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editDestinationKm, setEditDestinationKm] = useState("");

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const row = await getBookingByCode(db, bookingCode);
        if (!isActive) return;
        setBooking(row);
        setLoadError(row ? "" : "Booking not found.");
      } catch (error) {
        if (isActive) setLoadError(error?.message || "Booking details could not be loaded.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (["bookings", "payments", "rental_transactions", "vehicles"].includes(event.tableName)) void load();
    });
    void load();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [bookingCode, db]);

  const returnToBookings = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/bookings");
  };

  const runAction = async (action) => {
    setIsSaving(true);
    setActionError("");
    try {
      await action();
      const refreshed = await getBookingByCode(db, bookingCode);
      setBooking(refreshed);
    } catch (error) {
      setActionError(error?.message || "The booking action could not be completed.");
    } finally {
      setIsSaving(false);
    }
  };

  const startBookingEdit = (mode) => {
    setEditPickupDate(dateInputValue(booking.pickupAt));
    setEditReturnDate(dateInputValue(booking.returnAt));
    setEditDestination(booking.destination || "");
    setEditDestinationKm(String(booking.destinationKm || ""));
    setActionError("");
    setEditingMode(mode);
  };

  const saveBookingEdit = async () => {
    const pickupAt = parseDateInput(editPickupDate);
    const returnAt = parseDateInput(editReturnDate);
    if (!returnAt || (editingMode === "RESERVED" && !pickupAt)) {
      setActionError("Enter valid rental dates using YYYY-MM-DD.");
      return;
    }
    if (editingMode === "RESERVED" && !editDestination.trim()) {
      setActionError("Enter a destination for this rental.");
      return;
    }
    const destinationKm = Number(editDestinationKm);
    if (
      editingMode === "RESERVED" &&
      (!editDestinationKm.trim() ||
        !Number.isFinite(destinationKm) ||
        destinationKm <= 0)
    ) {
      setActionError("Enter a valid one-way destination distance in kilometers.");
      return;
    }

    await runAction(async () => {
      if (editingMode === "RESERVED") {
        await updateBooking(db, booking.id, {
          pickupAt,
          returnAt,
          destination: editDestination,
          destinationKm,
        });
      } else if (editingMode === "ACTIVE") {
        await extendBooking(db, booking.id, returnAt);
      }
      setEditingMode(null);
    });
  };

  if (!admin) return <Redirect href="/(auth)/signin" />;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.muted}>Loading booking details…</Text>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={returnToBookings}>
          <Ionicons name="arrow-back" size={17} color={Colors.primary} />
          <Text style={styles.backText}>Back to bookings</Text>
        </TouchableOpacity>
        <Text style={styles.errorText}>{loadError || "Booking not found."}</Text>
      </View>
    );
  }

  const distance = Number(booking.destinationKm || 0);
  const distanceRate = Number(booking.distanceRatePerKm || 20);
  const distanceCharge = distance * distanceRate;
  const rentalAmount = Math.max(0, Number(booking.totalAmount || 0) - distanceCharge);
  const paidAmount = Number(booking.paidAmount || 0);
  const amountDue = Math.max(0, Number(booking.totalAmount || 0) - paidAmount);
  const editedPickup = editingMode === "RESERVED"
    ? parseDateInput(editPickupDate)
    : new Date(booking.pickupAt);
  const editedReturn = parseDateInput(editReturnDate);
  const editedDistance = editingMode === "RESERVED"
    ? Number(editDestinationKm)
    : distance;
  const editedDays =
    editedPickup && editedReturn && editedReturn > editedPickup
      ? Math.ceil((editedReturn - editedPickup) / (24 * 60 * 60 * 1000))
      : 0;
  const editedQuote =
    editedDays > 0 &&
    Number.isFinite(editedDistance) &&
    editedDistance >= 0 &&
    Number.isFinite(Number(booking.dailyRate))
      ? calculateRentalQuote(
          booking.dailyRate,
          editedDays,
          editedDistance,
          distanceRate
        )
      : null;
  const editAmountDue = editedQuote
    ? Math.max(0, editedQuote.totalAmount - paidAmount)
    : null;
  const statusColor = STATUS_COLORS[booking.status] || Colors.muted;
  const displayStatus = booking.status === "RESERVED"
    ? "CONFIRMED"
    : booking.status === "ACTIVE"
      ? "RENTED"
      : booking.status === "COMPLETED"
        ? "RETURNED"
        : booking.status;
  const canCheckout =
    ["RESERVED", "ACTIVE", "COMPLETED"].includes(booking.status) &&
    booking.paymentStatus !== "PAID";

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity style={styles.backButton} onPress={returnToBookings}>
          <Ionicons name="arrow-back" size={17} color={Colors.primary} />
          <Text style={styles.backText}>Back to bookings</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>RENTAL OPERATIONS</Text>
        <View style={styles.titleRow}>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Booking details</Text>
            <Text style={styles.bookingCode}>{booking.bookingCode}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { borderColor: statusColor, backgroundColor: `${statusColor}18` },
            ]}
          >
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="car-sport-outline" size={25} color={Colors.primary} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.vehicleName}>{booking.vehicleName}</Text>
            <Text style={styles.muted}>
              {booking.plateNumber || "Plate pending"}
            </Text>
          </View>
        </View>

        <SectionTitle icon="person-outline" title="CUSTOMER" />
        <View style={styles.infoCard}>
          <Text style={styles.customerName}>{booking.customerName}</Text>
        </View>

        <SectionTitle icon="phone-portrait-outline" title="BOOKING SOURCE" />
        <View style={styles.infoCard}>
          <Text style={styles.customerName}>
            {{
              FACEBOOK: "Facebook",
              PHONE_MESSENGER: "Phone / Messenger",
              WALK_IN: "Walk-in",
            }[booking.bookingChannel] || "Walk-in"}
          </Text>
          {booking.remarks ? <Text style={styles.muted}>{booking.remarks}</Text> : null}
        </View>

        <SectionTitle icon="calendar-outline" title="RENTAL PERIOD" />
        <View style={styles.infoCard}>
          <InfoRow icon="arrow-up-circle-outline" label="PICKUP" value={formatDate(booking.pickupAt)} />
          <InfoRow icon="return-down-back-outline" label="RETURN" value={formatDate(booking.returnAt)} last />
        </View>
        {booking.status === "RESERVED" || booking.status === "ACTIVE" ? (
          <>
            <TouchableOpacity
              style={[styles.editBookingButton, isSaving && styles.actionDisabled]}
              onPress={() => startBookingEdit(booking.status)}
              disabled={isSaving}
            >
              <Ionicons name="calendar-outline" size={16} color={Colors.background} />
              <Text style={styles.editBookingButtonText}>
                {booking.status === "RESERVED"
                  ? "Change dates / destination"
                  : "Extend rental"}
              </Text>
            </TouchableOpacity>
            {editingMode ? (
              <View style={styles.editBookingCard}>
                <Text style={styles.workflowTitle}>
                  {editingMode === "RESERVED" ? "UPDATE RESERVATION" : "EXTEND RENTAL"}
                </Text>
                {editingMode === "RESERVED" ? (
                  <>
                    <View style={styles.dateFields}>
                      <View style={styles.dateField}>
                        <Text style={styles.editFieldLabel}>PICKUP DATE</Text>
                        <TextInput
                          value={editPickupDate}
                          onChangeText={setEditPickupDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={Colors.muted}
                          style={styles.editInput}
                          autoCapitalize="none"
                        />
                      </View>
                      <View style={styles.dateField}>
                        <Text style={styles.editFieldLabel}>RETURN DATE</Text>
                        <TextInput
                          value={editReturnDate}
                          onChangeText={setEditReturnDate}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={Colors.muted}
                          style={styles.editInput}
                          autoCapitalize="none"
                        />
                      </View>
                    </View>
                    <Text style={styles.editFieldLabel}>DESTINATION</Text>
                    <TextInput
                      value={editDestination}
                      onChangeText={setEditDestination}
                      placeholder="Destination"
                      placeholderTextColor={Colors.muted}
                      style={styles.editInput}
                    />
                    <Text style={styles.editFieldLabel}>ONE-WAY DISTANCE (KM)</Text>
                    <TextInput
                      value={editDestinationKm}
                      onChangeText={setEditDestinationKm}
                      placeholder="Distance in kilometers"
                      placeholderTextColor={Colors.muted}
                      style={styles.editInput}
                      keyboardType="decimal-pad"
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.muted}>
                      Current return date: {formatDate(booking.returnAt)}
                    </Text>
                    <Text style={styles.editFieldLabel}>NEW RETURN DATE</Text>
                    <TextInput
                      value={editReturnDate}
                      onChangeText={setEditReturnDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.muted}
                      style={styles.editInput}
                      autoCapitalize="none"
                    />
                  </>
                )}
                {editedQuote ? (
                  <View style={styles.editQuote}>
                    <Text style={styles.editQuoteText}>
                      Updated rental total · {formatAmount(editedQuote.totalAmount)}
                    </Text>
                    {paidAmount > 0 ? (
                      <Text style={styles.editQuoteText}>
                        Paid {formatAmount(paidAmount)} · remaining balance {formatAmount(editAmountDue)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {actionError ? <Text style={styles.editError}>{actionError}</Text> : null}
                <View style={styles.editActions}>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => {
                      setEditingMode(null);
                      setActionError("");
                    }}
                    disabled={isSaving}
                  >
                    <Text style={styles.cancelEditText}>Keep current details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveEditButton, isSaving && styles.actionDisabled]}
                    onPress={() => void saveBookingEdit()}
                    disabled={isSaving}
                  >
                    <Text style={styles.saveEditText}>
                      {isSaving ? "Saving…" : "Save changes"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {booking.status === "CANCELLED" && booking.processedBy ? (
          <Text style={styles.muted}>Cancellation processed by {booking.processedBy}</Text>
        ) : null}

        {booking.releasedAt ? (
          <>
            <SectionTitle icon="key-outline" title="RENTAL TRANSACTION" />
            <View style={styles.infoCard}>
              <InfoRow icon="log-out-outline" label="VEHICLE RELEASED" value={formatDate(booking.releasedAt)} />
              <InfoRow icon="log-in-outline" label="VEHICLE RETURNED" value={formatDate(booking.returnedAt)} last />
              <Text style={styles.muted}>
                {booking.entryMethod || "MANUAL"} entry · processed by {booking.releasedBy || "Admin"}
              </Text>
              {booking.returnedBy ? (
                <Text style={styles.muted}>Returned by {booking.returnedBy}</Text>
              ) : null}
            </View>
          </>
        ) : null}

        <SectionTitle icon="navigate-outline" title="DESTINATION" />
        <View style={styles.infoCard}>
          <Text style={styles.destination}>
            {booking.destination || "Destination not recorded"}
          </Text>
          <Text style={styles.muted}>
            {distance > 0 ? `${distance} km one way` : "Distance estimate not recorded"}
          </Text>
        </View>

        <SectionTitle icon="receipt-outline" title="PRICE BREAKDOWN" />
        <View style={styles.infoCard}>
          <PriceRow label="Rental amount" value={formatAmount(rentalAmount)} />
          <PriceRow
            label={`Destination distance · ${distance} km × ${formatAmount(distanceRate)}/km`}
            value={formatAmount(distanceCharge)}
          />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              {booking.status === "COMPLETED" ? "FINAL RENTAL TOTAL" : "ESTIMATED BOOKING TOTAL"}
            </Text>
            <Text style={styles.totalAmount}>{formatAmount(booking.totalAmount)}</Text>
          </View>
        </View>

        <SectionTitle icon="card-outline" title="PAYMENT STATUS" />
        <View style={styles.paymentCard}>
          <View style={[styles.paymentIcon, booking.paymentStatus === "PAID" && styles.paymentIconPaid]}>
            <Ionicons
              name={booking.paymentStatus === "PAID" ? "checkmark" : "time-outline"}
              size={17}
              color={booking.paymentStatus === "PAID" ? Colors.background : Colors.warning}
            />
          </View>
          <View style={styles.paymentCopy}>
            <Text style={styles.paymentTitle}>
              {booking.paymentStatus === "PAID"
                ? "Paid"
                : booking.paymentStatus === "PARTIAL"
                  ? "Partially paid"
                  : ["RESERVED", "ACTIVE", "COMPLETED"].includes(booking.status)
                    ? "Awaiting checkout"
                    : "Not payable"}
            </Text>
            <Text style={styles.muted}>
              {booking.paymentStatus === "PAID"
                ? `${formatAmount(paidAmount)} received · ${booking.paymentMethod || "Payment"} · ${booking.paymentReference || "Recorded"}`
                : paidAmount > 0
                  ? `${formatAmount(paidAmount)} received · ${formatAmount(amountDue)} remaining`
                  : ["RESERVED", "ACTIVE", "COMPLETED"].includes(booking.status)
                    ? `${formatAmount(amountDue)} due · No successful payment recorded`
                    : "No successful payment recorded"}
            </Text>
            {booking.paymentProcessedBy ? (
              <Text style={styles.muted}>Payment processed by {booking.paymentProcessedBy}</Text>
            ) : null}
          </View>
        </View>

        {canCheckout ? (
          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() =>
              router.push({
                pathname: "/booking/checkout",
                params: { id: booking.bookingCode },
              })
            }
          >
            <Ionicons name="lock-closed-outline" size={16} color={Colors.background} />
            <Text style={styles.checkoutText}>Continue to checkout</Text>
            <Ionicons name="arrow-forward" size={15} color={Colors.background} />
          </TouchableOpacity>
        ) : null}

        {booking.status === "RESERVED" ? (
          <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>VEHICLE RELEASE</Text>
            <Text style={styles.muted}>Confirm these items at pickup before recording the release.</Text>
            <VerificationRow
              label="Valid ID checked"
              value={verification.validId}
              onPress={() => setVerification((current) => ({ ...current, validId: !current.validId }))}
            />
            <VerificationRow
              label="Customer contact number confirmed"
              value={verification.contact}
              onPress={() => setVerification((current) => ({ ...current, contact: !current.contact }))}
            />
            <VerificationRow
              label="Emergency contact confirmed"
              value={verification.emergencyContact}
              onPress={() => setVerification((current) => ({ ...current, emergencyContact: !current.emergencyContact }))}
            />
            <TouchableOpacity
              style={[styles.primaryAction, styles.fullAction, isSaving && styles.actionDisabled]}
              disabled={isSaving}
              onPress={() =>
                void runAction(() =>
                  releaseBooking(db, booking.id, verification, admin.name)
                )
              }
            >
              <Text style={styles.primaryActionText}>Record vehicle release</Text>
            </TouchableOpacity>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Cancellation reason (required to cancel)"
              placeholderTextColor={Colors.muted}
              style={styles.reasonInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.secondaryAction, styles.fullAction, isSaving && styles.actionDisabled]}
              disabled={isSaving}
              onPress={() => Alert.alert(
                "Cancel this reservation?",
                "The confirmed dates will be released and the reason will be saved in the booking record.",
                [
                  { text: "Keep reservation", style: "cancel" },
                  {
                    text: "Cancel reservation",
                    style: "destructive",
                    onPress: () => void runAction(() =>
                      updateBookingStatus(
                        db,
                        booking.id,
                        "CANCELLED",
                        admin.name,
                        rejectionReason
                      )
                    ),
                  },
                ]
              )}
            >
              <Text style={styles.secondaryActionText}>Cancel reservation</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {booking.status === "ACTIVE" ? (
          <View style={styles.workflowCard}>
            <Text style={styles.workflowTitle}>VEHICLE RETURN</Text>
            <Text style={styles.muted}>Record the return to complete the rental and recognize the rental amount in reports.</Text>
            <TouchableOpacity
              style={[styles.primaryAction, styles.fullAction, isSaving && styles.actionDisabled]}
              disabled={isSaving}
              onPress={() =>
                void runAction(() => returnBooking(db, booking.id, admin.name))
              }
            >
              <Text style={styles.primaryActionText}>Record return · {formatAmount(booking.totalAmount)}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name={icon} size={14} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoLabel}>
        <Ionicons name={icon} size={15} color={Colors.primary} />
        <Text style={styles.infoLabelText}>{label}</Text>
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

function VerificationRow({ label, value, onPress }) {
  return (
    <TouchableOpacity style={styles.verificationRow} onPress={onPress}>
      <View style={[styles.verificationBox, value && styles.verificationBoxChecked]}>
        {value ? <Ionicons name="checkmark" size={12} color={Colors.background} /> : null}
      </View>
      <Text style={styles.verificationLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingTop: 18, paddingBottom: 36 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: Colors.background },
  backButton: { alignSelf: "flex-start", minHeight: 36, flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 20 },
  backText: { color: Colors.primary, fontSize: 10, fontWeight: "700" },
  eyebrow: { color: Colors.primary, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 5, marginBottom: 16 },
  titleCopy: { flex: 1 },
  title: { color: Colors.white, fontSize: 23, fontWeight: "900" },
  bookingCode: { color: Colors.muted, fontSize: 9, marginTop: 5 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 7, fontWeight: "900", letterSpacing: 0.5 },
  heroCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, padding: 14, marginBottom: 7 },
  heroIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#10291E" },
  heroCopy: { flex: 1 },
  vehicleName: { color: Colors.white, fontSize: 15, fontWeight: "800" },
  customerName: { color: Colors.white, fontSize: 12, fontWeight: "700" },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 18, marginBottom: 8 },
  sectionTitle: { color: "#D7E4DB", fontSize: 8, fontWeight: "800", letterSpacing: 0.8 },
  infoCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 4 },
  infoRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoLabelText: { color: Colors.muted, fontSize: 7, fontWeight: "700", letterSpacing: 0.5 },
  infoValue: { color: Colors.white, fontSize: 10, fontWeight: "600", marginTop: 5, marginLeft: 21, lineHeight: 15 },
  destination: { color: Colors.white, fontSize: 11, fontWeight: "700", paddingTop: 8, marginBottom: 5 },
  muted: { color: Colors.muted, fontSize: 9, lineHeight: 14 },
  editBookingButton: { minHeight: 43, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: Colors.primary, borderRadius: 9, marginTop: 12 },
  editBookingButtonText: { color: Colors.background, fontSize: 9, fontWeight: "900" },
  editBookingCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, marginTop: 10 },
  dateFields: { flexDirection: "row", gap: 9 },
  dateField: { flex: 1 },
  editFieldLabel: { color: "#B9C8C1", fontSize: 8, fontWeight: "800", letterSpacing: 0.5, marginTop: 12, marginBottom: 6 },
  editInput: { minHeight: 43, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 11, color: Colors.white, fontSize: 10, backgroundColor: Colors.surface },
  editQuote: { backgroundColor: "#14251B", borderRadius: 8, padding: 10, marginTop: 12, gap: 5 },
  editQuoteText: { color: "#D7E4DB", fontSize: 9, fontWeight: "700" },
  editError: { color: Colors.danger, fontSize: 9, lineHeight: 14, marginTop: 10 },
  editActions: { flexDirection: "row", gap: 8, marginTop: 13 },
  cancelEditButton: { minHeight: 40, flex: 1, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: 8 },
  cancelEditText: { color: Colors.white, fontSize: 8, fontWeight: "700", textAlign: "center" },
  saveEditButton: { minHeight: 40, flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.primary, borderRadius: 8 },
  saveEditText: { color: Colors.background, fontSize: 9, fontWeight: "900" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 9, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border },
  priceLabel: { flex: 1, color: Colors.muted, fontSize: 9, lineHeight: 13 },
  priceValue: { color: Colors.white, fontSize: 10, fontWeight: "700" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  totalLabel: { color: Colors.white, fontSize: 8, fontWeight: "800", letterSpacing: 0.5 },
  totalAmount: { color: Colors.primary, fontSize: 18, fontWeight: "900" },
  paymentCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12 },
  paymentIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#2A2008", alignItems: "center", justifyContent: "center" },
  paymentIconPaid: { backgroundColor: Colors.primary },
  paymentCopy: { flex: 1 },
  paymentTitle: { color: Colors.white, fontSize: 10, fontWeight: "800", marginBottom: 3 },
  checkoutButton: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, borderRadius: 10, marginTop: 16, paddingHorizontal: 12 },
  checkoutText: { color: Colors.background, fontSize: 10, fontWeight: "900" },
  workflowCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, marginTop: 17 },
  workflowTitle: { color: Colors.primary, fontSize: 9, fontWeight: "900", letterSpacing: 0.7, marginBottom: 6 },
  reasonInput: { minHeight: 54, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, color: Colors.white, fontSize: 10, backgroundColor: Colors.surface, marginTop: 12, textAlignVertical: "top" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 11 },
  primaryAction: { minHeight: 43, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderRadius: 9, backgroundColor: Colors.primary },
  secondaryAction: { minHeight: 43, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderRadius: 9, borderWidth: 1, borderColor: Colors.danger, backgroundColor: "#2B1715" },
  primaryActionText: { color: Colors.background, fontSize: 9, fontWeight: "900", textAlign: "center" },
  secondaryActionText: { color: Colors.danger, fontSize: 9, fontWeight: "900" },
  methodAction: { minHeight: 36, flex: 1, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.surface },
  methodActionSelected: { borderColor: Colors.primary, backgroundColor: "#14271A" },
  methodText: { color: Colors.muted, fontSize: 8, fontWeight: "700" },
  methodTextSelected: { color: Colors.primary },
  fullAction: { width: "100%", marginTop: 10 },
  actionDisabled: { opacity: 0.55 },
  verificationRow: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 9, borderBottomWidth: 1, borderBottomColor: Colors.border },
  verificationBox: { width: 17, height: 17, alignItems: "center", justifyContent: "center", borderRadius: 4, borderWidth: 1, borderColor: Colors.muted },
  verificationBoxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  verificationLabel: { color: Colors.white, fontSize: 9 },
  errorText: { color: Colors.danger, fontSize: 10, marginTop: 10 },
});
