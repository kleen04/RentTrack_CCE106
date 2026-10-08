import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";

import { Colors } from "../../constants/colors";
import { VEHICLE_IMAGES } from "../../constants/vehicleImages";
import {
  createVehicle,
  getVehicleById,
  updateVehicle,
} from "../../services/database";
import { persistVehiclePhoto } from "../../services/vehiclePhotos";

export default function AddVehicle() {
  const params = useLocalSearchParams();
  const vehicleId = Array.isArray(params.id) ? params.id[0] : params.id;
  const isEditing = Boolean(vehicleId);
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [imageAssetKey, setImageAssetKey] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const db = useSQLiteContext();

  useEffect(() => {
    if (!isEditing) return undefined;

    let isActive = true;
    getVehicleById(db, vehicleId)
      .then((vehicle) => {
        if (!isActive) return;
        if (!vehicle) {
          setLoadError("Vehicle could not be found in the active fleet.");
          return;
        }
        setBrand(vehicle.brand || "");
        setModel(vehicle.name || "");
        setVehicleType(vehicle.vehicleType || "");
        setPlateNumber(vehicle.plateNumber || "");
        setPricePerDay(String(vehicle.price ?? ""));
        setImageUri(vehicle.imageUri || null);
        setImageAssetKey(vehicle.imageAssetKey || null);
      })
      .catch((error) => {
        if (isActive) {
          setLoadError(error?.message || "Vehicle details could not be loaded.");
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [db, isEditing, vehicleId]);

  const returnToFleet = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (isEditing) {
      router.replace({
        pathname: "/vehicle/[id]",
        params: { id: String(vehicleId) },
      });
    } else {
      router.replace("/(tabs)/garage");
    }
  };

  const handleSave = async () => {
    const cleanBrand = brand.trim();
    const cleanModel = model.trim();
    const cleanType = vehicleType.trim();
    const cleanPlate = plateNumber.trim().toUpperCase();
    const cleanRate = pricePerDay.trim();
    const dailyRate = Number(cleanRate);
    const errors = {};
    if (!cleanBrand) errors.brand = "Enter the vehicle brand.";
    if (!cleanModel) errors.model = "Enter the vehicle model.";
    if (!cleanType) errors.vehicleType = "Enter the vehicle type.";
    if (!/^[A-Z]{3}\s?\d{4}$/.test(cleanPlate)) {
      errors.plateNumber = "Use a standard plate format, such as ABC 1234.";
    }
    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(cleanRate) || !Number.isFinite(dailyRate) || dailyRate <= 0) {
      errors.pricePerDay = "Enter a daily rate greater than zero.";
    }
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaveError("");
    setIsSaving(true);
    try {
      const savedImageUri = imageChanged
        ? await persistVehiclePhoto(imageUri)
        : imageUri;
      const vehicle = {
        brand: cleanBrand,
        model: cleanModel,
        vehicleType: cleanType,
        plateNumber: cleanPlate.replace(/\s+/g, " ").replace(/^([A-Z]{3})(\d{4})$/, "$1 $2"),
        dailyRate,
        imageUri: savedImageUri,
        imageAssetKey,
      };
      if (isEditing) {
        await updateVehicle(db, vehicleId, vehicle);
      } else {
        await createVehicle(db, vehicle);
      }
      returnToFleet();
    } catch (error) {
      const message =
        error?.message?.includes("UNIQUE") ||
        error?.message?.includes("plate number already exists")
        ? ""
        : "The vehicle could not be saved. Please try again.";
      if (!message) {
        setFieldErrors({ plateNumber: "A vehicle with this plate number already exists." });
      } else {
        setSaveError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Photo access required",
          "Allow RentTrack to access your photos to attach a vehicle image."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setImageUri(result.assets[0].uri);
        setImageAssetKey(null);
        setImageChanged(true);
      }
    } catch {
      Alert.alert("Image unavailable", "Please try selecting the image again.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity onPress={returnToFleet}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{isEditing ? "FLEET RECORD" : "NEW VEHICLE"}</Text>

      <Text style={styles.title}>{isEditing ? "Edit vehicle" : "Add a vehicle"}</Text>
      {isLoading ? <Text style={styles.message}>Loading vehicle details…</Text> : null}
      {loadError ? <Text style={styles.error}>{loadError}</Text> : null}

      <Text style={styles.inputLabel}>BRAND</Text>
      <TextInput
        placeholder="e.g. Toyota"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={brand}
        onChangeText={(value) => {
          setBrand(value);
          setFieldErrors((current) => ({ ...current, brand: "" }));
        }}
      />
      {fieldErrors.brand ? <Text style={styles.error}>{fieldErrors.brand}</Text> : null}

      <Text style={styles.inputLabel}>MODEL</Text>
      <TextInput
        placeholder="e.g. Fortuner"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={model}
        onChangeText={(value) => {
          setModel(value);
          setFieldErrors((current) => ({ ...current, model: "" }));
        }}
      />
      {fieldErrors.model ? <Text style={styles.error}>{fieldErrors.model}</Text> : null}

      <Text style={styles.inputLabel}>VEHICLE IMAGE</Text>
      {imageUri || imageAssetKey ? (
        <View style={styles.imagePreview}>
          <Image
            source={imageUri ? { uri: imageUri } : VEHICLE_IMAGES[imageAssetKey]}
            style={styles.previewImage}
          />
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={() => {
              setImageUri(null);
              setImageAssetKey(null);
              setImageChanged(true);
            }}
          >
            <Text style={styles.removeImageText}>Remove image</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <Text style={styles.imagePickerText}>Choose from photos</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.inputLabel}>VEHICLE TYPE</Text>
      <TextInput
        placeholder="e.g. SUV/SPORTS BIKE"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={vehicleType}
        onChangeText={(value) => {
          setVehicleType(value);
          setFieldErrors((current) => ({ ...current, vehicleType: "" }));
        }}
      />


      <Text style={styles.inputLabel}>PLATE NUMBER</Text>
      <TextInput
        placeholder="e.g. NCR 1912"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={plateNumber}
        onChangeText={(value) => {
          setPlateNumber(value);
          setFieldErrors((current) => ({ ...current, plateNumber: "" }));
        }}
      />
      {fieldErrors.plateNumber ? <Text style={styles.error}>{fieldErrors.plateNumber}</Text> : null}

      <Text style={styles.inputLabel}>PRICE PER DAY</Text>
      <TextInput
        placeholder="e.g. 4200"
        placeholderTextColor={Colors.muted}
        style={styles.input}
        value={pricePerDay}
        onChangeText={(value) => {
          setPricePerDay(value);
          setFieldErrors((current) => ({ ...current, pricePerDay: "" }));
        }}
        keyboardType="decimal-pad"
      />
      {fieldErrors.pricePerDay ? <Text style={styles.error}>{fieldErrors.pricePerDay}</Text> : null}

      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

      <TouchableOpacity
        style={[styles.button, (isSaving || isLoading || Boolean(loadError)) && styles.disabled]}
        onPress={handleSave}
        disabled={isSaving || isLoading || Boolean(loadError)}
      >
        <Text style={styles.buttonText}>
          {isSaving ? "Saving vehicle…" : isEditing ? "Save changes" : "Save vehicle"}
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

  back: {
    color: Colors.primary,
    marginBottom: 40,
  },

  label: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: "800",
  },

  title: {
    color: Colors.white,
    fontSize: 28,
    marginTop: 5,
    marginBottom: 30,
  },

  inputLabel: {
    color: "#B8C9C1",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 15,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    backgroundColor: Colors.surface,
  },

  imagePicker: {
    height: 150,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },

  imagePickerText: {
    color: Colors.primary,
    fontWeight: "700",
  },

  imagePreview: {
    height: 190,
    borderRadius: 9,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  removeImageButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },

  removeImageText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  button: {
    height: 50,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },

  buttonText: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },
  disabled: { opacity: 0.65 },
  message: { color: Colors.muted, fontSize: 11, marginTop: 8 },
  error: { color: Colors.danger, fontSize: 11, marginTop: 8 },
});