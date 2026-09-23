import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";
import { Colors } from "../../constants/colors";

export default function AddBooking() {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.label}>SCHEDULE</Text>

      <Text style={styles.title}>
        Add booking
      </Text>

      <TextInput
        placeholder="Customer name"
        placeholderTextColor={Colors.muted}
        style={styles.input}
      />

      <TextInput
        placeholder="Vehicle"
        placeholderTextColor={Colors.muted}
        style={styles.input}
      />

      <TextInput
        placeholder="Start date"
        placeholderTextColor={Colors.muted}
        style={styles.input}
      />

      <TextInput
        placeholder="End date"
        placeholderTextColor={Colors.muted}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>
          Create booking
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 18,
  },

  back: {
    color: Colors.lime,
    marginBottom: 35,
  },

  label: {
    color: Colors.lime,
    fontSize: 10,
    fontWeight: "800",
  },

  title: {
    color: Colors.white,
    fontSize: 29,
    marginBottom: 25,
  },

  input: {
    height: 50,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    marginBottom: 12,
  },

  button: {
    height: 50,
    backgroundColor: Colors.lime,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: Colors.black,
    fontWeight: "900",
  },
});