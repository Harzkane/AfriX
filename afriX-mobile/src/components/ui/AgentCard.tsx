// src/components/ui/AgentCard.tsx
import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatAmountOrCompact } from "@/utils/format";
import { useWalletStore } from "@/stores";
import { useTranslation } from "react-i18next";

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
}

interface AgentCardProps {
  agent: Agent;
  onSelect: (agent: Agent) => void;
  /** When set, card shows whether agent can handle this amount (Buy/Sell flows) */
  userAmount?: number;
  /** Token type for formatting (NT, CT, USDT) */
  tokenType?: string;
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

/**
 * Convert user amount (NT/CT/USDT) to USDT for capacity comparison.
 * Uses backend rates from wallet store (GET /wallets/rates). No hardcoded rates.
 */
function toUsdt(
  amount: number,
  tokenType: string,
  rates: { USDT_TO_NT: number; USDT_TO_CT: number }
): number | null {
  if (tokenType === "USDT") return amount;
  if (tokenType === "NT") {
    const rate = rates?.USDT_TO_NT;
    if (!rate || rate <= 0) return null;
    return amount / rate;
  }
  if (tokenType === "CT") {
    const rate = rates?.USDT_TO_CT;
    if (!rate || rate <= 0) return null;
    return amount / rate;
  }
  return amount;
}

/**
 * Convert agent's USDT capacity to NT/CT. Used for Max/trade (capped by max_transaction_limit).
 */
function capacityToLocal(
  capacityUsdt: number,
  tokenType: string,
  rates: { USDT_TO_NT: number; USDT_TO_CT: number }
): number | null {
  if (tokenType === "NT") {
    const rate = rates?.USDT_TO_NT;
    if (!rate || rate <= 0) return null;
    return capacityUsdt * rate;
  }
  if (tokenType === "CT") {
    const rate = rates?.USDT_TO_CT;
    if (!rate || rate <= 0) return null;
    return capacityUsdt * rate;
  }
  return null;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  onSelect,
  userAmount,
  tokenType = "USDT",
}) => {
  const { exchangeRates } = useWalletStore();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = {
    card: isDark ? "#0E1726" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#111827",
    muted: isDark ? "#94A3B8" : "#6B7280",
    border: isDark ? "#1E2A3A" : "#F3F4F6",
  };
  const tierColor = getTierColor(agent.tier);
  const initials = agent.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2) || "AG";

