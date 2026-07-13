// app/modals/swap-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function SwapTokensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "modal",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="success" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
