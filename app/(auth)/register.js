import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";

export default function Register() {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>

        <Text style={styles.brand}>RentTrack</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>GET STARTED</Text>

        <Text style={styles.title}>Create your account</Text>

        <Text style={styles.description}>
          Set up your workspace in just a minute.
        </Text>

        <Text style={styles.inputLabel}>FULL NAME</Text>
        <TextInput
          placeholder="Juan Dela Cruz"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
        <TextInput
          placeholder="you@company.com"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>
        <TextInput
          placeholder="At least 6 characters"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          secureTextEntry
        />

        <Text style={styles.terms}>
          □ I agree to the{" "}
          <Text style={styles.link}>Terms of Service</Text>
          {" "}and{" "}
          <Text style={styles.link}>Privacy Policy.</Text>
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/garage")}
        >
          <Text style={styles.buttonText}>
            Create account   →
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.bottomText}>
          Already have an account?{" "}
          <Text
            style={styles.link}
            onPress={() => router.back()}
          >
            Sign In
          </Text>
        </Text>
      </View>

      <Text style={styles.footer}>
        RentTrack Fleet Management · v1.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 20,
  },

  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.lime,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  logoText: {
    fontWeight: "900",
  },

  brand: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "800",
  },

  form: {
    marginTop: 155,
  },

  label: {
    color: Colors.lime,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: Colors.white,
    fontSize: 29,
    marginTop: 6,
  },

  description: {
    color: Colors.muted,
    marginTop: 8,
    marginBottom: 22,
  },

  inputLabel: {
    color: "#B8C9C1",
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 13,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    color: Colors.white,
    backgroundColor: "#0A1D16",
  },

  terms: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 16,
  },

  link: {
    color: Colors.lime,
    fontWeight: "700",
  },

  button: {
    height: 50,
    backgroundColor: Colors.lime,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  buttonText: {
    color: Colors.black,
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },

  bottomText: {
    color: Colors.muted,
    textAlign: "center",
    fontSize: 11,
  },

  footer: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    color: "#345047",
    fontSize: 9,
  },
});