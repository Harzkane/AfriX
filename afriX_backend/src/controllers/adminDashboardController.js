// File: src/controllers/adminDashboardController.js
const { User, Wallet, Transaction, Agent, Merchant, Dispute, Escrow, MintRequest, BurnRequest, WithdrawalRequest } = require("../models");
const { USER_ROLES, TRANSACTION_STATUS, DISPUTE_STATUS, REQUEST_STATUS, ESCROW_STATUS, DISPUTE_ESCALATION_LEVELS } = require("../config/constants");
const { Op } = require("sequelize");
const { sequelize } = require("../config/database");
const platformService = require("../services/platformService");

const adminDashboardController = {
    /**
     * Get comprehensive dashboard overview
     * GET /api/v1/admin/dashboard/overview
     * Returns all critical metrics in a single API call
     */
    getOverview: async (req, res) => {
        try {
            // Execute all queries in parallel for performance
            const [
                userStats,
                agentStats,
                transactionStats,
                walletStats,
                disputeStats,
                escrowStats,
                requestStats,
                securityStats,
                pendingCounts,
                platformFeeBalances
            ] = await Promise.all([
                getUserStatistics(),
                getAgentStatistics(),
                getTransactionStatistics(),
                getWalletStatistics(),
                getDisputeStatistics(),
                getEscrowStatistics(),
                getRequestStatistics(),
                getSecurityStatistics(),
                getPendingCounts(),
                platformService.getPlatformFeeBalances().catch(() => ({ NT: 0, CT: 0, USDT: 0 }))
            ]);

            res.status(200).json({
                success: true,
                data: {
                    users: userStats,
                    agents: agentStats,
                    transactions: transactionStats,
                    wallets: walletStats,
                    disputes: disputeStats,
                    escrows: escrowStats,
                    requests: requestStats,
                    security: securityStats,
                    pending: pendingCounts,
                    platform_fee_balances: platformFeeBalances,
                    lastUpdated: new Date()
                }
            });
        } catch (error) {
            console.error("Get dashboard overview error:", error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get user statistics
 */
async function getUserStatistics() {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const suspendedUsers = await User.count({ where: { is_suspended: true } });

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentRegistrations = await User.count({
        where: { created_at: { [Op.gte]: thirtyDaysAgo } }
    });

    // User growth over last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userGrowth = await User.findAll({
        attributes: [
            [sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'month'],
            [sequelize.fn('count', sequelize.col('id')), 'count']
        ],
        where: {
            created_at: { [Op.gte]: sixMonthsAgo }
        },
        group: [sequelize.fn('date_trunc', 'month', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'ASC']],
        raw: true
    });

    const formattedGrowth = userGrowth.map(item => ({
        name: new Date(item.month).toLocaleString('default', { month: 'short' }),
        users: parseInt(item.count || 0)
    }));

    return {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
        recent_30d: recentRegistrations,
        growth_history: formattedGrowth
    };
}

/**
 * Get agent statistics
 */
async function getAgentStatistics() {
    const totalAgents = await Agent.count();
    const activeAgents = await Agent.count({ where: { status: 'active' } });
    const pendingAgents = await Agent.count({ where: { status: 'pending' } });
    const verifiedAgents = await Agent.count({ where: { is_verified: true } });

    // Agent tier distribution
    const tierDistribution = await Agent.findAll({
        attributes: [
            'tier',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['tier'],
        raw: true
    });

    const formattedTiers = tierDistribution.map(item => ({
        name: `Tier ${item.tier}`,
        value: parseInt(item.count || 0)
    }));

    return {
        total: totalAgents,
        active: activeAgents,
        pending: pendingAgents,
        verified: verifiedAgents,
        tier_distribution: formattedTiers
    };
}

/**
 * Get transaction statistics
 */
async function getTransactionStatistics() {
    const totalTransactions = await Transaction.count();
    const completedTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.COMPLETED }
    });
    const pendingTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.PENDING }
    });
    const failedTransactions = await Transaction.count({
        where: { status: TRANSACTION_STATUS.FAILED }
    });

    // Recent 24h activity
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24hCount = await Transaction.count({
        where: { created_at: { [Op.gte]: last24h } }
    });

    // Total fees collected
    const totalFees = await Transaction.sum("fee", {
        where: { status: TRANSACTION_STATUS.COMPLETED }
    });

    // Volume History (Last 6 Months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const volumeHistory = await Transaction.findAll({
        attributes: [
            [sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'month'],
            [sequelize.fn('count', sequelize.col('id')), 'count'],
            [sequelize.fn('sum', sequelize.col('amount')), 'amount']
        ],
        where: {
            created_at: { [Op.gte]: sixMonthsAgo }
        },
        group: [sequelize.fn('date_trunc', 'month', sequelize.col('created_at'))],
        order: [[sequelize.fn('date_trunc', 'month', sequelize.col('created_at')), 'ASC']],
        raw: true
    });

    const formattedHistory = volumeHistory.map(item => ({
        name: new Date(item.month).toLocaleString('default', { month: 'short' }),
        transactions: parseInt(item.count || 0),
        activity: Math.round(parseFloat(item.count || 0) * 0.7)
    }));

    // Status distribution
    const statusDistribution = [
        { name: "Completed", value: completedTransactions, color: "#10b981" },
        { name: "Pending", value: pendingTransactions, color: "#3b82f6" },
        { name: "Failed", value: failedTransactions, color: "#ef4444" }
    ];

    return {
        total: totalTransactions,
        completed: completedTransactions,
        pending: pendingTransactions,
        failed: failedTransactions,
        recent_24h: recent24hCount,
        total_fees: parseFloat(totalFees || 0).toFixed(2),
        volume_history: formattedHistory,
        status_distribution: statusDistribution
    };
}

