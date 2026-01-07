import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Modal,
    Image,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores";
import apiClient from "@/services/apiClient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";
import { LinearGradient } from "expo-linear-gradient";

// Mock Data for Education Modules
const MODULES = [
    {
        id: "what_are_tokens",
        title: "What are Tokens?",
        subtitle: "Crypto Basics",
        description: "Understand the basics of digital tokens and how they work.",
        icon: "cube",
        color: "#3B82F6",
        xp: 100,
        content: `
# What are Tokens?

## Introduction
Tokens are like digital vouchers that represent value. Think of them like mobile phone credit - you buy credit, use it, but it's not actual physical cash.

## Key Concepts

1.  **Digital Assets**: NT and CT are digital assets on a blockchain.
2.  **Reference Rates**:
    *   **1 NT** ≈ 1 Nigerian Naira
    *   **1 CT** ≈ 1 CFA Franc
    *   *Note*: These are designed to be easy to understand, but they are digital tokens, not government currency.

## Why use Tokens?
*   **Speed**: Send money instantly, 24/7.
*   **Cost**: Much lower fees than traditional banks.
*   **Global**: Works across borders without restrictions.

## 💡 Did You Know?
All transactions are secured by smart contracts on the blockchain, making them transparent and irreversible.
    `,
    },
    {
        id: "how_agents_work",
        title: "How Agents Work",
        subtitle: "Deposits & Withdrawals",
        description: "Learn how to deposit and withdraw cash using local agents.",
        icon: "people",
        color: "#10B981",
        xp: 150,
        content: `
# How Agents Work

## Who are Agents?
Agents are independent partners verified by AfriExchange. They act as a bridge between your physical cash and your digital tokens.

## 📥 Depositing (Cash -> Tokens)
1.  **Find**: Locate a verified agent in the app.
2.  **Transfer**: Send them cash (Bank Transfer/Mobile Money).
3.  **Receive**: The agent mints tokens directly to your wallet.

## 📤 Withdrawing (Tokens -> Cash)
1.  **Sell**: Choose "Withdraw" and select an agent.
2.  **Escrow**: Your tokens are locked safely in escrow.
3.  **Receive**: The agent sends cash to your bank account.
4.  **Confirm**: Only release the tokens once you have the cash!

## 🛡️ The Escrow Protection
When you sell tokens, they aren't sent directly to the agent. They are held in **Escrow** (a safe middle ground). The agent only gets them *after* you confirm you received the money. This keeps you safe!
    `,
    },
    {
        id: "understanding_value",
        title: "Understanding Value",
        subtitle: "Economics 101",
        description: "How token value is maintained and guaranteed.",
        icon: "trending-up",
        color: "#8B5CF6",
        xp: 200,
        content: `
# Understanding Value

## Is this "Real" Money?
Tokens are **digital representations** of value. While they aren't physical notes, they hold real value within the AfriExchange ecosystem.

## The 1:1 Guarantee
We operate on a **Full Reserve** basis.
*   For every **1 NT** you hold, there is **1 Naira** held in our secure treasury.
*   For every **1 CT**, there is **1 CFA**.

## Transparency
We conduct regular audits to ensure our digital tokens always match our physical reserves. We do not lend out your money; it sits safely in the vault, backing the value of your tokens 100%.

## Market Rates
While the reference rate is 1:1, market forces (supply and demand) can cause slight variations when swapping between tokens, just like in a real market!
    `,
    },
    {
        id: "safety_security",
        title: "Safety & Security",
        subtitle: "Best Practices",
        description: "Best practices to keep your account and funds safe.",
        icon: "shield-checkmark",
        color: "#F59E0B",
        xp: 150,
        content: `
# Safety & Security

## Protecting Your Account
Your security starts with you. Here are the golden rules:
1.  **Strong Password**: Use a unique, complex password.
2.  **2FA**: Enable Two-Factor Authentication in Settings.
3.  **Biometrics**: Use FaceID/TouchID for secure login.

## 🚫 Common Scams to Avoid
*   **"Support" asking for passwords**: Real support will NEVER ask for your password or PIN.
*   **Fake Websites**: Always check you are on the official app.
*   **Too Good To Be True**: Avoid offers promising to "double your money".

## Transaction Safety
*   **Verify Recipient**: Transactions are irreversible. Always double-check the email or wallet address.
*   **Escrow is King**: Never send tokens directly to an agent for a withdrawal without using the official "Withdraw" flow which uses Escrow.

## Lost Phone?
Don't panic! Your tokens are on the blockchain, not your phone. Log in from another device and freeze your account immediately.
    `,
    },
];

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000];
const BADGES = [
    { id: 1, name: "Novice", icon: "ribbon", color: "#6B7280", threshold: 0 },
    { id: 2, name: "Learner", icon: "school", color: "#3B82F6", threshold: 100 },
    { id: 3, name: "Pro", icon: "trophy", color: "#F59E0B", threshold: 300 },
    { id: 4, name: "Master", icon: "medal", color: "#8B5CF6", threshold: 600 },
];

