// src/components/ui/AgentCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Card, Text, Avatar, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import type { Agent } from "@/stores/types/agent.types";

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelect }) => {
  return (
    <TouchableOpacity onPress={() => onSelect(agent)}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Avatar.Text
              size={48}
              label={agent.tier[0]}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{agent.full_name || "Agent"}</Text>
                {agent.is_verified && (
                  <Ionicons name="checkmark-circle" size={16} color="#00B14F" />
                )}
              </View>
              <Text style={styles.tier}>{agent.tier} Agent</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color="#FFB800" />
                <Text style={styles.rating}>{agent.rating.toFixed(1)}</Text>
                <Text style={styles.response}>
                  • Responds in ~{agent.response_time_minutes}min
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Chip icon="wallet" textStyle={styles.chipText} style={styles.chip}>
              Capacity: ${agent.available_capacity.toLocaleString()}
            </Chip>
            {agent.bank_name && (
              <Chip icon="bank" textStyle={styles.chipText} style={styles.chip}>
                {agent.bank_name}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    elevation: 2,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    backgroundColor: "#00B14F",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  tier: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFB800",
  },
  response: {
    fontSize: 13,
    color: "#6B7280",
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F9F0",
  },
  chipText: {
    fontSize: 12,
    color: "#00B14F",
  },
});
