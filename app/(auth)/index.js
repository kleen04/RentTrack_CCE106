import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { Colors } from "../../constants/colors";

export default function SignIn() {
  return (
    <View style={styles.container}>
      <View style={styles.logoRow}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>R</Text>
        </View>

        <View>
          <Text style={styles.brand}>RentTrack</Text>
          <Text style={styles.subtitle}>FLEET CONTROL</Text>
        </View>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>WELCOME BACK</Text>

        <Text style={styles.title}>Sign in to RentTrack</Text>

        <Text style={styles.description}>
          Enter your details to manage your fleet.
        </Text>

        <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>

        <TextInput
          placeholder="you@company.com"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          keyboardType="email-address"
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>

        <TextInput
          placeholder="Enter your password"
          placeholderTextColor={Colors.muted}
          style={styles.input}
          secureTextEntry
        />

        <View style={styles.row}>
          <Text style={styles.remember}>□ Remember me</Text>

          <TouchableOpacity>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/garage")}
        >
          <Text style={styles.buttonText}>Sign in   →</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.bottomText}>
          New to RentTrack?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/register")}
          >
            Create account
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
    marginTop: 10,
  },

  logo: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  logoText: {
    color: Colors.black,
    fontWeight: "800",
    fontSize: 17,
  },

  brand: {
    color: Colors.white,
    fontWeight: "800",
    fontSize: 16,
  },

  subtitle: {
    color: Colors.muted,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 2,
  },

  form: {
    marginTop: 190,
  },

  label: {
    color: Colors.lime,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  title: {
    color: Colors.white,
    fontSize: 28,
    marginTop: 6,
  },

  description: {
    color: Colors.muted,
    marginTop: 8,
    marginBottom: 32,
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
    backgroundColor: "#0A1D16",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },

  remember: {
    color: Colors.muted,
    fontSize: 11,
  },

  link: {
    color: Colors.lime,
    fontWeight: "700",
  },

  button: {
    height: 50,
    borderRadius: 9,
    backgroundColor: Colors.lime,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
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