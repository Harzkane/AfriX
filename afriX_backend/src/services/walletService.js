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
const { deliver } = require("./notificationService");
const Money = require("../utils/money");

/**
 * Encrypt a wallet private key using AES-256-GCM (authenticated encryption).
 *
 * Output format: `gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 *
 * The `gcm:` prefix distinguishes new GCM ciphertexts from legacy CBC ones
 * (format: `<iv_hex>:<ciphertext_hex>`) so both can be decrypted transparently
 * without a migration script.
 */
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
    const iv = crypto.randomBytes(12); // 96-bit IV is recommended for GCM
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();
    // Never log the encrypted key — even encrypted values should stay out of logs.
    return `gcm:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Error in encryptPrivateKey:", error.message);
    throw new Error(`Failed to encrypt private key: ${error.message}`);
  }
}

/**
 * Decrypt a wallet private key.
 *
 * Supports two formats:
 *   - GCM (new):  `gcm:<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 *   - CBC (legacy): `<iv_hex>:<ciphertext_hex>`
 */
function decryptPrivateKey(encryptedValue) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not defined in .env");
  }
  const key = Buffer.from(process.env.ENCRYPTION_KEY, "hex");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }

  if (encryptedValue.startsWith("gcm:")) {
    // AES-256-GCM format: gcm:<iv>:<authTag>:<ciphertext>
    const parts = encryptedValue.split(":");
    if (parts.length !== 4) throw new Error("Invalid GCM encrypted key format");
    const [, ivHex, authTagHex, ciphertext] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } else {
    // Legacy AES-256-CBC format: <iv>:<ciphertext>
    const [ivHex, ciphertext] = encryptedValue.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
}

