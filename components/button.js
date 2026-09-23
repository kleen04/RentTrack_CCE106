import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? "#07130F" : "#B8FF2C"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            isPrimary ? styles.primaryText : styles.secondaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  primary: {
    backgroundColor: "#B8FF2C",
  },

  secondary: {
    backgroundColor: "#0D2018",
    borderWidth: 1,
    borderColor: "#29453A",
  },

  text: {
    fontSize: 14,
    fontWeight: "700",
  },

  primaryText: {
    color: "#07130F",
  },

  secondaryText: {
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.75,
  },

  disabled: {
    opacity: 0.5,
  },
});