// src/components/ui/TokenSelectModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWalletStore } from "@/stores";
import { formatAmount } from "@/utils/format";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

export type TokenType = "NT" | "CT" | "USDT";

export const TOKEN_CONFIG: Record<
  TokenType,
  { name: string; subtitle: string; color: string; bg: string }
> = {
  CT: {
    name: "CFA Token",
    subtitle: "Regional",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.15)",
  },
  NT: {
    name: "Naira Token",
    subtitle: "Domestic",
    color: "#00B14F",
    bg: "rgba(0,177,79,0.15)",
  },
  USDT: {
    name: "Tether",
    subtitle: "Reserve",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
  },
};

interface TokenSelectModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectToken: (token: TokenType) => void;
  selectedToken: TokenType;
  title?: string;
}

export default function TokenSelectModal({
  visible,
  onClose,
  onSelectToken,
  selectedToken,
  title,
}: TokenSelectModalProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { getWalletByType } = useWalletStore();

  const theme = {
    background: isDark ? "#0E1726" : "#FFFFFF",
    overlay: "rgba(0, 0, 0, 0.5)",
    text: isDark ? "#F8FAFC" : "#0F172A",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1E2A3A" : "#E2E8F0",
    accent: "#00B14F",
    accentSoft: isDark ? "rgba(0,177,79,0.14)" : "#EAF8EF",
    cardHover: isDark ? "#111C2B" : "#F8FAFC",
  };

  const tokens: TokenType[] = ["CT", "NT", "USDT"];

  const handleSelect = (token: TokenType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectToken(token);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.background, borderColor: theme.border }]}>
              {/* Handle bar */}
              <View style={[styles.handleBar, { backgroundColor: theme.border }]} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {title || t("swap_tokens.modal.title", "Select Token")}
                </Text>
                <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: theme.cardHover }]}>
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>

              {/* Token list */}
              <View style={styles.tokenList}>
                {tokens.map((token) => {
                  const isSelected = selectedToken === token;
                  const config = TOKEN_CONFIG[token];
                  const wallet = getWalletByType(token);
                  const balance = wallet ? parseFloat(wallet.available_balance) : 0;

                  return (
                    <TouchableOpacity
                      key={token}
                      style={[
                        styles.tokenItem,
                        { borderColor: isSelected ? theme.accent : theme.border, backgroundColor: isSelected ? theme.accentSoft : theme.cardHover },
                      ]}
                      onPress={() => handleSelect(token)}
                      activeOpacity={0.8}
                    >
                      {/* Icon */}
                      <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
                        <Text style={[styles.iconText, { color: config.color }]}>{token}</Text>
                      </View>

                      {/* Name & Subtitle */}
                      <View style={styles.infoCol}>
                        <View style={styles.nameRow}>
                          <Text style={[styles.tokenSymbol, { color: theme.text }]}>{token}</Text>
                          <Text style={[styles.tokenSubtitle, { color: theme.muted }]}> • {config.subtitle}</Text>
                        </View>
                        <Text style={[styles.tokenName, { color: theme.muted }]}>{config.name}</Text>
                      </View>

                      {/* Balance & Checkmark */}
                      <View style={styles.rightCol}>
                        <Text style={[styles.balanceText, { color: theme.text }]}>
                          {formatAmount(balance, token)}
                        </Text>
                        <Text style={[styles.balanceLabel, { color: theme.muted }]}>Available</Text>
                      </View>

                      {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tokenList: {
    gap: 10,
  },
  tokenItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 14,
    position: "relative",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 15,
    fontWeight: "900",
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tokenSymbol: {
    fontSize: 16,
    fontWeight: "800",
  },
  tokenSubtitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  tokenName: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  rightCol: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: "700",
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
});