export default function EducationScreen() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [updating, setUpdating] = useState(false);

    // Initialize completed modules from user profile
    const [completedModules, setCompletedModules] = useState<string[]>(() => {
        if (!user) return [];
        const completed = [];
        if (user.education_what_are_tokens) completed.push("what_are_tokens");
        if (user.education_how_agents_work) completed.push("how_agents_work");
        if (user.education_understanding_value) completed.push("understanding_value");
        if (user.education_safety_security) completed.push("safety_security");
        return completed;
    });

    const totalXP = useMemo(() => {
        return MODULES.filter((m) => completedModules.includes(m.id)).reduce(
            (acc, curr) => acc + curr.xp,
            0
        );
    }, [completedModules]);

    const currentLevel = useMemo(() => {
        return LEVEL_THRESHOLDS.findIndex((t) => totalXP < t) === -1
            ? LEVEL_THRESHOLDS.length
            : LEVEL_THRESHOLDS.findIndex((t) => totalXP < t);
    }, [totalXP]);

    const nextLevelXP = LEVEL_THRESHOLDS[currentLevel] || 1000;
    const prevLevelXP = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
    const progressToNextLevel =
        (totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP);

    const currentBadge = BADGES.slice()
        .reverse()
        .find((b) => totalXP >= b.threshold);

    const handleModulePress = (module: any) => {
        setSelectedModule(module);
    };

    const handleCloseModal = async () => {
        if (selectedModule && !completedModules.includes(selectedModule.id)) {
            try {
                setUpdating(true);
                const fieldName = `education_${selectedModule.id}`;

                // 1. Optimistic Update
                const newCompleted = [...completedModules, selectedModule.id];
                setCompletedModules(newCompleted);

                // 2. Call Backend
                await apiClient.put("/users/profile", {
                    [fieldName]: true,
                });

                // 3. Update Global Store
                if (user) {
                    setUser({
                        ...user,
                        [fieldName]: true,
                    });
                }
            } catch (error) {
                console.error("Failed to save progress:", error);
                // Revert on error
                setCompletedModules(completedModules.filter(id => id !== selectedModule.id));
            } finally {
                setUpdating(false);
            }
        }
        setSelectedModule(null);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Gamified Header */}
                <LinearGradient
                    colors={["#111827", "#1F2937"]}
                    style={styles.headerGradient}
                >
                    <SafeAreaView edges={["top"]} style={styles.headerContent}>
                        <View style={styles.headerTop}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                            >
                                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.headerTitle}>Education Center</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.levelCircle}>
                                <Text style={styles.levelLabel}>LEVEL</Text>
                                <Text style={styles.levelValue}>{currentLevel}</Text>
                            </View>
                            <View style={styles.statsContent}>
                                <View style={styles.statsRow}>
                                    <Text style={styles.badgeName}>
                                        {currentBadge?.name || "Novice"}
                                    </Text>
                                    <Text style={styles.xpText}>
                                        {totalXP} / {nextLevelXP} XP
                                    </Text>
                                </View>
                                <View style={styles.progressBarBg}>
                                    <LinearGradient
                                        colors={["#00B14F", "#34D399"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[
                                            styles.progressBarFill,
                                            { width: `${Math.min(progressToNextLevel * 100, 100)}%` },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.nextLevelText}>
                                    {Math.round(nextLevelXP - totalXP)} XP to next level
                                </Text>
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>

                <View style={styles.modulesContainer}>
                    <Text style={styles.sectionTitle}>Learning Modules</Text>
                    {MODULES.map((module, index) => {
                        const isCompleted = completedModules.includes(module.id);
                        const isLocked =
                            index > 0 && !completedModules.includes(MODULES[index - 1].id);

                        return (
                            <TouchableOpacity
                                key={module.id}
                                style={[styles.moduleCard, isLocked && styles.moduleCardLocked]}
                                onPress={() => !isLocked && handleModulePress(module)}
                                activeOpacity={0.9}
                                disabled={isLocked}
                            >
                                <View
                                    style={[
                                        styles.iconBox,
                                        { backgroundColor: isLocked ? "#F3F4F6" : `${module.color}15` },
                                    ]}
                                >
                                    <Ionicons
                                        name={isLocked ? "lock-closed" : (module.icon as any)}
                                        size={24}
                                        color={isLocked ? "#9CA3AF" : module.color}
                                    />
                                </View>
                                <View style={styles.moduleContent}>
                                    <Text
                                        style={[
                                            styles.moduleTitle,
                                            isLocked && styles.moduleTextLocked,
                                        ]}
                                    >
                                        {module.title}
                                    </Text>
                                    <Text style={styles.moduleSubtitle}>{module.subtitle}</Text>
                                    <View style={styles.xpTag}>
                                        <Ionicons name="flash" size={12} color="#F59E0B" />
                                        <Text style={styles.xpValue}>{module.xp} XP</Text>
                                    </View>
                                </View>
                                <View style={styles.statusIcon}>
                                    {isCompleted ? (
                                        <Ionicons name="checkmark-circle" size={28} color="#00B14F" />
                                    ) : isLocked ? (
                                        <Ionicons name="lock-closed-outline" size={24} color="#D1D5DB" />
                                    ) : (
                                        <Ionicons
                                            name="play-circle-outline"
                                            size={28}
                                            color={module.color}
                                        />
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Module Content Modal */}
            <Modal
                visible={!!selectedModule}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCloseModal}
            >
                {selectedModule && (
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity
                                onPress={handleCloseModal}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <View
                                style={[
                                    styles.modalIconBox,
                                    { backgroundColor: `${selectedModule.color}15` },
                                ]}
                            >
                                <Ionicons
                                    name={selectedModule.icon as any}
                                    size={48}
                                    color={selectedModule.color}
                                />
                            </View>
                            <Text style={styles.modalTitle}>{selectedModule.title}</Text>

                            <View style={styles.markdownContainer}>
                                <Markdown style={markdownStyles}>
                                    {selectedModule.content}
                                </Markdown>
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.completeButton,
                                    { backgroundColor: selectedModule.color },
                                ]}
                                onPress={handleCloseModal}
                            >
                                <Text style={styles.completeButtonText}>
                                    {completedModules.includes(selectedModule.id)
                                        ? "Close"
                                        : `Complete & Earn ${selectedModule.xp} XP`}
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F9FAFB",
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerGradient: {
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 24,
        marginTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.1)",
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    statsContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    levelCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    levelLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#6B7280",
    },
    levelValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        lineHeight: 28,
    },
    statsContent: {
        flex: 1,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    badgeName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    xpText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#D1D5DB",
    },
    progressBarBg: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 3,
        marginBottom: 6,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 3,
    },
    nextLevelText: {
        fontSize: 11,
        color: "#9CA3AF",
    },
    modulesContainer: {
        padding: 20,
        marginTop: -10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 16,
    },
    moduleCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#F3F4F6",
    },
    moduleCardLocked: {
        opacity: 0.8,
        backgroundColor: "#F9FAFB",
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    moduleContent: {
        flex: 1,
        marginRight: 12,
    },
    moduleTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    moduleTextLocked: {
        color: "#6B7280",
    },
    moduleSubtitle: {
        fontSize: 13,
        color: "#6B7280",
        marginBottom: 8,
    },
    xpTag: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFBEB",
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#FEF3C7",
    },
    xpValue: {
        fontSize: 11,
        fontWeight: "700",
        color: "#B45309",
        marginLeft: 4,
    },
    statusIcon: {
        marginLeft: 4,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    modalHeader: {
        alignItems: "flex-end",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    closeButton: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
        backgroundColor: "#F3F4F6",
    },
    modalContent: {
        padding: 24,
        paddingBottom: 40,
    },
    modalIconBox: {
        width: 64,
        height: 64,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        alignSelf: "center",
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "800",
        color: "#111827",
        marginBottom: 24,
        textAlign: "center",
    },
    markdownContainer: {
        marginBottom: 32,
    },
    completeButton: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    completeButtonText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});

const markdownStyles = StyleSheet.create({
    body: {
        fontSize: 16,
        color: "#374151",
        lineHeight: 24,
    },
    heading1: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },
    heading2: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        marginTop: 16,
        marginBottom: 8,
    },
    strong: {
        fontWeight: "700",
        color: "#111827",
    },
    list_item: {
        marginBottom: 8,
    },
    blockquote: {
        backgroundColor: "#F3F4F6",
        borderLeftWidth: 4,
        borderLeftColor: "#D1D5DB",
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 12,
    },
});
