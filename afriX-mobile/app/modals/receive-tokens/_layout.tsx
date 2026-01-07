// app/modals/receive-tokens/_layout.tsx
import { Stack } from "expo-router";

export default function ReceiveTokensLayout() {
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
                    title: "Receive Tokens",
                    headerLeft: () => null,
                }}
            />
        </Stack>
    );
}
