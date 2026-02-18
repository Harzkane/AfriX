// src/components/ui/TimerComponent.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

interface TimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const TimerComponent: React.FC<TimerProps> = ({
  expiresAt,
  onExpire,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);
  const onExpireFiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    onExpireFiredRef.current = false;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("Expired");
        if (!onExpireFiredRef.current && onExpireRef.current) {
          onExpireFiredRef.current = true;
          onExpireRef.current();
        }
        return true; // expired, caller should stop interval
      }

      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      return false;
    };

    updateTimer();
    const interval = setInterval(() => {
      const shouldStop = updateTimer();
      if (shouldStop) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <View style={[styles.container, isExpired && styles.expired]}>
      <Ionicons
        name="time-outline"
        size={20}
        color={isExpired ? "#FF4444" : "#FFB800"}
      />
      <Text style={[styles.text, isExpired && styles.expiredText]}>
        {isExpired ? "Request Expired" : `Time left: ${timeLeft}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#FFF9E6",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFB800",
  },
  expired: {
    backgroundColor: "#FFE6E6",
    borderColor: "#FF4444",
  },
  text: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  expiredText: {
    color: "#FF4444",
  },
});
