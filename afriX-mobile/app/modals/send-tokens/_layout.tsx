// app/modals/send-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function SendTokensLayout() {
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
                    title: "Send Tokens",
                    headerLeft: () => null,
                }}
            />
            <Stack.Screen
                name="scan-qr"
                options={{
                    title: "Scan QR Code",
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="amount"
                options={{
                    title: "Enter Amount",
                }}
            />
            <Stack.Screen
                name="confirm"
                options={{
                    title: "Confirm Transfer",
                }}
            />
            <Stack.Screen
                name="success"
                options={{
                    title: "Transfer Complete",
                    headerLeft: () => null,
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}
