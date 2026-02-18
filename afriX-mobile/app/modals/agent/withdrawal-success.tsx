import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function WithdrawalSuccess() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        amount?: string;
        requestId?: string;
        from?: string;
    }>();
    const amount = params?.amount ?? "0";
    const requestId = params?.requestId ?? "";
    const fromAgentProfile = params?.from === "agent-profile";

    const handleDone = () => {
        if (fromAgentProfile) {
            router.replace("/agent/(tabs)/profile");
        } else {
            router.back();
        }
    };

    const shortId = requestId ? `${requestId.slice(0, 8)}...` : "—";

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#00B14F", "#008F40"]}
                style={styles.headerGradient}
            />
            <SafeAreaView style={styles.safe} edges={["top"]}>
                <View style={styles.content}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="checkmark-circle" size={80} color="#00B14F" />
                    </View>
                    <Text style={styles.title}>Request submitted</Text>
                    <Text style={styles.subtitle}>
                        Your withdrawal request has been sent for approval.
                    </Text>

                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Amount</Text>
                            <Text style={styles.value}>${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.row}>
                            <Text style={styles.label}>Request ID</Text>
                            <Text style={styles.valueMonospace}>{shortId}</Text>
                        </View>
                    </View>

                    <View style={styles.infoBox}>
                        <Ionicons name="time-outline" size={20} color="#6B7280" />
                        <Text style={styles.infoText}>
                            Processing usually takes 1–3 business days. You’ll be notified once it’s approved and paid.
                        </Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.8}>
                        <Text style={styles.doneButtonText}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    headerGradient: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    safe: {
        flex: 1,
        justifyContent: "space-between",
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 24,
        alignItems: "center",
    },
    iconWrap: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
        marginBottom: 28,
        paddingHorizontal: 16,
    },
    card: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 20,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    label: {
        fontSize: 14,
        color: "#6B7280",
    },
    value: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    valueMonospace: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        fontVariant: ["tabular-nums"],
    },
    divider: {
        height: 1,
        backgroundColor: "#E5E7EB",
        marginVertical: 4,
    },
    infoBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#F3F4F6",
        padding: 14,
        borderRadius: 12,
        gap: 10,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: "#6B7280",
        lineHeight: 20,
    },
    footer: {
        padding: 24,
        paddingBottom: 32,
    },
    doneButton: {
        backgroundColor: "#00B14F",
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: "center",
    },
    doneButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },
});
