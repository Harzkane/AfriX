// File: src/services/walletService.js
const { sequelize } = require("../config/database");
const { Wallet, Transaction, User } = require("../models");
const {
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  PLATFORM_FEES,
} = require("../config/constants");
const { ApiError } = require("../utils/errors");
// const platformService = require("./platformService");
const { generateTransactionReference } = require("../utils/helpers");
const { ethers } = require("ethers");
const crypto = require("crypto");

async function encryptPrivateKey(privateKey) {
  try {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error("ENCRYPTION_KEY is not defined in .env");
    }
    const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    if (key.length !== 32) {
      throw new Error(
        "ENCRYPTION_KEY must be a 64-character hex string (32 bytes)"
      );
    }
    const algorithm = "aes-256-cbc";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    const result = `${iv.toString("hex")}:${encrypted}`;
    console.log("Encrypted private key:", result);
    return result;
  } catch (error) {
    console.error("Error in encryptPrivateKey:", error.message);
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

const walletService = {
  async getOrCreateWallet(userId, token_type, t = null) {
    console.log("getOrCreateWallet called with:", { userId, token_type });
    let wallet = await Wallet.findOne({
      where: { user_id: userId, token_type },
      transaction: t,
    });
    if (!wallet) {
      const ethWallet = ethers.Wallet.createRandom();
      console.log("Generated wallet:", { address: ethWallet.address });
      const encryptedPrivateKey = await encryptPrivateKey(ethWallet.privateKey);
      console.log(
        "Creating wallet with encrypted_private_key:",
        encryptedPrivateKey
      );
      wallet = await Wallet.create(
        {
          user_id: userId,
          token_type,
          balance: 0,
          blockchain_address: ethWallet.address,
          encrypted_private_key: encryptedPrivateKey,
        },
        { transaction: t }
      );
      console.log("Wallet created:", wallet.toJSON());
    }
    return wallet;
  },

  async credit({ userId, amount, token_type, type, metadata = {} }) {
    if (amount <= 0) throw new ApiError("Invalid amount", 400);

    return sequelize.transaction(async (t) => {
      const wallet = await this.getOrCreateWallet(userId, token_type, t);

      // Parse and update balance
      const currentBalance = parseFloat(wallet.balance) || 0;
      const amountToAdd = parseFloat(amount);
      const currentReceived = parseFloat(wallet.total_received) || 0;

      wallet.balance = currentBalance + amountToAdd;
      wallet.total_received = currentReceived + amountToAdd;
      wallet.transaction_count += 1;

      // Save once with transaction context
      await wallet.save({ transaction: t });

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: type || TRANSACTION_TYPES.CREDIT,
          status: TRANSACTION_STATUS.COMPLETED,
          to_user_id: userId,
          to_wallet_id: wallet.id,
          amount,
          token_type,
          description: metadata.description || "Wallet credit",
          metadata,
        },
        { transaction: t }
      );

      return { wallet, transaction: tx };
    });
  },

  async debit({ userId, amount, token_type, type, metadata = {} }) {
    if (amount <= 0) throw new ApiError("Invalid amount", 400);

    return sequelize.transaction(async (t) => {
      const wallet = await Wallet.findOne({
        where: { user_id: userId, token_type },
        transaction: t,
      });

      if (!wallet) throw new ApiError("Wallet not found", 404);
      if (wallet.is_frozen) throw new ApiError("Wallet is frozen", 403);

      const currentBalance = parseFloat(wallet.balance) || 0;
      const amountToDebit = parseFloat(amount);

      if (currentBalance < amountToDebit) {
        throw new ApiError("Insufficient balance", 400);
      }

      const currentSent = parseFloat(wallet.total_sent) || 0;

      wallet.balance = currentBalance - amountToDebit;
      wallet.total_sent = currentSent + amountToDebit;
      wallet.transaction_count += 1;

      await wallet.save({ transaction: t });

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: type || TRANSACTION_TYPES.DEBIT,
          status: TRANSACTION_STATUS.COMPLETED,
          from_user_id: userId,
          from_wallet_id: wallet.id,
          amount,
          token_type,
          description: metadata.description || "Wallet debit",
          metadata,
        },
        { transaction: t }
      );

      return { wallet, transaction: tx };
    });
  },

  async transfer({
    fromUserId,
    toUserEmail,
    amount,
    token_type,
    metadata = {},
  }) {
    if (!fromUserId || !toUserEmail)
      throw new ApiError("Sender and recipient required", 400);
    if (amount <= 0) throw new ApiError("Invalid transfer amount", 400);

    const recipient = await User.findOne({ where: { email: toUserEmail } });
    if (!recipient) throw new ApiError("Recipient not found", 404);
    if (recipient.id === fromUserId)
      throw new ApiError("Cannot send to self", 400);

    const feePercent = (PLATFORM_FEES.P2P_TRANSFER || 0.5) / 100;
    const transferAmount = parseFloat(amount);
    const fee = transferAmount * feePercent;
    const totalDebit = transferAmount + fee;

    return sequelize.transaction(async (t) => {
      const senderWallet = await Wallet.findOne({
        where: { user_id: fromUserId, token_type },
        transaction: t,
      });

      if (!senderWallet) {
        throw new ApiError("Sender wallet not found", 404);
      }

      const senderBalance = parseFloat(senderWallet.balance) || 0;

      if (senderBalance < totalDebit) {
        throw new ApiError("Insufficient funds", 400);
      }

      if (senderWallet.is_frozen) {
        throw new ApiError("Sender wallet is frozen", 403);
      }

      const receiverWallet = await this.getOrCreateWallet(
        recipient.id,
        token_type,
        t
      );

      // Update sender wallet
      const senderSent = parseFloat(senderWallet.total_sent) || 0;
      senderWallet.balance = senderBalance - totalDebit;
      senderWallet.total_sent = senderSent + totalDebit;
      senderWallet.transaction_count += 1;

      // Update receiver wallet
      const receiverBalance = parseFloat(receiverWallet.balance) || 0;
      const receiverReceived = parseFloat(receiverWallet.total_received) || 0;
      receiverWallet.balance = receiverBalance + transferAmount;
      receiverWallet.total_received = receiverReceived + transferAmount;
      receiverWallet.transaction_count += 1;

      await senderWallet.save({ transaction: t });
      await receiverWallet.save({ transaction: t });

      // Collect platform fee to platform wallet
      let feeWalletId = null;
      if (fee > 0) {
        const platformService = require("./platformService");
        const feeWallet = await platformService.collectFee({
          tokenType: token_type,
          feeAmount: fee,
          transactionType: "transfer",
          dbTransaction: t,
        });
        if (feeWallet) feeWalletId = feeWallet.id;
      }

      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.TRANSFER,
          status: TRANSACTION_STATUS.COMPLETED,
          amount: transferAmount,
          fee,
          token_type,
          from_user_id: fromUserId,
          to_user_id: recipient.id,
          from_wallet_id: senderWallet.id,
          to_wallet_id: receiverWallet.id,
          fee_wallet_id: feeWalletId,
          description: metadata.description || `Transfer to ${recipient.email}`,
          metadata,
        },
        { transaction: t }
      );

      return {
        success: true,
        transaction: tx,
        senderBalance: senderWallet.balance,
        receiverBalance: receiverWallet.balance,
      };
    });
  },

  async swap({ userId, fromToken, toToken, amount }) {
    if (!userId || !fromToken || !toToken) {
      throw new ApiError("User ID, from token, and to token required", 400);
    }
    if (amount <= 0) throw new ApiError("Invalid swap amount", 400);
    if (fromToken === toToken) {
      throw new ApiError("Cannot swap same token type", 400);
    }

    const { getExchangeRate } = require("../config/constants");
    const exchangeRate = getExchangeRate(fromToken, toToken);
    const swapAmount = parseFloat(amount);
    const swapFeePercent = (PLATFORM_FEES.TOKEN_SWAP || 1.5) / 100;
    const swapFee = swapAmount * swapFeePercent;
    const netSwapAmount = swapAmount - swapFee;
    const receiveAmount = netSwapAmount * exchangeRate;

    return sequelize.transaction(async (t) => {
      // Get or create both wallets
      const fromWallet = await this.getOrCreateWallet(userId, fromToken, t);
      const toWallet = await this.getOrCreateWallet(userId, toToken, t);

      // Check balance (full amount including fee)
      const fromBalance = parseFloat(fromWallet.balance) || 0;
      if (fromBalance < swapAmount) {
        throw new ApiError("Insufficient balance for swap", 400);
      }

      if (fromWallet.is_frozen) {
        throw new ApiError("Wallet is frozen", 403);
      }

      // Update from wallet (debit full amount)
      const fromSent = parseFloat(fromWallet.total_sent) || 0;
      fromWallet.balance = fromBalance - swapAmount;
      fromWallet.total_sent = fromSent + swapAmount;
      fromWallet.transaction_count += 1;

      // Collect platform swap fee to platform wallet (in source token)
      let feeWalletId = null;
      if (swapFee > 0) {
        const platformService = require("./platformService");
        const feeWallet = await platformService.collectFee({
          tokenType: fromToken,
          feeAmount: swapFee,
          transactionType: "swap",
          dbTransaction: t,
        });
        if (feeWallet) feeWalletId = feeWallet.id;
      }

      // Update to wallet (credit received amount after fee)
      const toBalance = parseFloat(toWallet.balance) || 0;
      const toReceived = parseFloat(toWallet.total_received) || 0;
      toWallet.balance = toBalance + receiveAmount;
      toWallet.total_received = toReceived + receiveAmount;
      toWallet.transaction_count += 1;

      await fromWallet.save({ transaction: t });
      await toWallet.save({ transaction: t });

      // Create transaction record
      const tx = await Transaction.create(
        {
          reference: generateTransactionReference(),
          type: TRANSACTION_TYPES.SWAP,
          status: TRANSACTION_STATUS.COMPLETED,
          amount: swapAmount,
          fee: swapFee,
          token_type: fromToken,
          from_user_id: userId,
          to_user_id: userId,
          from_wallet_id: fromWallet.id,
          to_wallet_id: toWallet.id,
          fee_wallet_id: feeWalletId,
          description: `Swapped ${swapAmount} ${fromToken} to ${receiveAmount.toFixed(2)} ${toToken}`,
          metadata: {
            from_token: fromToken,
            to_token: toToken,
            exchange_rate: exchangeRate,
            received_amount: receiveAmount,
            swap_fee: swapFee,
          },
        },
        { transaction: t }
      );

      return {
        success: true,
        transaction: tx,
        fromBalance: fromWallet.balance,
        toBalance: toWallet.balance,
        exchangeRate,
        receivedAmount: receiveAmount,
        fee: swapFee,
      };
    });
  },
};

module.exports = walletService;
