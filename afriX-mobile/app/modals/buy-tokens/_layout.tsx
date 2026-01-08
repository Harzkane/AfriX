// app/modals/buy-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function BuyTokensLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        presentation: "modal",
        headerStyle: {
          backgroundColor: "#FFFFFF",
        },
        headerTintColor: "#111827",
        headerTitleStyle: {
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          headerTitle: "Buy Tokens",
          headerLeft: () => null, // Hide default back button if we want custom or none on first screen
        }}
      />
      <Stack.Screen
        name="select-agent"
        options={{
          headerShown: false,
          headerTitle: "Select Agent"
        }}
      />
      <Stack.Screen
        name="payment-instructions"
        options={{
          headerShown: false,
          headerTitle: "Payment Instructions"
        }}
      />
      <Stack.Screen
        name="upload-proof"
        options={{
          headerShown: false,
          headerTitle: "Upload Proof"
        }}
      />
      <Stack.Screen
        name="status"
        options={{
          headerShown: false, // disable default Expo Router navigation header.
          headerTitle: "Status",
          headerLeft: () => null, // Prevent going back from status
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
