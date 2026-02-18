// File: src/models/index.js
const { sequelize } = require("../config/database");

// ===== Import all models =====
const User = require("./User");
const Wallet = require("./Wallet");
const Transaction = require("./Transaction");
const Merchant = require("./Merchant");
const Agent = require("./Agent");
const Escrow = require("./Escrow");
const Dispute = require("./Dispute");
const MintRequest = require("./MintRequest");
const BurnRequest = require("./BurnRequest");
const WithdrawalRequest = require("./WithdrawalRequest");
const AgentReview = require("./AgentReview");
const AgentKyc = require("./AgentKyc");
const MerchantKyc = require("./MerchantKyc");
const Education = require("./Education");
const Notification = require("./Notification");
const UserNotificationSettings = require("./UserNotificationSettings");

// ========== Associations ==========

//  User <-> Wallet
User.hasMany(Wallet, {
  foreignKey: "user_id",
  as: "wallets",
  onDelete: "CASCADE",
});
Wallet.belongsTo(User, { foreignKey: "user_id", as: "user" });

//  User (security audit) -> Admin who unlocked / reset
User.belongsTo(User, { foreignKey: "last_unlocked_by_id", as: "lastUnlockedBy" });
User.belongsTo(User, { foreignKey: "last_reset_attempts_by_id", as: "lastResetAttemptsBy" });

//  User <-> Merchant (one-to-one)
User.hasOne(Merchant, {
  foreignKey: "user_id",
  as: "merchant",
  onDelete: "CASCADE",
});
Merchant.belongsTo(User, { foreignKey: "user_id", as: "owner" });

//  MERCHANT <-> WALLET (settlement)
Wallet.hasOne(Merchant, {
  foreignKey: "settlement_wallet_id",
  as: "settlementWallet",
});
Merchant.belongsTo(Wallet, {
  foreignKey: "settlement_wallet_id",
  as: "wallet",
});

//  User <-> Agent (one-to-one)
User.hasOne(Agent, { foreignKey: "user_id", as: "agent", onDelete: "CASCADE" });
Agent.belongsTo(User, { foreignKey: "user_id", as: "user" });

//  TRANSACTIONS <-> USERS
User.hasMany(Transaction, {
  foreignKey: "from_user_id",
  as: "sentTransactions",
});
User.hasMany(Transaction, {
  foreignKey: "to_user_id",
  as: "receivedTransactions",
});
Transaction.belongsTo(User, { foreignKey: "from_user_id", as: "fromUser" });
Transaction.belongsTo(User, { foreignKey: "to_user_id", as: "toUser" });

//  TRANSACTIONS <-> WALLETS
Wallet.hasMany(Transaction, {
  foreignKey: "from_wallet_id",
  as: "outgoingTransactions",
});
Wallet.hasMany(Transaction, {
  foreignKey: "to_wallet_id",
  as: "incomingTransactions",
});
Transaction.belongsTo(Wallet, {
  foreignKey: "from_wallet_id",
  as: "fromWallet",
});
Transaction.belongsTo(Wallet, { foreignKey: "to_wallet_id", as: "toWallet" });

//  TRANSACTIONS <-> MERCHANTS
Merchant.hasMany(Transaction, {
  foreignKey: "merchant_id",
  as: "merchantTransactions",
});
Transaction.belongsTo(Merchant, { foreignKey: "merchant_id", as: "merchant" });

//  TRANSACTIONS <-> AGENTS
Agent.hasMany(Transaction, { foreignKey: "agent_id", as: "agentTransactions" });
Transaction.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });

//  ESCROW <-> TRANSACTION
Transaction.hasOne(Escrow, { foreignKey: "transaction_id", as: "escrow" });
Escrow.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "transaction",
});

//  ESCROW <-> USER + AGENT
User.hasMany(Escrow, { foreignKey: "from_user_id", as: "userEscrows" });
Escrow.belongsTo(User, { foreignKey: "from_user_id", as: "fromUser" });
Agent.hasMany(Escrow, { foreignKey: "agent_id", as: "agentEscrows" });
Escrow.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });

