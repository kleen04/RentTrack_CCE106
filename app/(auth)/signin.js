import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { verifyAdminLogin } from "../../services/database";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const db = useSQLiteContext();
  const { setAdmin } = useAuth();

  const handleSignIn = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setErrorMessage("Enter your email address and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }

    setErrorMessage("");
    setIsSigningIn(true);
    try {
      const admin = await verifyAdminLogin(db, normalizedEmail, password);
      if (!admin) {
        setErrorMessage("The email or password is incorrect.");
        return;
      }
      setAdmin(admin);
      router.replace("/(tabs)");
    } catch {
      setErrorMessage("Unable to sign in right now. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require("../../assets/RTlogo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="RT logo"
        />
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
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.inputLabel}>PASSWORD</Text>

        <View style={styles.passwordWrapper}>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor={Colors.muted}
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            autoComplete="current-password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
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
            style={styles.forgotPasswordButton}
            onPress={() => {
              const message =
                "Please contact the system owner to reset your password.";
              if (Platform.OS === "web") {
                globalThis.alert(message);
              } else {
                Alert.alert("Password assistance", message);
              }
            }}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        </View>

        {errorMessage ? (
          <Text style={styles.errorMessage} accessibilityRole="alert">
            {errorMessage}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isSigningIn && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isSigningIn}
          accessibilityRole="button"
        >
          {isSigningIn ? (
            <ActivityIndicator color={Colors.background} />
          ) : (
            <>
              <Text style={styles.buttonText}>Sign in</Text>
              <Text style={styles.buttonArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.bottomText}>
          New to RentTrack?{" "}
          <Text
            style={styles.link}
            onPress={() => router.push("/(auth)/register")}
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

  hero: {
    alignItems: "center",
    marginTop: 34,
  },

  logo: {
    width: 116,
    height: 116,
  },

  form: {
    marginTop: 30,
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
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
  },

  forgotPasswordButton: {
    marginLeft: "auto",
  },

  link: {
    color: Colors.primary,
    fontWeight: "700",
  },

  errorMessage: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 12,
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

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
  },

  buttonArrow: {
    color: Colors.background,
    fontWeight: "800",
    textAlign: "center",
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