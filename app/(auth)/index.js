import { useState } from "react";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
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

        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={Colors.muted}
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
          />

          <TouchableOpacity
            style={styles.showButton}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Text style={styles.link}>
              {showPassword ? "Hide" : "Show"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.rememberRow}
            onPress={() => setRememberMe((prev) => !prev)}
          >
            <View
              style={[
                styles.checkbox,
                rememberMe && styles.checkboxChecked,
              ]}
            />
            <Text style={styles.remember}>Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(tabs)/garage")}
        >
          <Text style={styles.buttonText}>Sign in</Text>
          <Text style={styles.buttonArrow}>→</Text>
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

  form: {
    marginTop: 190,
  },

  label: {
    color: Colors.primary,
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
    backgroundColor: Colors.surface,
  },

  passwordWrapper: {
    position: "relative",
    justifyContent: "center",
  },

  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingRight: 55,
    color: Colors.white,
    backgroundColor: Colors.surface,
  },

  showButton: {
    position: "absolute",
    right: 14,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    marginRight: 8,
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  remember: {
    color: Colors.muted,
    fontSize: 11,
  },

  link: {
    color: Colors.primary,
    fontWeight: "700",
  },

  button: {
    height: 50,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 22,
  },

  buttonText: {
    color: Colors.background,
    fontWeight: "800",
  },

  buttonArrow: {
    color: Colors.background,
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