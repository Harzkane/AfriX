// src/components/ui/AgentCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatAmountOrCompact } from "@/utils/format";
import { useWalletStore } from "@/stores";
import { useTranslation } from "react-i18next";

export interface Agent {
  id: string;
  full_name: string;
  rating: number;
  tier?: string;
  is_verified?: boolean;
  available_capacity: number;
  response_time_minutes?: number;
  bank_name?: string;
  country?: string;
  city?: string;
  status?: string;
  is_online?: boolean;
  commission_rate?: number;
  max_transaction_limit?: number;
  daily_transaction_limit?: number;
  total_minted?: number;
  total_burned?: number;
  mobile_money_provider?: string;
  mobile_money_number?: string;
  review_count?: number;
}

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  /** When set, card shows whether agent can handle this amount (Buy/Sell flows) */
  userAmount?: number;
  /** Token type for formatting (NT, CT, USDT) */
  tokenType?: string;
  /** Highlight card if selected */
  isSelected?: boolean;
  /** Highlight card if recommended */
  isRecommended?: boolean;
}

/**
 * Convert user amount (NT/CT/USDT) to USDT for capacity comparison.
 */
function toUsdt(
  amount: number,
  tokenType: string,
  rates: { USDT_TO_NT: number; USDT_TO_CT: number }
): number | null {
  if (tokenType === "USDT") return amount;
  if (tokenType === "NT") {
    const rate = rates?.USDT_TO_NT || 1500;
    return amount / rate;
  }
  if (tokenType === "CT") {
    const rate = rates?.USDT_TO_CT || 565;
    return amount / rate;
  }
  return amount;
}

/**
 * Convert agent's USDT capacity to local currency.
 */