function limitToLocal(
  limitUsdt: number | null,
  tokenType: string,
  rates: { USDT_TO_NT: number; USDT_TO_CT: number }
): number | null {
  if (limitUsdt == null) return null;
  if (tokenType === "NT") {
    const rate = rates?.USDT_TO_NT;
    if (!rate || rate <= 0) return null;
    return limitUsdt * rate;
  }
  if (tokenType === "CT") {
    const rate = rates?.USDT_TO_CT;
    if (!rate || rate <= 0) return null;
    return limitUsdt * rate;
  }
  return limitUsdt;
}

  const capacity = Number(agent.available_capacity) || 0;
  const maxLimitStored = agent.max_transaction_limit != null ? Number(agent.max_transaction_limit) : null;
  const maxTradeUnit = tokenType === "NT" || tokenType === "CT" ? tokenType : agent.country === "NG" ? "NT" : "CT";
  
  const capacityInLocal = capacityToLocal(capacity, maxTradeUnit, exchangeRates);
  const maxLimitInLocal = limitToLocal(maxLimitStored, maxTradeUnit, exchangeRates);
  
  // The effective max trade in local tokens is the smaller of local capacity and local transaction limit
  const effectiveMaxTrade =
    capacityInLocal != null && maxLimitInLocal != null
      ? Math.min(capacityInLocal, maxLimitInLocal)
      : capacityInLocal != null
        ? capacityInLocal
        : maxLimitInLocal;

  const userAmountUsdt =
    userAmount != null && userAmount > 0
      ? toUsdt(userAmount, tokenType, exchangeRates)
      : null;

  const canHandleCapacity =
    userAmountUsdt == null ? true : capacity >= userAmountUsdt;

  // Compare USDT equivalent of user amount against the agent's USDT limit
  const canHandleMax =
    userAmountUsdt == null || maxLimitStored == null ? true : maxLimitStored >= userAmountUsdt;

  const canHandleAmount =
    userAmount != null &&
    userAmount > 0 &&
    canHandleCapacity &&
    canHandleMax;
  const commissionPercent =
    agent.commission_rate != null ? (Number(agent.commission_rate) * 100).toFixed(1) : null;
  const isActive = agent.is_online === true || agent.status === "active";
  const location = [agent.city, agent.country].filter(Boolean).join(", ") || null;

  const disabled = userAmount != null && userAmount > 0 && !canHandleAmount;

  return (
    <TouchableOpacity
      onPress={() => onSelect(agent)}
      activeOpacity={0.7}
      disabled={disabled}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }, disabled && styles.cardDisabled]}
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
              <Text style={[styles.name, { color: theme.text }]}>{agent.full_name || t("components.agent_card.fallback_name", "Agent")}</Text>
              <View
                style={[
                  styles.tierBadge,
                  { backgroundColor: tierColor + "15", borderColor: tierColor + "30" },
                ]}
              >
                <Text style={[styles.tierText, { color: tierColor }]}>
                  {agent.tier || t("components.agent_card.tier_starter", "starter")}
                </Text>
              </View>
              {isActive && (
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{t("components.agent_card.status_active", "Active")}</Text>
                </View>
              )}
            </View>

            {location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={12} color={theme.muted} />
                <Text style={[styles.locationText, { color: theme.muted }]}>{location}</Text>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={[styles.ratingText, { color: isDark ? "#FBBF24" : "#F59E0B" }]}>{agent.rating?.toFixed(1) || "0.0"}</Text>
              </View>
              <Text style={[styles.dot, { color: theme.muted }]}>•</Text>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={14} color={theme.muted} />
                <Text style={[styles.responseText, { color: theme.muted }]}>
                  ~{agent.response_time_minutes ?? 0} min
                </Text>
              </View>
              {commissionPercent != null && (
                <>
                  <Text style={[styles.dot, { color: theme.muted }]}>•</Text>
                  <Text style={[styles.feeText, { color: theme.muted }]}>~{commissionPercent}% fee</Text>
                </>
              )}
            </View>
          </View>

          <Ionicons name="chevron-forward" size={20} color={theme.muted} />
        </View>

        {/* Footer Info - stacked rows to avoid overlap */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <View style={styles.footerIcon}>
                <Ionicons name="wallet-outline" size={14} color="#00B14F" />
              </View>
              <Text style={[styles.footerLabel, { color: theme.muted }]}>{t("components.agent_card.label_capacity", "Capacity")}</Text>
              <Text style={[styles.footerValue, { color: theme.text }]} numberOfLines={1}>
                ${formatAmountOrCompact(capacity)}
              </Text>
            </View>
            {effectiveMaxTrade != null && effectiveMaxTrade > 0 && (
              <View style={styles.footerItem}>
                <View style={styles.footerIcon}>
                  <Ionicons name="card-outline" size={14} color="#6B7280" />
                </View>
                <Text style={[styles.footerLabel, { color: theme.muted }]}>{t("components.agent_card.label_max_trade", "Max/trade")}</Text>
                <Text style={[styles.footerValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {formatAmountOrCompact(effectiveMaxTrade, maxTradeUnit)}
                </Text>
              </View>
            )}
          </View>
          {(agent.bank_name || agent.mobile_money_provider) ? (
            <View style={styles.footerRow}>
              {agent.bank_name ? (
                <View style={styles.footerItem}>
                  <View style={styles.footerIcon}>
                    <Ionicons name="business-outline" size={14} color="#00B14F" />
                  </View>
                  <Text style={[styles.footerLabel, { color: theme.muted }]}>{t("components.agent_card.label_bank", "Bank")}</Text>
                  <Text style={[styles.footerValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {agent.bank_name}
                  </Text>
                </View>
              ) : null}
              {agent.mobile_money_provider ? (
                <View style={styles.footerItem}>
                  <View style={styles.footerIcon}>
                    <Ionicons name="phone-portrait-outline" size={14} color="#00B14F" />
                  </View>
                  <Text style={[styles.footerLabel, { color: theme.muted }]}>{t("components.agent_card.label_mobile", "Mobile")}</Text>
                  <Text style={[styles.footerValue, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                    {agent.mobile_money_provider}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {userAmount != null && userAmount > 0 && (
          <View style={[canHandleAmount ? styles.canHandleRow : styles.cannotHandleRow, { borderTopColor: theme.border }]}>
            <Ionicons
              name={canHandleAmount ? "checkmark-circle" : "warning"}
              size={16}
              color={canHandleAmount ? "#059669" : "#B45309"}
            />
            <Text
              style={[
                styles.canHandleText,
                canHandleAmount ? styles.canHandleTextOk : styles.cannotHandleText,
              ]}
            >
              {canHandleAmount
                ? t("components.agent_card.can_handle", "Can handle your amount")
                : t("components.agent_card.cannot_handle", "Insufficient capacity or over limit")}
            </Text>
          </View>
        )}
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
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 10,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 16,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    minWidth: 120,
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
    flex: 1,
  },
  cardDisabled: {
    opacity: 0.7,
  },
  statusPill: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#00B14F",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
    textTransform: "uppercase",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  feeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
  },
  canHandleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  cannotHandleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#FEF3C7",
  },
  canHandleText: {
    fontSize: 13,
    fontWeight: "600",
  },
  canHandleTextOk: {
    color: "#059669",
  },
  cannotHandleText: {
    color: "#B45309",
  },
});
