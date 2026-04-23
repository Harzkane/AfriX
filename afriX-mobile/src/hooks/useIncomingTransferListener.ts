// src/hooks/useIncomingTransferListener.ts
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useAuthStore, useWalletStore } from "@/stores";
import apiClient from "@/services/apiClient";

export function useIncomingTransferListener() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useAuthStore();
    const { fetchWallets } = useWalletStore();
    const [startTime] = useState(new Date());
    const lastSeenTxId = useRef<string | null>(null);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const pathnameRef = useRef(pathname);

    useEffect(() => {
        pathnameRef.current = pathname;
    }, [pathname]);

    useEffect(() => {
        if (!isAuthenticated || !user?.id) return;

        let isMounted = true;
        let intervalId: ReturnType<typeof setInterval> | null = null;
        const POLL_INTERVAL = 30000; // 30 seconds to reduce background load

        const checkIncomingTransfers = async () => {
            try {
                if (appStateRef.current !== "active") return;

                // Fetch the most recent transaction
                const response = await apiClient.get("/transactions?limit=1");
                if (!isMounted) return;

                const transactions = response.data.data.transactions || [];
                if (transactions.length === 0) return;

                const latestTx = transactions[0];

                // Check if it's a new incoming transfer
                const isNew = latestTx.id !== lastSeenTxId.current;
                const isIncomingTransfer =
                    latestTx.type === "transfer" &&
                    latestTx.status === "completed" &&
                    latestTx.to_user_id === user.id;
                const isAfterStart = new Date(latestTx.created_at || latestTx.createdAt) > startTime;

                if (isNew && isIncomingTransfer && isAfterStart) {
                    console.log("🔔 Global: Incoming transfer detected!", latestTx.id);
                    lastSeenTxId.current = latestTx.id;

                    // Refresh balances as soon as we detect the transfer.
                    await fetchWallets();

                    // Extract sender info
                    const fromUser = latestTx.fromUser;
                    const agent = latestTx.agent;
                    const merchant = latestTx.merchant;

                    const country = agent?.country_name || merchant?.country_name || fromUser?.country_name || fromUser?.country_code || "";
                    const city = agent?.city || merchant?.city || "";
                    const senderName = merchant?.business_name || fromUser?.full_name || "User";
                    const timestamp = latestTx.created_at || latestTx.createdAt;

                    // Only navigate if we're not already on the success screen
                    if (pathnameRef.current !== "/modals/receive-tokens/success") {
                        router.push({
                            pathname: "/modals/receive-tokens/success",
                            params: {
                                amount: latestTx.amount.toString(),
                                tokenType: latestTx.token_type,
                                fromEmail: fromUser?.email || "User",
                                senderName: senderName,
                                country: country,
                                city: city,
                                timestamp: timestamp,
                            }
                        });
                    }
                } else if (isNew) {
                    // Update last seen even if it's not an incoming transfer we care about
                    lastSeenTxId.current = latestTx.id;
                }
            } catch (error) {
                console.error("Global polling error:", error);
            }
        };

        const startPolling = () => {
            if (intervalId) return;
            checkIncomingTransfers();
            intervalId = setInterval(checkIncomingTransfers, POLL_INTERVAL);
        };

        const stopPolling = () => {
            if (!intervalId) return;
            clearInterval(intervalId);
            intervalId = null;
        };

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
            appStateRef.current = nextAppState;

            if (nextAppState === "active") {
                startPolling();
                return;
            }

            stopPolling();
        };

        if (appStateRef.current === "active") {
            startPolling();
        }

        const subscription = AppState.addEventListener("change", handleAppStateChange);

        return () => {
            isMounted = false;
            stopPolling();
            subscription.remove();
        };
    }, [isAuthenticated, user?.id, startTime, router, fetchWallets]);
}
