import { Stack } from "expo-router";

export default function RootLayout() {
  return (
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
  );
}