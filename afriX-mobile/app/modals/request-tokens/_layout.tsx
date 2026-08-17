// app/modals/request-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function RequestTokensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="review" />
      <Stack.Screen name="share" />
      <Stack.Screen name="my-requests" />
    </Stack>
  );
}
