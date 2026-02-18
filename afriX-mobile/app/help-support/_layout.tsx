import { Stack } from "expo-router";

export default function HelpSupportLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="faq" />
    </Stack>
  );
}
