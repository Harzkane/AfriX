// src/components/ui/AgentCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Agent {
  id: string;
  full_name: string;
  rating: number;
  tier?: string;
  is_verified?: boolean;
  available_capacity: number;
  response_time_minutes?: number;
  bank_name?: string;
  country?: string;
}

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
}

const getTierColor = (tier?: string) => {
  switch (tier?.toLowerCase()) {
    case "premium":
      return "#8B5CF6";
    case "pro":
      return "#3B82F6";
    default:
      return "#00B14F";
  }
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => {
  const tierColor = getTierColor(agent.tier);
  const initials = agent.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "AG";

  return (
    <TouchableOpacity
      onPress={() => onSelect(agent)}
      activeOpacity={0.7}
      style={styles.card}
    >
      <View style={styles.content}>
        {/* Agent Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: tierColor + "20" }]}>
              <Text style={[styles.avatarText, { color: tierColor }]}>
                {initials}
              </Text>
            </View>
            {agent.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#00B14F" />
              </View>
            )}
          </View>

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{agent.full_name || "Agent"}</Text>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: tierColor + "15", borderColor: tierColor + "30" },
                ]}
              >
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {agent.tier || "starter"}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>{agent.rating?.toFixed(1) || "0.0"}</Text>
              </View>
              <Text style={styles.dot}>•</Text>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.responseText}>
                  ~{agent.response_time_minutes || 0} min
                </Text>
              </View>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <View style={styles.footerIcon}>
              <Ionicons name="wallet-outline" size={14} color="#00B14F" />
            </View>
            <Text style={styles.footerLabel}>Capacity</Text>
            <Text style={styles.footerValue}>
              ${agent.available_capacity?.toLocaleString() || "0"}
            </Text>
          </View>

          {agent.bank_name && (
            <>
              <View style={styles.separator} />
              <View style={styles.footerItem}>
                <View style={styles.footerIcon}>
                  <Ionicons name="business-outline" size={14} color="#00B14F" />
                </View>
                <Text style={styles.footerLabel}>Bank</Text>
                <Text style={styles.footerValue} numberOfLines={1}>
                  {agent.bank_name}
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
  dot: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  responseText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  footerItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerIcon: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
    marginLeft: "auto",
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 12,
  },
});
