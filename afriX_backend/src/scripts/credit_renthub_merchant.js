// Credit RentHub merchant with test NT tokens
// Usage: node src/scripts/credit_renthub_merchant.js [amount]

require("dotenv").config();

const crypto = require("crypto");
const { sequelize, User, Wallet, Merchant, Transaction } = require("../models");
const {
  TOKEN_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
} = require("../config/constants");

const CREDIT_AMOUNT = parseFloat(process.argv[2] || "50000000"); // 50,000,000 NT default

async function creditRentHubMerchant() {
  try {
    console.log("Connecting to AfriExchange database...");
    await sequelize.authenticate();
    console.log("Database connected successfully.\n");

    // 1. Find RentHub merchant
    const merchantId =
      process.env.RENTHUB_AFRIEXCHANGE_MERCHANT_ID ||
      "e1fb66f3-fef1-4129-9e8d-4d166be6c357";

    let merchant = await Merchant.findByPk(merchantId);
    if (!merchant) {
      merchant = await Merchant.findOne({
        where: { business_name: "RentHub" },
      });
    }

    if (!merchant) {
      console.error("❌ RentHub merchant not found!");
      process.exit(1);
    }

    console.log(`✅ Found Merchant: ${merchant.business_name} (${merchant.id})`);
    console.log(`   Owner User ID: ${merchant.user_id}`);
    console.log(`   Settlement Wallet ID: ${merchant.settlement_wallet_id}`);

    // 2. Find NT Wallet
    let wallet = null;
    if (merchant.settlement_wallet_id) {
      wallet = await Wallet.findByPk(merchant.settlement_wallet_id);
    }

    if (!wallet || wallet.token_type !== TOKEN_TYPES.NT) {
      wallet = await Wallet.findOne({
        where: {
          user_id: merchant.user_id,
          token_type: TOKEN_TYPES.NT,
        },
      });
    }

    if (!wallet) {
      console.error("❌ NT Wallet for RentHub merchant not found!");
      process.exit(1);
    }

    const previousBalance = parseFloat(wallet.balance) || 0;
    const newBalance = previousBalance + CREDIT_AMOUNT;

    console.log(`\n💼 Wallet Details (${wallet.id}):`);
    console.log(`   Token Type: ${wallet.token_type}`);
    console.log(`   Address:    ${wallet.blockchain_address}`);
    console.log(`   Current Balance:  ${previousBalance.toLocaleString()} ${wallet.token_type}`);
    console.log(`   Credit Amount:   +${CREDIT_AMOUNT.toLocaleString()} ${wallet.token_type}`);
    console.log(`   Expected Balance: ${newBalance.toLocaleString()} ${wallet.token_type}\n`);

    // 3. Update Wallet Balance
    wallet.balance = newBalance;
    await wallet.save();

    // 4. Record Transaction Ledger Entry
    const reference = `TRX-CREDIT-RENTHUB-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const tx = await Transaction.create({
      reference,
      type: TRANSACTION_TYPES.CREDIT || "credit",
      status: TRANSACTION_STATUS.COMPLETED || "completed",
      amount: CREDIT_AMOUNT,
      fee: 0,
      token_type: TOKEN_TYPES.NT,
      to_user_id: merchant.user_id,
      to_wallet_id: wallet.id,
      merchant_id: merchant.id,
      description: `Manual test funding of ${CREDIT_AMOUNT.toLocaleString()} NT for RentHub Escrow Settlement`,
      metadata: {
        reason: "RentHub Escrow Test Balance Credit",
        credited_at: new Date().toISOString(),
        previous_balance: previousBalance,
        new_balance: newBalance,
      },
    });

    console.log("============================================================");
    console.log("🎉 RentHub Merchant Credited Successfully!");
    console.log("============================================================");
    console.log(`  Merchant:     ${merchant.business_name} (${merchant.id})`);
    console.log(`  Wallet ID:    ${wallet.id}`);
    console.log(`  Token:        ${wallet.token_type}`);
    console.log(`  Old Balance:  ${previousBalance.toLocaleString()} ${wallet.token_type}`);
    console.log(`  New Balance:  ${newBalance.toLocaleString()} ${wallet.token_type}`);
    console.log(`  Reference:    ${tx.reference}`);
    console.log(`  Tx ID:        ${tx.id}`);
    console.log("============================================================\n");

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to credit RentHub merchant:", error);
    process.exit(1);
  }
}

creditRentHubMerchant();
