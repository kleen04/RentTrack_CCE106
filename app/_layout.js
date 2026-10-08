import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { initializeDemoDatabase } from "../services/database";

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="renttrack.db"
      onInit={initializeDemoDatabase}
      options={{ enableChangeListener: true }}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="vehicle/[id]" />
        <Stack.Screen name="vehicle/add" />
        <Stack.Screen name="booking/[id]" />
        <Stack.Screen name="booking/add" />
        <Stack.Screen name="customer/[id]" />
        <Stack.Screen name="customer/add" />
      </Stack>
    </SQLiteProvider>
  );
}