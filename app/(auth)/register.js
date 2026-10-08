import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Colors } from "../../constants/colors";
import { useAuth } from "../../context/AuthContext";
import { createAdmin } from "../../services/database";

export default function Register() {
  const [agreed, setAgreed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const db = useSQLiteContext();
  const { setAdmin } = useAuth();

  const returnToSignIn = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(auth)/signin");
    }
  };

  const handleCreateAccount = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();
    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      setErrorMessage("Complete all fields to create your account.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMessage("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setErrorMessage("");
    setIsCreatingAccount(true);
    try {
      const admin = await createAdmin(db, {
        name: normalizedName,
        email: normalizedEmail,
        password,
      });
      setAdmin(admin);
      router.replace("/(tabs)");
    } catch (error) {
      setErrorMessage(
        error?.message || "Unable to create your account. Please try again."
      );
    } finally {
      setIsCreatingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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
            autoComplete="name"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />

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
          <TextInput
            placeholder="At least 8 characters"
            placeholderTextColor={Colors.muted}
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />

          <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
          <TextInput
            placeholder="Re-enter your password"
            placeholderTextColor={Colors.muted}
            style={styles.input}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreed((prev) => !prev)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
          >
            <View
              style={[styles.checkbox, agreed && styles.checkboxChecked]}
            />
            <Text style={styles.terms}>
              I agree to the{" "}
              <Text style={styles.link}>Terms of Service</Text>
              {" "}and{" "}
              <Text style={styles.link}>Privacy Policy.</Text>
            </Text>
          </TouchableOpacity>

          {errorMessage ? (
            <Text style={styles.errorMessage} accessibilityRole="alert">
              {errorMessage}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.button, isCreatingAccount && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={isCreatingAccount}
            accessibilityRole="button"
          >
            {isCreatingAccount ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Text style={styles.buttonText}>Create account</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.bottomText}>
            Already have an account?{" "}
            <Text
              style={styles.link}
              onPress={returnToSignIn}
            >
              Sign In
            </Text>
          </Text>
        </View>

        <Text style={styles.footer}>
          RentTrack Fleet Management · v1.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingBottom: 14,
  },

  form: {
    width: "100%",
  },

  label: {
    color: Colors.primary,
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
    marginBottom: 14,
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
    backgroundColor: Colors.surface,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 16,
  },

  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 3,
    backgroundColor: Colors.surface,
    marginRight: 8,
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  terms: {
    color: Colors.muted,
    fontSize: 10,
    flex: 1,
    flexWrap: "wrap",
  },

  errorMessage: {
    color: Colors.danger,
    fontSize: 12,
    marginTop: 12,
  },

  link: {
    color: Colors.primary,
    fontWeight: "700",
  },

  button: {
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
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
    alignSelf: "center",
    color: "#345047",
    fontSize: 9,
    marginTop: 22,
  },
});