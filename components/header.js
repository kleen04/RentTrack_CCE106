import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";

export default function Header({
  eyebrow,
  label,
  title,
  subtitle,
  right,
}) {
  const eyebrowText = eyebrow || label;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          {eyebrowText ? (
            <Text style={styles.eyebrow}>
              {eyebrowText}
            </Text>
          ) : null}

          <Text style={styles.title}>
            {title}
          </Text>

          {subtitle ? (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? (
          <View>{right}</View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 0,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  textContainer: {
    flex: 1,
  },

  eyebrow: {
    color: "#B8FF2C",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,

    marginBottom: 5,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "400",

    lineHeight: 34,
  },

  subtitle: {
    color: "#7D9086",
    fontSize: 14,

    marginTop: 6,
    lineHeight: 20,
  },
});