const walletService = {
  async getOrCreateWallet(userId, token_type, t = null, lock = null) {
    if (process.env.NODE_ENV === "development") {
      console.log("getOrCreateWallet called with:", { userId, token_type });
    }
    let wallet = await Wallet.findOne({
      where: { user_id: userId, token_type },
      transaction: t,
      ...(lock && t ? { lock } : {}),
    });
    if (!wallet) {
      const ethWallet = ethers.Wallet.createRandom();
      if (process.env.NODE_ENV === "development") {
        console.log("Generated wallet address:", ethWallet.address);
      }
      // Private key is encrypted before storage — never log it, even encrypted.
      const encryptedPrivateKey = await encryptPrivateKey(ethWallet.privateKey);
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
      if (process.env.NODE_ENV === "development") {
        console.log("Wallet created for user:", userId, "token:", token_type);
      }
    }
    return wallet;
  },

  async credit({ userId, amount, token_type, type, metadata = {} }) {
    if (amount <= 0) throw new ApiError("Invalid amount", 400);

    return sequelize.transaction(async (t) => {
      const wallet = await this.getOrCreateWallet(userId, token_type, t);

      // Update balance using precision Money math
      wallet.balance = Money.add(wallet.balance, amount);
      wallet.total_received = Money.add(wallet.total_received || 0, amount);
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

      if (currentBalance < parseFloat(amount)) {
        throw new ApiError("Insufficient balance", 400);
      }

      wallet.balance = Money.sub(wallet.balance, amount);
      wallet.total_sent = Money.add(wallet.total_sent || 0, amount);
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
    toRecipient,
    amount,
    token_type,
    metadata = {},
  }) {
    const recipientIdentifier = (toRecipient || toUserEmail || "").trim();
    if (!fromUserId || !recipientIdentifier)
      throw new ApiError("Sender and recipient required", 400);
    if (amount <= 0) throw new ApiError("Invalid transfer amount", 400);

    // ENFORCE DAILY AND PER-TRANSACTION LIMITS
    const userService = require("./userService");
    await userService.checkTransactionLimits(fromUserId, amount, token_type);

    let recipient = await User.findOne({ where: { email: recipientIdentifier.toLowerCase() } });
    if (!recipient && recipientIdentifier.toLowerCase().startsWith("0x")) {
      const targetWallet = await Wallet.findOne({
        where: { blockchain_address: recipientIdentifier },
      });
      if (targetWallet) {
        recipient = await User.findByPk(targetWallet.user_id);
      }
    }

    let matchedRequestTransaction = null;
    const reqIdFromMeta = metadata.reference || metadata.request_id || metadata.requestId;
    const searchRef = reqIdFromMeta || (recipientIdentifier.toUpperCase().includes("RQST-") ? recipientIdentifier : null);

    if (searchRef) {
      const { Op } = require("sequelize");
      const reqMatch = searchRef.match(/RQST-[A-Z0-9]+/i);
      const reqId = reqMatch ? reqMatch[0] : searchRef;
      const cleanId = reqId.replace(/^RQST-/i, "");

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      const orConditions = [{ reference: reqId }, { reference: cleanId }];
      if (isUuid) {
        orConditions.push({ id: cleanId });
      }

      matchedRequestTransaction = await Transaction.findOne({
        where: {
          [Op.or]: orConditions,
        },
      });

      if (!matchedRequestTransaction) {
        throw new ApiError("Payment request not found", 404);
      }

      if (matchedRequestTransaction.status !== TRANSACTION_STATUS.PENDING) {
        throw new ApiError("This payment request has already been paid and fulfilled.", 409);
      }

      if (!recipient) {
        const targetUserId = matchedRequestTransaction.to_user_id || matchedRequestTransaction.user_id;
        if (targetUserId) {
          recipient = await User.findByPk(targetUserId);
        }
      }
    }

    if (!recipient) throw new ApiError("Recipient not found. Check the email or wallet address.", 404);
    if (recipient.id === fromUserId)
      throw new ApiError("Cannot send to self", 400);

    const feePercent = (PLATFORM_FEES.P2P_TRANSFER || 0.5) / 100;
    const transferAmount = parseFloat(amount);
    const fee = Money.mul(transferAmount, feePercent);
    const totalDebit = Money.add(transferAmount, fee);

    return sequelize.transaction(async (t) => {
      const senderWallet = await Wallet.findOne({
        where: { user_id: fromUserId, token_type },
        transaction: t,
        lock: t.LOCK.UPDATE,
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
        t,
        t.LOCK.UPDATE
      );

      // Update sender wallet
      const senderSent = parseFloat(senderWallet.total_sent) || 0;
      senderWallet.balance = Money.sub(senderBalance, totalDebit);
      senderWallet.total_sent = Money.add(senderSent, totalDebit);
      senderWallet.transaction_count += 1;

      // Update receiver wallet
      const receiverBalance = parseFloat(receiverWallet.balance) || 0;
      const receiverReceived = parseFloat(receiverWallet.total_received) || 0;
      receiverWallet.balance = Money.add(receiverBalance, transferAmount);
      receiverWallet.total_received = Money.add(receiverReceived, transferAmount);
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

      if (matchedRequestTransaction) {
        matchedRequestTransaction.status = TRANSACTION_STATUS.COMPLETED;
        matchedRequestTransaction.from_user_id = fromUserId;
        await matchedRequestTransaction.save({ transaction: t });
      }

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
    const swapFee = Money.mul(swapAmount, swapFeePercent);
    const netSwapAmount = Money.sub(swapAmount, swapFee);
    const receiveAmount = Money.mul(netSwapAmount, exchangeRate);

    return sequelize.transaction(async (t) => {
      // Get or create both wallets with row locks
      const fromWallet = await this.getOrCreateWallet(userId, fromToken, t, t.LOCK.UPDATE);
      const toWallet = await this.getOrCreateWallet(userId, toToken, t, t.LOCK.UPDATE);

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
      fromWallet.balance = Money.sub(fromBalance, swapAmount);
      fromWallet.total_sent = Money.add(fromSent, swapAmount);
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
      toWallet.balance = Money.add(toBalance, receiveAmount);
      toWallet.total_received = Money.add(toReceived, receiveAmount);
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
    }).then(async (result) => {
      // Notify user of completed swap (fire-and-forget, outside DB tx)
      try {
        await deliver(userId, "SWAP_COMPLETED", {
          title: "Swap Completed",
          message: `Your swap of ${Number(result.transaction.amount).toFixed(2)} ${fromToken} → ${result.receivedAmount.toFixed(2)} ${toToken} was completed successfully.`,
          data: {
            transaction_id: String(result.transaction.id),
            reference: result.transaction.reference,
            from_token: fromToken,
            to_token: toToken,
            received_amount: String(result.receivedAmount.toFixed(2)),
          },
        });
      } catch (e) {
        console.error("SWAP_COMPLETED notify failed:", e.message);
      }
      return result;
    });
  },
};

module.exports = walletService;
