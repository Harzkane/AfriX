// afriX-mobile/app/_layout.tsx
import { Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores";
import { useRouter } from "expo-router";

export default function RootLayout() {
  const { isAuthenticated, initAuth } = useAuthStore();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const hasRedirected = useRef(false);

  // Step 1: Load auth
  useEffect(() => {
    initAuth().then(() => {
      setIsReady(true);
    });
  }, [initAuth]);

  // Step 2: Safe redirect ONCE
  useEffect(() => {
    if (!isReady || hasRedirected.current) return;

    if (isAuthenticated) {
      hasRedirected.current = true;
      router.replace("/");
    } else {
      hasRedirected.current = true;
      router.replace("/(auth)/welcome");
    }
  }, [isReady, isAuthenticated, router]);

  // Don't render anything until ready
  if (!isReady) {
    return null; // Or a loading spinner
  }

  // Step 3: Render tree
  return (
    <PaperProvider>
      <Slot />
    </PaperProvider>
  );
}
