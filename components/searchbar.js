import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function SearchBar({
  placeholder = "Search",
  value,
  onChangeText,
}) {
  return (
    <View style={styles.container}>
      <Ionicons
        name="search-outline"
        size={20}
        color="#718078"
      />

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#718078"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#0D2018",
    borderWidth: 1,
    borderColor: "#254237",
    borderRadius: 10,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 14,
  },
});