//  DISPUTE <-> ESCROW + TRANSACTION + AGENT
Escrow.hasOne(Dispute, { foreignKey: "escrow_id", as: "dispute" });
Dispute.belongsTo(Escrow, { foreignKey: "escrow_id", as: "escrow" });
Transaction.hasOne(Dispute, {
  foreignKey: "transaction_id",
  as: "disputeTransaction",
});
Dispute.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "transaction",
});
// DISPUTE <-> USER ASSOCIATION
User.hasMany(Dispute, { foreignKey: "opened_by_user_id", as: "disputes" });
Dispute.belongsTo(User, { foreignKey: "opened_by_user_id", as: "user" });

Agent.hasMany(Dispute, { foreignKey: "agent_id", as: "agentDisputes" });
Dispute.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });

// MintRequest <-> Agent
MintRequest.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });
Agent.hasMany(MintRequest, { foreignKey: "agent_id", as: "mintRequests" });

// MintRequest <-> User
MintRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(MintRequest, { foreignKey: "user_id", as: "mintRequests" });

// MintRequest <-> Dispute
MintRequest.hasOne(Dispute, { foreignKey: "mint_request_id", as: "dispute" });
Dispute.belongsTo(MintRequest, { foreignKey: "mint_request_id", as: "mintRequest" });

// BurnRequest <-> Agent
BurnRequest.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });
Agent.hasMany(BurnRequest, { foreignKey: "agent_id", as: "burnRequests" });

// BurnRequest <-> User
BurnRequest.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(BurnRequest, { foreignKey: "user_id", as: "burnRequests" });

// BURNREQUEST <-> ESCROW ASSOCIATION
BurnRequest.belongsTo(Escrow, { foreignKey: "escrow_id", as: "escrow" });
Escrow.hasOne(BurnRequest, { foreignKey: "escrow_id", as: "burnRequest" });

// WithdrawalRequest <-> Agent
WithdrawalRequest.belongsTo(Agent, {
  foreignKey: "agent_id",
  as: "agent",
  onDelete: "CASCADE",
});
Agent.hasMany(WithdrawalRequest, {
  foreignKey: "agent_id",
  as: "withdrawalRequests",
  onDelete: "CASCADE",
});

// AgentReview <-> User (User can give many reviews)
AgentReview.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(AgentReview, { foreignKey: "user_id", as: "reviews_given" });

// AgentReview <-> Agent (Agent can receive many reviews)
AgentReview.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });
Agent.hasMany(AgentReview, { foreignKey: "agent_id", as: "reviews" });

// AgentReview <-> Transaction (One review per transaction)
AgentReview.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "transaction",
});
Transaction.hasOne(AgentReview, {
  foreignKey: "transaction_id",
  as: "review",
});

// Agent <-> AgentKyc
Agent.hasOne(AgentKyc, { foreignKey: "agent_id", as: "kyc", onDelete: "CASCADE" });
AgentKyc.belongsTo(Agent, { foreignKey: "agent_id", as: "agent" });

// Merchant <-> MerchantKyc
Merchant.hasOne(MerchantKyc, {
  foreignKey: "merchant_id",
  as: "merchantKyc",
  onDelete: "CASCADE",
});

MerchantKyc.belongsTo(Merchant, {
  foreignKey: "merchant_id",
  as: "merchantRef", // ✅ unique alias to avoid collision
});

// User <-> Education (one user has many education records)
User.hasMany(Education, {
  foreignKey: "user_id",
  as: "education_progress",
  onDelete: "CASCADE",
});

Education.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// User <-> Notification (inbox)
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications", onDelete: "CASCADE" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

// User <-> UserNotificationSettings (one-to-one)
User.hasOne(UserNotificationSettings, { foreignKey: "user_id", as: "notificationSettings", onDelete: "CASCADE" });
UserNotificationSettings.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ========== Export ==========
module.exports = {
  sequelize,
  User,
  Wallet,
  Transaction,
  Merchant,
  Agent,
  Escrow,
  Dispute,
  MintRequest,
  BurnRequest,
  WithdrawalRequest,
  AgentReview,
  AgentKyc,
  MerchantKyc,
  Education,
  Notification,
  UserNotificationSettings,
};