/**
 * Get wallet statistics
 */
async function getWalletStatistics() {
    const totalWallets = await Wallet.count();
    const activeWallets = await Wallet.count({ where: { is_active: true } });
    const frozenWallets = await Wallet.count({ where: { is_frozen: true } });

    // Total value locked by token type
    const balancesByType = await Wallet.findAll({
        attributes: [
            'token_type',
            [sequelize.fn('SUM', sequelize.col('balance')), 'total_balance'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'wallet_count']
        ],
        group: ['token_type'],
        raw: true
    });

    const tvlByToken = balancesByType.reduce((acc, item) => {
        acc[item.token_type] = {
            total_balance: parseFloat(item.total_balance || 0).toFixed(2),
            wallet_count: parseInt(item.wallet_count)
        };
        return acc;
    }, {});

    // Calculate total TVL
    const totalTVL = balancesByType.reduce((sum, item) =>
        sum + parseFloat(item.total_balance || 0), 0
    );

    // Token distribution for pie chart
    const tokenDistribution = balancesByType.map((item, index) => ({
        name: item.token_type,
        value: parseFloat(item.total_balance || 0),
        color: ['#f97316', '#0ea5e9', '#10b981'][index] || '#6366f1'
    }));

    return {
        total_wallets: totalWallets,
        active: activeWallets,
        frozen: frozenWallets,
        total_tvl: totalTVL.toFixed(2),
        tvl_by_token: tvlByToken,
        token_distribution: tokenDistribution
    };
}

/**
 * Get dispute statistics
 */
async function getDisputeStatistics() {
    const totalDisputes = await Dispute.count();
    const openDisputes = await Dispute.count({
        where: { status: { [Op.in]: [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.INVESTIGATING] } }
    });
    const resolvedDisputes = await Dispute.count({
        where: { status: DISPUTE_STATUS.RESOLVED }
    });

    // Critical disputes (level 3)
    const criticalDisputes = await Dispute.count({
        where: {
            escalation_level: DISPUTE_ESCALATION_LEVELS.ARBITRATION,
            status: { [Op.in]: [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.INVESTIGATING] }
        }
    });

    return {
        total: totalDisputes,
        open: openDisputes,
        resolved: resolvedDisputes,
        critical: criticalDisputes
    };
}

