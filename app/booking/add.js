import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { addDatabaseChangeListener, useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import {
  createBooking,
  getCustomers,
  getVehiclesAvailableForRange,
} from "../../services/database";
import { DISTANCE_RATE_PER_KM } from "../../services/pricing";

const BOOKING_CHANNELS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "PHONE_MESSENGER", label: "Phone / Messenger" },
  { value: "WALK_IN", label: "Walk-in" },
];

const DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30];
const DAY_MS = 24 * 60 * 60 * 1000;

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const cleanValue = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanValue)) return null;
  const [year, month, day] = cleanValue.split("-").map(Number);
  const date = new Date(year, month - 1, day, 9);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function cleanDecimal(text) {
  const withDot = text.replace(",", ".").replace(/[^0-9.]/g, "");
  const parts = withDot.split(".");
  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : withDot;
}

export default function AddBooking() {
  const db = useSQLiteContext();
  const [customers, setCustomers] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [pickupDate, setPickupDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return dateInputValue(date);
  });
  const [returnDate, setReturnDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return dateInputValue(date);
  });
  const [destination, setDestination] = useState("");
  const [destinationKm, setDestinationKm] = useState("");
  const [bookingChannel, setBookingChannel] = useState("WALK_IN");
  const [isSaving, setIsSaving] = useState(false);
  const [showDaysMenu, setShowDaysMenu] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [bookingError, setBookingError] = useState("");
  const [loadedAvailabilityRange, setLoadedAvailabilityRange] = useState("");

  useEffect(() => {
    let isActive = true;
    const loadCustomers = async () => {
      try {
        const customerRows = await getCustomers(db);
        if (!isActive) return;
        setCustomers(customerRows);
        setCustomerId((currentId) =>
          customerRows.some((customer) => customer.id === currentId)
            ? currentId
            : customerRows[0]?.id ?? null
        );
      } catch (error) {
        if (isActive) setLoadError(error?.message || "Booking options could not be loaded.");
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "customers" || event.tableName === "bookings") {
        void loadCustomers();
      }
    });
    void loadCustomers();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db]);

  const pickup = parseDate(pickupDate);
  const returnAt = parseDate(returnDate);
  const rangeKey = `${pickupDate}|${returnDate}`;
  const [today] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });
  const validDateRange = Boolean(pickup && returnAt && returnAt > pickup && pickup >= today);

  useEffect(() => {
    let isActive = true;
    const rangePickup = parseDate(pickupDate);
    const rangeReturn = parseDate(returnDate);
    if (!rangePickup || !rangeReturn || rangeReturn <= rangePickup || rangePickup < today) {
      return () => {
        isActive = false;
      };
    }

    const loadAvailability = async () => {
      setAvailabilityError("");
      try {
        const rows = await getVehiclesAvailableForRange(db, rangePickup, rangeReturn);
        if (!isActive) return;
        setAvailableVehicles(rows);
        setLoadedAvailabilityRange(rangeKey);
        setVehicleId((currentId) =>
          rows.some((vehicle) => vehicle.id === currentId)
            ? currentId
            : rows[0]?.id ?? null
        );
      } catch (error) {
        if (!isActive) return;
        setAvailableVehicles([]);
        setLoadedAvailabilityRange(rangeKey);
        setVehicleId(null);
        setAvailabilityError(error?.message || "Vehicle availability could not be checked.");
      }
    };
    const subscription = addDatabaseChangeListener((event) => {
      if (event.tableName === "vehicles" || event.tableName === "bookings") {
        void loadAvailability();
      }
    });
    void loadAvailability();
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [db, pickupDate, returnDate, rangeKey, today]);

  const rangeVehicles = loadedAvailabilityRange === rangeKey ? availableVehicles : [];
  const availabilityLoading = validDateRange && loadedAvailabilityRange !== rangeKey;
  const selectedVehicle = rangeVehicles.find((vehicle) => vehicle.id === vehicleId);
  const rentalDays =
    pickup && returnAt && returnAt > pickup
      ? Math.ceil((returnAt - pickup) / DAY_MS)
      : 0;

  const ratePerKm = Number(DISTANCE_RATE_PER_KM) || 0;
  const km = parseFloat(destinationKm);
  const validKm = Number.isFinite(km) && km > 0;
  const dailyPrice = selectedVehicle ? Number(selectedVehicle.price) || 0 : 0;
  const baseAmount = dailyPrice * rentalDays;
  const distanceAmount = validKm ? Math.round(km * ratePerKm * 100) / 100 : 0;
  const totalAmount = baseAmount + distanceAmount;

  const selectDays = (days) => {
    const start = pickup || parseDate(pickupDate);
    if (!start) {
      setFieldErrors((current) => ({
        ...current,
        pickupDate: "Enter a valid pickup date before choosing rental days.",
      }));
      return;
    }
    setReturnDate(dateInputValue(addDays(start, days)));
    setFieldErrors((current) => ({ ...current, returnDate: "" }));
    setShowDaysMenu(false);
  };

  const returnToBookings = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/bookings");
  };

  const saveBooking = async () => {
    const selectedCustomer = customers.find((customer) => customer.id === customerId);
    const cleanDestination = destination.trim();
    const cleanDistance = destinationKm.trim();
    const errors = {};
    if (!selectedCustomer) errors.customerId = "Select a customer.";
    if (!selectedVehicle) errors.vehicleId = "Select an available vehicle.";
    if (!pickup) errors.pickupDate = "Enter a valid pickup date (YYYY-MM-DD).";
    if (!returnAt) errors.returnDate = "Enter a valid return date (YYYY-MM-DD).";
    if (pickup && returnAt && returnAt <= pickup) {
      errors.returnDate = "Return date must be after pickup.";
    }
    if (pickup && pickup < today) {
      errors.pickupDate = "Pickup date must be today or later.";
    }
    if (!cleanDestination) errors.destination = "Enter the destination for this rental.";
    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(cleanDistance) || !validKm) {
      errors.destinationKm = "Enter a distance greater than zero kilometers.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setBookingError("");
    setIsSaving(true);
    try {
      await createBooking(db, {
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        pickupAt: pickup,
        returnAt,
        destination: cleanDestination,
        destinationKm: km,
        distanceRatePerKm: ratePerKm,
        bookingChannel,
        totalAmount,
        status: "RESERVED",
        notes: "Created by admin",
      });
      Alert.alert("Booking created", "The vehicle is now reserved and the customer history has been updated.", [
        { text: "View bookings", onPress: returnToBookings },
      ]);
    } catch (error) {
      const message = error?.message || "Please review the booking details and try again.";
      if (/already booked|availability/i.test(message)) {
        setFieldErrors({ vehicleId: message });
      } else {
        setBookingError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const customerName = useMemo(
    () => customers.find((customer) => customer.id === customerId)?.name || "Select a customer",
    [customerId, customers]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <TouchableOpacity onPress={returnToBookings} style={styles.backButton}>
          <Text style={styles.back}>← Back to bookings</Text>
        </TouchableOpacity>
        <Text style={styles.label}>SCHEDULE · RATE ESTIMATE</Text>
        <Text style={styles.title}>Add a booking</Text>

        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {availabilityError ? <Text style={styles.error}>{availabilityError}</Text> : null}
        {ratePerKm <= 0 ? (
          <Text style={styles.error}>
            Distance rate is 0. Set DISTANCE_RATE_PER_KM in services/pricing.js.
          </Text>
        ) : null}

        <Text style={styles.fieldLabel}>CUSTOMER</Text>
        {customers.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
            {customers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                onPress={() => {
                  setCustomerId(customer.id);
                  setFieldErrors((current) => ({ ...current, customerId: "" }));
                }}
                style={[styles.option, customer.id === customerId && styles.optionActive]}
              >
                <Text style={[styles.optionText, customer.id === customerId && styles.optionTextActive]}>
                  {customer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : <Text style={styles.helper}>Add a customer before creating a booking.</Text>}
        <Text style={styles.selectedText}>Selected: {customerName}</Text>
        {fieldErrors.customerId ? <Text style={styles.error}>{fieldErrors.customerId}</Text> : null}

        <Text style={styles.fieldLabel}>BOOKING CHANNEL</Text>
        <View style={styles.channelRow}>
          {BOOKING_CHANNELS.map((channel) => (
            <TouchableOpacity
              key={channel.value}
              onPress={() => setBookingChannel(channel.value)}
              style={[styles.option, bookingChannel === channel.value && styles.optionActive]}
            >
              <Text style={[styles.optionText, bookingChannel === channel.value && styles.optionTextActive]}>
                {channel.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>VEHICLES AVAILABLE FOR THESE DATES</Text>
        <View style={styles.vehicleList}>
          {availabilityLoading ? (
            <Text style={styles.helper}>Checking availability…</Text>
          ) : rangeVehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              onPress={() => {
                setVehicleId(vehicle.id);
                setFieldErrors((current) => ({ ...current, vehicleId: "" }));
              }}
              style={[styles.vehicleOption, vehicle.id === vehicleId && styles.vehicleOptionActive]}
            >
              <View style={styles.vehicleCopy}>
                <Text style={styles.vehicleName}>{vehicle.brand} {vehicle.name}</Text>
                <Text style={styles.vehicleRate}>₱{Number(vehicle.price).toLocaleString()} / day</Text>
              </View>
              {vehicle.id === vehicleId && <Text style={styles.selectedMark}>✓</Text>}
            </TouchableOpacity>
          ))}
          {!availabilityLoading && rangeVehicles.length === 0 && (
            <Text style={styles.helper}>
              {!pickup || !returnAt || returnAt <= pickup
                ? "Enter valid pickup and return dates to check availability."
                : "No vehicles are available for those dates."}
            </Text>
          )}
          {fieldErrors.vehicleId ? <Text style={styles.error}>{fieldErrors.vehicleId}</Text> : null}
        </View>

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.fieldLabel}>PICKUP DATE</Text>
            <TextInput
              value={pickupDate}
              onChangeText={(value) => {
                setPickupDate(value);
                setFieldErrors((current) => ({ ...current, pickupDate: "" }));
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
            {fieldErrors.pickupDate ? <Text style={styles.error}>{fieldErrors.pickupDate}</Text> : null}
          </View>
          <View style={styles.column}>
            <Text style={styles.fieldLabel}>RETURN DATE</Text>
            <TextInput
              value={returnDate}
              onChangeText={(value) => {
                setReturnDate(value);
                setFieldErrors((current) => ({ ...current, returnDate: "" }));
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
            {fieldErrors.returnDate ? <Text style={styles.error}>{fieldErrors.returnDate}</Text> : null}
          </View>
        </View>

        <Text style={styles.fieldLabel}>DESTINATION</Text>
        <TextInput
          value={destination}
          onChangeText={(value) => {
            setDestination(value);
            setFieldErrors((current) => ({ ...current, destination: "" }));
          }}
          placeholder="e.g. Tagaytay, Cavite"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />
        {fieldErrors.destination ? <Text style={styles.error}>{fieldErrors.destination}</Text> : null}

        <Text style={styles.fieldLabel}>ONE-WAY DISTANCE FROM RENTTRACK (KM)</Text>
        <TextInput
          value={destinationKm}
          onChangeText={(text) => {
            setDestinationKm(cleanDecimal(text));
            setFieldErrors((current) => ({ ...current, destinationKm: "" }));
          }}
          placeholder="e.g. 65"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="decimal-pad"
        />
        {fieldErrors.destinationKm ? <Text style={styles.error}>{fieldErrors.destinationKm}</Text> : null}
        <Text style={styles.helper}>Use the approximate road distance from the pickup branch to the destination.</Text>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>ESTIMATED RENTAL TOTAL</Text>

          <Text style={styles.quoteFieldLabel}>RENTAL DAYS</Text>
          {bookingError ? <Text style={styles.error}>{bookingError}</Text> : null}
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDaysMenu((open) => !open)}
          >
            <Text style={styles.dropdownText}>
              {rentalDays ? `${rentalDays} day(s)` : "Select days"}
            </Text>
            <Text style={styles.dropdownText}>{showDaysMenu ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {showDaysMenu && (
            <View style={styles.dropdownMenu}>
              {DAY_OPTIONS.map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.dropdownItem, days === rentalDays && styles.dropdownItemActive]}
                  onPress={() => selectDays(days)}
                >
                  <Text style={[styles.dropdownText, days === rentalDays && styles.optionTextActive]}>
                    {days} day(s)
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.quoteLine}>
            <Text style={styles.quoteText}>Vehicle · {rentalDays || 0} day(s)</Text>
            <Text style={styles.quoteText}>₱{baseAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.quoteLine}>
            <Text style={styles.quoteText}>Distance · {validKm ? km : 0} km × ₱{ratePerKm}</Text>
            <Text style={styles.quoteText}>₱{distanceAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.quoteDivider} />
          <View style={styles.quoteLine}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
          </View>
          <Text style={styles.formula}>Daily rate × rental days + destination km × ₱{ratePerKm}/km</Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={saveBooking}
          disabled={isSaving}
        >
          <Text style={styles.buttonText}>{isSaving ? "Saving booking…" : "Create booking"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 18, paddingTop: 22, paddingBottom: 40 },
  backButton: { alignSelf: "flex-start", marginBottom: 30 },
  back: { color: Colors.primary, fontSize: 12 },
  label: { color: Colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: Colors.white, fontSize: 27, fontWeight: "800", marginTop: 7, marginBottom: 21 },
  fieldLabel: { color: "#B9C8C1", fontSize: 9, fontWeight: "800", letterSpacing: 0.5, marginTop: 15, marginBottom: 8 },
  quoteFieldLabel: { color: "#B9C8C1", fontSize: 9, fontWeight: "800", letterSpacing: 0.5, marginBottom: 8 },
  optionRow: { gap: 7 },
  option: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, borderRadius: 8, paddingHorizontal: 11, paddingVertical: 9 },
  optionActive: { backgroundColor: "#182D1E", borderColor: Colors.primary },
  optionText: { color: Colors.muted, fontSize: 10 },
  optionTextActive: { color: Colors.primary, fontWeight: "800" },
  channelRow: { flexDirection: "row", gap: 7, flexWrap: "wrap" },
  selectedText: { color: Colors.muted, fontSize: 9, marginTop: 7 },
  vehicleList: { gap: 7 },
  vehicleOption: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, borderRadius: 9, padding: 11 },
  vehicleOptionActive: { borderColor: Colors.primary, backgroundColor: "#14271A" },
  vehicleCopy: { flex: 1 },
  vehicleName: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  vehicleRate: { color: Colors.muted, fontSize: 9, marginTop: 4 },
  selectedMark: { color: Colors.primary, fontSize: 15, fontWeight: "900" },
  twoColumns: { flexDirection: "row", gap: 10 },
  column: { flex: 1 },
  input: { height: 48, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 13, color: Colors.white, fontSize: 12 },
  helper: { color: Colors.muted, fontSize: 9, lineHeight: 14, marginTop: 7 },
  quoteCard: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, padding: 14, marginTop: 20 },
  quoteTitle: { color: Colors.primary, fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginBottom: 12 },
  quoteLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 5 },
  quoteText: { color: "#C0CEC5", fontSize: 10 },
  quoteDivider: { height: 1, backgroundColor: Colors.border, marginVertical: 11 },
  totalLabel: { color: Colors.white, fontSize: 11, fontWeight: "700" },
  totalValue: { color: Colors.primary, fontSize: 18, fontWeight: "900" },
  formula: { color: Colors.muted, fontSize: 8, lineHeight: 13, marginTop: 10 },
  dropdown: { height: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, paddingHorizontal: 13, marginBottom: 12 },
  dropdownText: { color: Colors.white, fontSize: 11 },
  dropdownMenu: { backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, borderRadius: 9, marginBottom: 12, overflow: "hidden" },
  dropdownItem: { paddingHorizontal: 13, paddingVertical: 11 },
  dropdownItemActive: { backgroundColor: "#182D1E" },
  button: { height: 51, backgroundColor: Colors.primary, borderRadius: 9, justifyContent: "center", alignItems: "center", marginTop: 17 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Colors.background, fontSize: 12, fontWeight: "900" },
  error: { color: Colors.warning, fontSize: 10, marginBottom: 8 },
});