function capacityToLocal(
  capacityUsdt: number,
  tokenType: string,
  rates: { USDT_TO_NT: number; USDT_TO_CT: number }
): number {
  if (tokenType === "NT") {
    const rate = rates?.USDT_TO_NT || 1500;
    return capacityUsdt * rate;
  }
  if (tokenType === "CT") {
    const rate = rates?.USDT_TO_CT || 565;
    return capacityUsdt * rate;
  }
  return capacityUsdt;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  userAmount,
  tokenType = "NT",
  isSelected = false,
  isRecommended = false,
}) => {
  const { exchangeRates } = useWalletStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = {
    card: isDark ? "#0E1726" : "#FFFFFF",
    cardSelected: isDark ? "#092518" : "#EAF8EF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    danger: "#EF4444",
  };

  const initials = agent.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "AG";

  const capacity = Number(agent.available_capacity) || 0;
  const maxLimitStored = agent.max_transaction_limit != null ? Number(agent.max_transaction_limit) : null;
  const currencyCode = tokenType === "CT" ? "XOF" : tokenType === "USDT" ? "USD" : "NGN";

  const capacityInLocal = capacityToLocal(capacity, tokenType, exchangeRates);

  const userAmountUsdt =
    userAmount != null && userAmount > 0
      ? toUsdt(userAmount, tokenType, exchangeRates)
      : null;

  const canHandleCapacity = userAmountUsdt == null ? true : capacity >= userAmountUsdt;
  const canHandleMax = userAmountUsdt == null || maxLimitStored == null ? true : maxLimitStored >= userAmountUsdt;

  const isOverLimit = userAmountUsdt != null && maxLimitStored != null && userAmountUsdt > maxLimitStored;
  const isInsufficientCapacity = userAmountUsdt != null && capacity < userAmountUsdt;

  const canHandleAmount = canHandleCapacity && canHandleMax;

  const capacityPercent = Math.min(100, Math.max(5, Math.round((capacityInLocal / 5000000) * 100))) || 75;

  const disabled = userAmount != null && userAmount > 0 && !canHandleAmount;

  return (
    <View style={styles.outerContainer}>
      {isRecommended && (
        <View style={[styles.recommendedTag, { backgroundColor: theme.accent }]}>
          <Text style={styles.recommendedTagText}>Recommended</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => onSelect(agent)}
        activeOpacity={0.8}
        disabled={disabled}
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
          isRecommended && { borderColor: theme.accent },
          isSelected && { borderColor: theme.accent, backgroundColor: theme.cardSelected },
          disabled && styles.cardDisabled,
        ]}
      >
        <View style={styles.gridRow}>
          {/* Column 1: Agent Header Info */}
          <View style={styles.col1}>
            <View style={styles.avatarRow}>
              <View style={[styles.avatar, { backgroundColor: isSelected ? theme.accent : "#0F291E" }]}>
                <Text style={[styles.avatarText, { color: isSelected ? "#FFF" : theme.accent }]}>
                  {initials}
                </Text>
                {agent.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#00B14F" />
                  </View>
                )}
              </View>

              <View style={styles.nameContainer}>
                <Text style={[styles.nameText, { color: theme.text }]} numberOfLines={1}>
                  {agent.full_name || t("components.agent_card.fallback_name", "Agent")}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={[styles.ratingText, { color: theme.text }]}>
                    {agent.rating?.toFixed(1) || "4.8"}
                  </Text>

                  <Text style={[styles.reviewsCountText, { color: theme.muted }]}>
                    ({agent.review_count || Math.floor((agent.rating || 4.8) * 150)})
                  </Text>
                </View>

                {(agent.bank_name || agent.mobile_money_provider) && (
                  <View style={styles.bankRow}>
                    <Ionicons
                      name={agent.bank_name ? "business-outline" : "phone-portrait-outline"}
                      size={11}
                      color={theme.muted}
                    />
                    <Text style={[styles.bankText, { color: theme.muted }]} numberOfLines={1}>
                      {agent.bank_name || agent.mobile_money_provider}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Column 2: Capacity */}
          <View style={styles.col2}>
            <Text style={[styles.capacityValueText, { color: disabled ? theme.danger : theme.accent }]}>
              {formatAmountOrCompact(capacityInLocal)} {currencyCode}
            </Text>

            <Text
              style={[
                styles.capacityStatusText,
                { color: isOverLimit || isInsufficientCapacity ? theme.danger : theme.accent },
              ]}
              numberOfLines={1}
            >
              {isOverLimit
                ? "Over limit"
                : isInsufficientCapacity
                ? "Insufficient capacity"
                : "Can handle your amount"}
            </Text>

            {/* Capacity Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: isDark ? "#1E2A3A" : "#E2E8F0" }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: disabled ? theme.danger : theme.accent,
                    width: `${capacityPercent}%`,
                  },
                ]}
              />
            </View>

            <Text style={[styles.capacityPercentText, { color: theme.muted }]}>
              {capacityPercent}% available
            </Text>
          </View>

          {/* Column 3: Est. Time & Action */}
          <View style={styles.col3}>
            <View style={styles.timeRow}>
              <Ionicons name="flash" size={12} color="#F59E0B" />
              <Text style={[styles.timeText, { color: theme.text }]}>
                {agent.response_time_minutes || 5} min
              </Text>
            </View>
            <Text style={[styles.estTimeLabel, { color: theme.muted }]}>Est. payout time</Text>

            <View style={styles.availabilityRow}>
              <View style={[styles.statusDot, { backgroundColor: disabled ? theme.danger : theme.accent }]} />
              <Text style={[styles.availableText, { color: disabled ? theme.danger : theme.accent }]}>
                {disabled ? "Unavailable" : "Open now"}
              </Text>
            </View>

            <View style={[styles.arrowCircle, { backgroundColor: isSelected ? theme.accent : theme.accentSoft }]}>
              <Ionicons name="chevron-forward" size={14} color={isSelected ? "#FFF" : theme.accent} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 12,
    position: "relative",
  },
  recommendedTag: {
    position: "absolute",
    top: -10,
    left: 14,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  recommendedTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
  },
  cardDisabled: {
    opacity: 0.65,
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  col1: {
    flex: 2.8,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#07111A",
    borderRadius: 7,
  },
  nameContainer: {
    flex: 1,
    gap: 2,
  },
  nameText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
  },
  reviewsCountText: {
    fontSize: 11,
    fontWeight: "500",
  },
  bankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  bankText: {
    fontSize: 11,
    fontWeight: "500",
  },
  col2: {
    flex: 2.2,
    gap: 2,
  },
  capacityValueText: {
    fontSize: 13,
    fontWeight: "800",
  },
  capacityStatusText: {
    fontSize: 10,
    fontWeight: "700",
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    marginVertical: 3,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  capacityPercentText: {
    fontSize: 9,
    fontWeight: "600",
  },
  col3: {
    flex: 1.8,
    alignItems: "flex-end",
    gap: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "800",
  },
  estTimeLabel: {
    fontSize: 9,
    fontWeight: "500",
  },
  availabilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginVertical: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  availableText: {
    fontSize: 10,
    fontWeight: "700",
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
});
