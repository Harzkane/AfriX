// src/components/ui/StatusTracker.tsx
import React from "react";
import { View, StyleSheet, useColorScheme } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

interface StatusStep {
  label: string;
  status: "completed" | "current" | "pending" | "failed";
}

interface StatusTrackerProps {
  currentStatus: string;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  currentStatus,
}) => {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = {
    text: isDark ? "#F8FAFC" : "#111827",
    muted: isDark ? "#94A3B8" : "#6B7280",
    border: isDark ? "#1E2A3A" : "#E5E7EB",
    current: "#FFB800",
    completed: "#00B14F",
    failed: "#FF4444",
  };

  // Define status progression order for successful flow
  const statusOrder = ["pending", "proof_submitted", "confirmed"];
  const currentIndex = statusOrder.indexOf(currentStatus);

  // Check if request is in a terminal failed state
  const isCancelled = currentStatus === "cancelled";
  const isRejected = currentStatus === "rejected";
  const isExpired = currentStatus === "expired";
  const isFailed = isCancelled || isRejected || isExpired;

  const steps: StatusStep[] = [
    {
      label: t("components.status_tracker.step_created", "Request Created"),
      status: isFailed
        ? "failed"
        : currentIndex >= 0
        ? currentIndex === 0
          ? "current"
          : "completed"
        : "pending",
    },
    {
      label: t("components.status_tracker.step_proof", "Proof Uploaded"),
      status: isFailed
        ? "failed"
        : currentIndex >= 1
        ? currentIndex === 1
          ? "current"
          : "completed"
        : "pending",
    },
    {
      label: t("components.status_tracker.step_reviewing", "Agent Reviewing"),
      status: isFailed
        ? "failed"
        : currentIndex >= 1
        ? currentIndex === 1
          ? "current"
          : "completed"
        : "pending",
    },
    {
      label: t("components.status_tracker.step_minted", "Tokens Minted"),
      status: isFailed ? "failed" : currentIndex >= 2 ? "completed" : "pending",
    },
  ];

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.iconContainer}>
            <View
              style={[
                styles.icon,
                { backgroundColor: theme.border },
                step.status === "completed" && { backgroundColor: theme.completed },
                step.status === "current" && { backgroundColor: theme.current },
                step.status === "failed" && { backgroundColor: theme.failed },
              ]}
            >
              {step.status === "completed" ? (
                <Ionicons name="checkmark" size={20} color="#FFF" />
              ) : step.status === "current" ? (
                <Ionicons name="ellipse" size={12} color="#FFF" />
              ) : step.status === "failed" ? (
                <Ionicons name="close" size={20} color="#FFF" />
              ) : (
                <View style={styles.iconPending} />
              )}
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.line,
                  { backgroundColor: theme.border },
                  step.status === "completed" && { backgroundColor: theme.completed },
                  step.status === "failed" && { backgroundColor: theme.failed },
                ]}
              />
            )}
          </View>
          <Text
            style={[
              styles.label,
              { color: theme.muted },
              step.status === "completed" && { color: theme.text, fontWeight: "600" },
              step.status === "current" && { color: theme.text, fontWeight: "700" },
              step.status === "failed" && { color: theme.failed, fontWeight: "600" },
            ]}
          >
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  iconContainer: {
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCompleted: {
    backgroundColor: "#00B14F",
  },
  iconCurrent: {
    backgroundColor: "#FFB800",
  },
  iconFailed: {
    backgroundColor: "#FF4444",
  },
  iconPending: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#9CA3AF",
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginTop: 4,
  },
  lineCompleted: {
    backgroundColor: "#00B14F",
  },
  lineFailed: {
    backgroundColor: "#FF4444",
  },
  label: {
    fontSize: 14,
    paddingTop: 6,
  },
});
