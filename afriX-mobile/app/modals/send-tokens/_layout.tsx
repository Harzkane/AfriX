// app/modals/send-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function SendTokensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="scan-qr" />
      <Stack.Screen name="amount" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
