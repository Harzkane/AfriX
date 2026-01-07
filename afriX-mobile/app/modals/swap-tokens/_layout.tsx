// app/modals/swap-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function SwapTokensLayout() {
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
                    title: "Swap Tokens",
                    headerLeft: () => null,
                }}
            />
            <Stack.Screen
                name="confirm"
                options={{
                    title: "Confirm Swap",
                }}
            />
            <Stack.Screen
                name="success"
                options={{
                    title: "Swap Complete",
                    headerLeft: () => null,
                    gestureEnabled: false,
                }}
            />
        </Stack>
    );
}
