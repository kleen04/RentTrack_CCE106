import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

// ── Shared theme tokens ──────────────────────────────────────────────
// Keep this object identical to the one in index.js so both files agree
// on colors. If you add more screens later, consider moving this into
// its own app/theme.js and importing it everywhere instead.
export const colors = {
  bg: '#07130E',      // app background
  panel: '#10221A',   // card background
  panel2: '#162D22',  // slightly lighter card background
  line: '#254133',    // borders / dividers
  lime: '#C8FF48',     // primary accent
  paper: '#F5F8E9',    // primary text
  muted: '#9EB5A5',    // secondary text
  orange: '#FF8547',   // avatar / warm accent
  blue: '#78C7FF',     // info accent
  red: '#FF6A6A',      // destructive / alert accent
  dark: '#041009',     // text on top of the lime accent
};

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      />
    </View>
  );
}
