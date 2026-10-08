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
import { calculateRentalQuote, DISTANCE_RATE_PER_KM } from "../../services/pricing";

const BOOKING_CHANNELS = [
  { value: "FACEBOOK", label: "Facebook" },
  { value: "PHONE_MESSENGER", label: "Phone / Messenger" },
  { value: "WALK_IN", label: "Walk-in" },
];

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day, 9);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : null;
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
  const [loadError, setLoadError] = useState("");
  const [availabilityError, setAvailabilityError] = useState("");
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
        const rows = await getVehiclesAvailableForRange(
          db,
          rangePickup,
          rangeReturn
        );
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
        setAvailabilityError(
          error?.message || "Vehicle availability could not be checked."
        );
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

  const rangeVehicles =
    loadedAvailabilityRange === rangeKey ? availableVehicles : [];
  const availabilityLoading =
    validDateRange && loadedAvailabilityRange !== rangeKey;
  const selectedVehicle = rangeVehicles.find((vehicle) => vehicle.id === vehicleId);
  const rentalDays =
    pickup && returnAt && returnAt > pickup
      ? Math.ceil((returnAt - pickup) / (24 * 60 * 60 * 1000))
      : 0;
  const km = Number(destinationKm);
  const validKm = Number.isFinite(km) && km > 0;
  const quote = selectedVehicle
    ? calculateRentalQuote(
        selectedVehicle.price,
        rentalDays,
        validKm ? km : 0,
        DISTANCE_RATE_PER_KM
      )
    : { baseAmount: 0, distanceAmount: 0, totalAmount: 0 };
  const { baseAmount, distanceAmount, totalAmount } = quote;

  const returnToBookings = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/bookings");
  };

  const saveBooking = async () => {
    const selectedCustomer = customers.find((customer) => customer.id === customerId);
    if (!selectedCustomer || !selectedVehicle) {
      Alert.alert("Choose available options", "Select a customer and a vehicle available for the selected dates.");
      return;
    }
    if (
      !pickup ||
      !returnAt ||
      !rentalDays ||
      pickup < new Date(new Date().setHours(0, 0, 0, 0))
    ) {
      Alert.alert("Check rental dates", "Use valid YYYY-MM-DD dates, choose a future pickup, and make sure return is after pickup.");
      return;
    }
    if (!destination.trim()) {
      Alert.alert("Destination required", "Enter the destination for this rental.");
      return;
    }
    if (!validKm || !destinationKm.trim()) {
      Alert.alert("Distance required", "Enter the one-way distance to the destination in kilometers.");
      return;
    }

    setIsSaving(true);
    try {
      await createBooking(db, {
        customerId: selectedCustomer.id,
        vehicleId: selectedVehicle.id,
        pickupAt: pickup,
        returnAt,
        destination: destination.trim(),
        destinationKm: km,
        distanceRatePerKm: DISTANCE_RATE_PER_KM,
        bookingChannel,
        totalAmount,
        status: "RESERVED",
        notes: "Created by admin",
      });
      Alert.alert("Booking created", "The vehicle is now reserved and the customer history has been updated.", [
        { text: "View bookings", onPress: returnToBookings },
      ]);
    } catch (error) {
      Alert.alert("Could not create booking", error?.message || "Please review the booking details and try again.");
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={returnToBookings} style={styles.backButton}>
          <Text style={styles.back}>← Back to bookings</Text>
        </TouchableOpacity>
        <Text style={styles.label}>SCHEDULE · RATE ESTIMATE</Text>
        <Text style={styles.title}>Add a booking</Text>

        {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        {availabilityError ? <Text style={styles.error}>{availabilityError}</Text> : null}

        <Text style={styles.fieldLabel}>CUSTOMER</Text>
        {customers.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
            {customers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                onPress={() => setCustomerId(customer.id)}
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

        <Text style={styles.fieldLabel}>BOOKING CHANNEL</Text>
        <View style={styles.channelRow}>
          {BOOKING_CHANNELS.map((channel) => (
            <TouchableOpacity
              key={channel.value}
              onPress={() => setBookingChannel(channel.value)}
              style={[
                styles.option,
                bookingChannel === channel.value && styles.optionActive,
              ]}
            >
              <Text style={[
                styles.optionText,
                bookingChannel === channel.value && styles.optionTextActive,
              ]}>
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
              onPress={() => setVehicleId(vehicle.id)}
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
        </View>

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Text style={styles.fieldLabel}>PICKUP DATE</Text>
            <TextInput
              value={pickupDate}
              onChangeText={setPickupDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.fieldLabel}>RETURN DATE</Text>
            <TextInput
              value={returnDate}
              onChangeText={setReturnDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.muted}
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>DESTINATION</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="e.g. Tagaytay, Cavite"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.fieldLabel}>ONE-WAY DISTANCE FROM RENTTRACK (KM)</Text>
        <TextInput
          value={destinationKm}
          onChangeText={setDestinationKm}
          placeholder="e.g. 65"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="decimal-pad"
        />
        <Text style={styles.helper}>Use the approximate road distance from the pickup branch to the destination.</Text>

        <View style={styles.quoteCard}>
          <Text style={styles.quoteTitle}>ESTIMATED RENTAL TOTAL</Text>
          <View style={styles.quoteLine}>
            <Text style={styles.quoteText}>Vehicle · {rentalDays || 0} day(s)</Text>
            <Text style={styles.quoteText}>₱{baseAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.quoteLine}>
            <Text style={styles.quoteText}>Distance · {validKm ? km : 0} km × ₱{DISTANCE_RATE_PER_KM}</Text>
            <Text style={styles.quoteText}>₱{distanceAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.quoteDivider} />
          <View style={styles.quoteLine}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>₱{totalAmount.toLocaleString()}</Text>
          </View>
          <Text style={styles.formula}>Daily rate × rental days + destination km × ₱{DISTANCE_RATE_PER_KM}/km</Text>
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
  button: { height: 51, backgroundColor: Colors.primary, borderRadius: 9, justifyContent: "center", alignItems: "center", marginTop: 17 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: Colors.background, fontSize: 12, fontWeight: "900" },
  error: { color: Colors.warning, fontSize: 10, marginBottom: 8 },
});
