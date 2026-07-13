// app/modals/receive-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function ReceiveTokensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