/**
 * Get escrow statistics
 */
async function getEscrowStatistics() {
    const totalEscrows = await Escrow.count();
    const activeEscrows = await Escrow.count({
        where: { status: ESCROW_STATUS.LOCKED }
    });
    const expiredEscrows = await Escrow.count({
        where: {
            status: ESCROW_STATUS.LOCKED,
            expires_at: { [Op.lt]: new Date() }
        }
    });

    return {
        total: totalEscrows,
        active: activeEscrows,
        expired: expiredEscrows
    };
}

/**
 * Get mint/burn request statistics
 */
async function getRequestStatistics() {
    // Count all request types
    const [mintCount, burnCount, withdrawalCount] = await Promise.all([
        MintRequest.count(),
        BurnRequest.count(),
        WithdrawalRequest.count()
    ]);

    const totalRequests = mintCount + burnCount + withdrawalCount;

    // Count pending requests
    const [pendingMintRequests, pendingBurnRequests] = await Promise.all([
        MintRequest.count({ where: { status: 'pending' } }),
        BurnRequest.count({ where: { status: 'pending' } })
    ]);

    return {
        total: totalRequests,
        pending_mint: pendingMintRequests,
        pending_burn: pendingBurnRequests,
        pending_total: pendingMintRequests + pendingBurnRequests
    };
}

/**
 * Get security statistics
 */
async function getSecurityStatistics() {
    const lockedAccounts = await User.count({
        where: { locked_until: { [Op.gt]: new Date() } }
    });

    const unverifiedEmails = await User.count({
        where: { email_verified: false }
    });

    const failedLoginAttempts = await User.count({
        where: { login_attempts: { [Op.gte]: 3 } }
    });

    // Flagged transactions
    const flaggedTransactions = await Transaction.count({
        where: {
            'metadata.flagged': true
        }
    });

    return {
        locked_accounts: lockedAccounts,
        unverified_emails: unverifiedEmails,
        failed_login_attempts: failedLoginAttempts,
        flagged_transactions: flaggedTransactions,
        total_alerts: lockedAccounts + failedLoginAttempts + flaggedTransactions
    };
}

/**
 * Get pending counts for "Requires Attention" section
 */
async function getPendingCounts() {
    // Pending KYC approvals (agents)
    const pendingKYC = await Agent.count({
        where: {
            status: 'pending',
            is_verified: false
        }
    });

    // Pending withdrawal requests
    const pendingWithdrawals = await WithdrawalRequest.count({
        where: {
            status: 'pending'
        }
    });

    // Critical disputes
    const criticalDisputes = await Dispute.count({
        where: {
            escalation_level: DISPUTE_ESCALATION_LEVELS.ARBITRATION,
            status: { [Op.in]: [DISPUTE_STATUS.OPEN, DISPUTE_STATUS.INVESTIGATING] }
        }
    });

    // Expired escrows
    const expiredEscrows = await Escrow.count({
        where: {
            status: ESCROW_STATUS.LOCKED,
            expires_at: { [Op.lt]: new Date() }
        }
    });

    // High severity flagged transactions
    const highSeverityFlags = await Transaction.count({
        where: {
            [Op.and]: [
                { 'metadata.flagged': true },
                { 'metadata.flag_severity': 'high' }
            ]
        }
    });

    return {
        kyc_approvals: pendingKYC,
        withdrawals: pendingWithdrawals,
        critical_disputes: criticalDisputes,
        expired_escrows: expiredEscrows,
        flagged_transactions: highSeverityFlags,
        total: pendingKYC + pendingWithdrawals + criticalDisputes + expiredEscrows + highSeverityFlags
    };
}

module.exports = adminDashboardController;
