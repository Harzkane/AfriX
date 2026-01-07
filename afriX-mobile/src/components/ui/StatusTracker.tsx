// src/components/ui/StatusTracker.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

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
      label: "Request Created",
      status: isFailed
        ? "failed"
        : currentIndex >= 0
        ? currentIndex === 0
          ? "current"
          : "completed"
        : "pending",
    },
    {
      label: "Proof Uploaded",
      status: isFailed
        ? "failed"
        : currentIndex >= 1
        ? currentIndex === 1
          ? "current"
          : "completed"
        : "pending",
    },
    {
      label: "Agent Reviewing",
      status: isFailed
        ? "failed"
        : currentIndex >= 1
        ? currentIndex === 1
          ? "current"
          : "completed"
        : "pending",
    },
    {
      label: "Tokens Minted",
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
                step.status === "completed" && styles.iconCompleted,
                step.status === "current" && styles.iconCurrent,
                step.status === "failed" && styles.iconFailed,
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
                  step.status === "completed" && styles.lineCompleted,
                  step.status === "failed" && styles.lineFailed,
                ]}
              />
            )}
          </View>
          <Text
            style={[
              styles.label,
              step.status === "completed" && styles.labelCompleted,
              step.status === "current" && styles.labelCurrent,
              step.status === "failed" && styles.labelFailed,
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
    color: "#6B7280",
    paddingTop: 6,
  },
  labelCompleted: {
    color: "#1A1A1A",
    fontWeight: "500",
  },
  labelCurrent: {
    color: "#1A1A1A",
    fontWeight: "600",
  },
  labelFailed: {
    color: "#FF4444",
    fontWeight: "500",
  },
});
