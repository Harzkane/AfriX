// cd /Users/harz/Documents/backUps/izmir/AfriExchange/afriX_backend
// npm run pilot:path-a

require("dotenv").config();

const crypto = require("crypto");
const express = require("express");
const axios = require("axios");

const { sequelize, User, Wallet, Merchant, Transaction } = require("../models");
const { ensureWebhookSecret } = require("../services/merchantWebhookService");
const {
  MERCHANT_STATUS,
  MERCHANT_TYPES,
  TOKEN_TYPES,
  USER_ROLES,
  TRANSACTION_STATUS,
} = require("../config/constants");

const API_BASE_URL =
  process.env.PATH_A_PILOT_API_URL || process.env.API_BASE_URL || "http://localhost:5001/api/v1";
const WEBHOOK_PORT = Number(process.env.PATH_A_PILOT_WEBHOOK_PORT || 9998);
const EXTERNAL_WEBHOOK_URL = process.env.PATH_A_PILOT_WEBHOOK_URL || "";
const REMOTE_MODE =
  process.env.PATH_A_PILOT_REMOTE_MODE === "true" ||
  /^https?:\/\/(?!localhost\b)(?!127\.0\.0\.1\b)/i.test(API_BASE_URL);
const REMOTE_MERCHANT_API_KEY = process.env.PATH_A_PILOT_MERCHANT_API_KEY || "";
const REMOTE_MERCHANT_ID = process.env.PATH_A_PILOT_MERCHANT_ID || "";
const MERCHANT_EMAIL =
  process.env.PATH_A_PILOT_MERCHANT_EMAIL || "path_a_pilot_merchant@example.com";
const MERCHANT_PASSWORD =
  process.env.PATH_A_PILOT_MERCHANT_PASSWORD || "PathA-Merchant-Password-123!";
const PAYER_EMAIL =
  process.env.PATH_A_PILOT_PAYER_EMAIL || "path_a_pilot_buyer@example.com";
const PAYER_PASSWORD =
  process.env.PATH_A_PILOT_PAYER_PASSWORD || "PathA-Buyer-Password-123!";
const TOKEN_TYPE = TOKEN_TYPES.CT;
const PAYMENT_AMOUNT = Number(process.env.PATH_A_PILOT_AMOUNT || 150);
const HEALTH_TIMEOUT_MS = Number(process.env.PATH_A_PILOT_HEALTH_TIMEOUT_MS || 20000);
const HEALTH_RETRIES = Number(process.env.PATH_A_PILOT_HEALTH_RETRIES || 3);

const makeWalletAddress = () => `0x${crypto.randomBytes(20).toString("hex")}`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildPhoneNumber = (email) => {
  const digits = crypto
    .createHash("sha256")
    .update(email)
    .digest("hex")
    .replace(/\D/g, "")
    .slice(0, 9)
    .padEnd(9, "0");

  return `+221${digits}`;
};

const webhookEvents = [];

const app = express();
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

app.post("/webhooks/afriexchange", (req, res) => {
  webhookEvents.push({
    headers: req.headers,
    body: req.body,
    rawBody: req.rawBody,
    receivedAt: new Date().toISOString(),
  });

  res.status(200).json({ ok: true });
});

async function ensureUser({
  email,
  password,
  fullName,
  role,
  countryCode = "SN",
}) {
  const phoneNumber = buildPhoneNumber(email);
  let user = await User.findOne({ where: { email } });

  if (!user) {
    user = await User.create({
      email,
      password_hash: password,
      full_name: fullName,
      phone_number: phoneNumber,
      country_code: countryCode,
      role,
      email_verified: true,
      phone_verified: true,
      identity_verified: true,
      verification_level: 3,
      is_active: true,
    });
  } else {
    user.role = role;
    user.email_verified = true;
    user.phone_verified = true;
    user.identity_verified = true;
    user.verification_level = Math.max(user.verification_level || 0, 3);
    user.is_active = true;
    user.phone_number = phoneNumber;
    user.password_hash = password;
    await user.save();
  }

  return user;
}

async function ensureWallet(userId, tokenType, balance = 0) {
  let wallet = await Wallet.findOne({
    where: { user_id: userId, token_type: tokenType },
  });

  if (!wallet) {
    wallet = await Wallet.create({
      user_id: userId,
      token_type: tokenType,
      blockchain_address: makeWalletAddress(),
      encrypted_private_key: crypto.randomBytes(64).toString("hex"),
      balance,
      pending_balance: 0,
      is_active: true,
      is_frozen: false,
    });
  } else if (Number(wallet.balance) < balance) {
    wallet.balance = balance;
    wallet.is_active = true;
    wallet.is_frozen = false;
    await wallet.save();
  }

  return wallet;
}

async function ensureMerchant(user, settlementWallet) {
  let merchant = await Merchant.findOne({ where: { user_id: user.id } });

  if (!merchant) {
    merchant = await Merchant.create({
      user_id: user.id,
      business_name: "Path A Pilot Store",
      display_name: "Path A Pilot Store",
      business_type: MERCHANT_TYPES.ECOMMERCE,
      description: "Path A pilot merchant used to verify external ecommerce production readiness.",
      business_email: user.email,
      business_phone: "+221000000000",
      country: "SN",
      city: "Dakar",
      address: "Path A pilot merchant profile",
      settlement_wallet_id: settlementWallet.id,
      default_token_type: TOKEN_TYPE,
      verification_status: MERCHANT_STATUS.APPROVED,
    });
  } else {
    merchant.settlement_wallet_id = settlementWallet.id;
    merchant.default_token_type = TOKEN_TYPE;
    merchant.verification_status = MERCHANT_STATUS.APPROVED;
    merchant.business_email = merchant.business_email || user.email;
    merchant.business_phone = merchant.business_phone || "+221000000000";
    await merchant.save();
  }

  if (!merchant.api_key) {
    await merchant.generateApiKey();
    await merchant.reload();
  }

  return merchant;
}

async function loginUser(email, password) {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  const accessToken = response.data?.data?.tokens?.access_token;

  if (!accessToken) {
    throw new Error(`Failed to log in ${email}: access token missing`);
  }

  return accessToken;
}

async function assertApiHealthy() {
  const healthUrl = API_BASE_URL.replace(/\/api\/v\d+$/, "") + "/health";
  let lastError;

  for (let attempt = 1; attempt <= HEALTH_RETRIES; attempt += 1) {
    try {
      await axios.get(healthUrl, { timeout: HEALTH_TIMEOUT_MS });
      return;
    } catch (error) {
      lastError = error;
      if (attempt < HEALTH_RETRIES) {
        console.log(
          `Health check attempt ${attempt}/${HEALTH_RETRIES} failed, retrying in 2s...`
        );
        await wait(2000);
      }
    }
  }

  throw lastError;
}

async function getMerchantProfile(headers) {
  const response = await axios.get(`${API_BASE_URL}/merchants/profile`, { headers });
  return response.data?.data;
}

async function updateMerchantProfile(headers, payload) {
  const response = await axios.put(`${API_BASE_URL}/merchants/profile`, payload, { headers });
  return response.data?.data;
}

async function getMerchantTransaction(headers, transactionId) {
  const response = await axios.get(`${API_BASE_URL}/merchants/transactions/${transactionId}`, {
    headers,
  });
  return response.data?.data;
}

async function getWebhookDeliveryLog(headers) {
  const response = await axios.get(`${API_BASE_URL}/merchants/webhook-delivery-log`, { headers });
  return response.data?.data?.log || [];
}

async function runRemoteMode() {
  let currentStep = "boot";
  let originalWebhookUrl = null;
  let merchantHeaders = null;
  let merchant = null;

  try {
    currentStep = "api_health";
    console.log(`Checking API health at ${API_BASE_URL} ...`);
    await assertApiHealthy();

    if (!REMOTE_MERCHANT_API_KEY.trim()) {
      throw new Error(
        "Remote mode requires PATH_A_PILOT_MERCHANT_API_KEY for an existing deployed merchant."
      );
    }

    if (!EXTERNAL_WEBHOOK_URL.trim()) {
      throw new Error(
        "Remote mode requires PATH_A_PILOT_WEBHOOK_URL because the deployed backend cannot call localhost."
      );
    }

    console.log("Running Path A pilot in remote API mode");

    merchantHeaders = {
      Authorization: `Bearer ${REMOTE_MERCHANT_API_KEY}`,
      "Content-Type": "application/json",
    };

    currentStep = "merchant_profile_api_key_auth";
    merchant = await getMerchantProfile(merchantHeaders);
    if (!merchant?.id) {
      throw new Error("Merchant API key auth failed: merchant profile response missing id");
    }
    if (REMOTE_MERCHANT_ID && merchant.id !== REMOTE_MERCHANT_ID) {
      throw new Error(
        `Merchant API key resolved merchant ${merchant.id}, expected ${REMOTE_MERCHANT_ID}`
      );
    }
    console.log(`Merchant API key auth OK (${merchant.id})`);

    currentStep = "prepare_webhook";
    originalWebhookUrl = merchant.webhook_url || null;
    await updateMerchantProfile(merchantHeaders, {
      webhook_url: EXTERNAL_WEBHOOK_URL.trim(),
    });
    console.log(`Using external webhook URL: ${EXTERNAL_WEBHOOK_URL.trim()}`);

    currentStep = "payer_login";
    const payerAccessToken = await loginUser(PAYER_EMAIL, PAYER_PASSWORD);
    console.log("Payer login OK");

    const reference = `PATHA-${Date.now()}`;
    currentStep = "payment_request_create";
    const paymentRequestRes = await axios.post(
      `${API_BASE_URL}/merchants/payment-request`,
      {
        amount: PAYMENT_AMOUNT,
        token_type: TOKEN_TYPE,
        description: "Path A pilot order",
        customer_email: PAYER_EMAIL,
        reference,
      },
      { headers: merchantHeaders }
    );

    const requestTransactionId = paymentRequestRes.data?.data?.transaction_id;
    if (!requestTransactionId) {
      throw new Error("Payment request did not return a transaction id");
    }
    console.log(`Payment request created: ${requestTransactionId}`);

    currentStep = "payment_request_api_check";
    const pendingRequest = await getMerchantTransaction(merchantHeaders, requestTransactionId);
    if (!pendingRequest || pendingRequest.status !== TRANSACTION_STATUS.PENDING) {
      throw new Error("Payment request was not returned as a pending merchant collection");
    }

    const payerHeaders = {
      Authorization: `Bearer ${payerAccessToken}`,
      "Content-Type": "application/json",
    };

    currentStep = "payment_process";
    const processRes = await axios.post(
      `${API_BASE_URL}/payments/process`,
      {
        merchant_id: merchant.id,
        transaction_id: requestTransactionId,
        amount: PAYMENT_AMOUNT,
        token_type: TOKEN_TYPE,
        description: "Path A pilot order",
      },
      { headers: payerHeaders }
    );

    const completedTransactionId = processRes.data?.data?.transaction_id;
    if (completedTransactionId !== requestTransactionId) {
      throw new Error(
        `Expected payment processing to complete the original request (${requestTransactionId}), got ${completedTransactionId}`
      );
    }
    console.log(`Payment processed against original request: ${completedTransactionId}`);

    currentStep = "post_payment_wait";
    await wait(1500);

    currentStep = "post_payment_api_checks";
    const completedTransaction = await getMerchantTransaction(merchantHeaders, requestTransactionId);
    if (!completedTransaction || completedTransaction.status !== TRANSACTION_STATUS.COMPLETED) {
      throw new Error("Payment request was not marked completed after payment processing");
    }

    if (completedTransaction.reference !== reference) {
      throw new Error("Completed transaction reference does not match the original merchant reference");
    }

    currentStep = "webhook_log_check";
    const webhookLog = await getWebhookDeliveryLog(merchantHeaders);
    if (!webhookLog.length) {
      throw new Error("Merchant webhook delivery log was not updated");
    }

    const matchingWebhook = webhookLog.find(
      (entry) => entry.reference === reference || entry.event === "collection.completed"
    );
    if (!matchingWebhook) {
      throw new Error("No collection.completed webhook log entry was found for the pilot transaction");
    }

    console.log("");
    console.log("Path A pilot PASSED");
    console.log(`- mode: remote`);
    console.log(`- merchant_id: ${merchant.id}`);
    console.log(`- merchant_api_key_auth: ok`);
    console.log(`- payment_request_id: ${requestTransactionId}`);
    console.log(`- reference: ${reference}`);
    console.log(`- final_status: ${completedTransaction.status}`);
    console.log(`- webhook_events_received: external receiver - check destination`);
    console.log(`- last_webhook_status: ${matchingWebhook.status || "unknown"}`);
  } catch (error) {
    console.error("");
    console.error("Path A pilot FAILED");
    console.error(`step: ${currentStep}`);
    if (
      currentStep === "payer_login" &&
      error.response?.status === 401 &&
      PAYER_EMAIL === "path_a_pilot_buyer@example.com"
    ) {
      console.error(
        "The deployed backend does not know the default local pilot buyer. Set PATH_A_PILOT_PAYER_EMAIL and PATH_A_PILOT_PAYER_PASSWORD to a real deployed user."
      );
    }
    if (error.response) {
      console.error(`status: ${error.response.status}`);
      console.error(`response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message || error);
    }
    process.exitCode = 1;
  } finally {
    try {
      if (merchantHeaders && originalWebhookUrl) {
        await updateMerchantProfile(merchantHeaders, { webhook_url: originalWebhookUrl });
      }
    } catch (_) {
      // Best-effort cleanup only.
    }
  }
}

async function runLocalMode() {
  let server;
  let originalWebhookUrl = null;
  let currentStep = "boot";

  try {
    currentStep = "database_connect";
    console.log("Connecting to database...");
    await sequelize.authenticate();

    currentStep = "api_health";
    console.log(`Checking API health at ${API_BASE_URL} ...`);
    await assertApiHealthy();

    currentStep = "ensure_users";
    const merchantUser = await ensureUser({
      email: MERCHANT_EMAIL,
      password: MERCHANT_PASSWORD,
      fullName: "Path A Pilot Merchant",
      role: USER_ROLES.MERCHANT,
    });
    const payerUser = await ensureUser({
      email: PAYER_EMAIL,
      password: PAYER_PASSWORD,
      fullName: "Path A Pilot Buyer",
      role: USER_ROLES.USER,
    });

    currentStep = "ensure_wallets";
    const merchantWallet = await ensureWallet(merchantUser.id, TOKEN_TYPE, 0);
    const payerWallet = await ensureWallet(
      payerUser.id,
      TOKEN_TYPE,
      Math.max(PAYMENT_AMOUNT * 5, 1000)
    );

    currentStep = "ensure_merchant";
    const merchant = await ensureMerchant(merchantUser, merchantWallet);

    currentStep = "prepare_webhook";
    originalWebhookUrl = merchant.webhook_url;

    const webhookUrl =
      EXTERNAL_WEBHOOK_URL.trim() || `http://127.0.0.1:${WEBHOOK_PORT}/webhooks/afriexchange`;
    merchant.webhook_url = webhookUrl;
    await ensureWebhookSecret(merchant);
    await merchant.save();

    if (!EXTERNAL_WEBHOOK_URL.trim()) {
      currentStep = "start_webhook_server";
      server = app.listen(WEBHOOK_PORT);
      console.log(`Mock merchant webhook server listening on ${webhookUrl}`);
    } else {
      console.log(`Using external webhook URL: ${webhookUrl}`);
    }

    currentStep = "payer_login";
    const payerAccessToken = await loginUser(PAYER_EMAIL, PAYER_PASSWORD);
    console.log("Payer login OK");

    const merchantHeaders = {
      Authorization: `Bearer ${merchant.api_key}`,
      "Content-Type": "application/json",
    };

    currentStep = "merchant_profile_api_key_auth";
    const merchantProfile = await getMerchantProfile(merchantHeaders);
    if (merchantProfile?.id !== merchant.id) {
      throw new Error("Merchant API key auth failed to resolve the expected merchant profile");
    }
    console.log("Merchant API key auth OK");

    const reference = `PATHA-${Date.now()}`;
    currentStep = "payment_request_create";
    const paymentRequestRes = await axios.post(
      `${API_BASE_URL}/merchants/payment-request`,
      {
        amount: PAYMENT_AMOUNT,
        token_type: TOKEN_TYPE,
        description: "Path A pilot order",
        customer_email: PAYER_EMAIL,
        reference,
      },
      { headers: merchantHeaders }
    );

    const requestTransactionId = paymentRequestRes.data?.data?.transaction_id;
    if (!requestTransactionId) {
      throw new Error("Payment request did not return a transaction id");
    }
    console.log(`Payment request created: ${requestTransactionId}`);

    currentStep = "payment_request_db_check";
    const pendingRequest = await Transaction.findByPk(requestTransactionId);
    if (!pendingRequest || pendingRequest.status !== TRANSACTION_STATUS.PENDING) {
      throw new Error("Payment request was not stored as a pending merchant collection");
    }

    const payerHeaders = {
      Authorization: `Bearer ${payerAccessToken}`,
      "Content-Type": "application/json",
    };

    currentStep = "payment_process";
    const processRes = await axios.post(
      `${API_BASE_URL}/payments/process`,
      {
        merchant_id: merchant.id,
        transaction_id: requestTransactionId,
        amount: PAYMENT_AMOUNT,
        token_type: TOKEN_TYPE,
        description: "Path A pilot order",
      },
      { headers: payerHeaders }
    );

    const completedTransactionId = processRes.data?.data?.transaction_id;
    if (completedTransactionId !== requestTransactionId) {
      throw new Error(
        `Expected payment processing to complete the original request (${requestTransactionId}), got ${completedTransactionId}`
      );
    }
    console.log(`Payment processed against original request: ${completedTransactionId}`);

    currentStep = "post_payment_wait";
    await wait(1500);

    currentStep = "post_payment_db_checks";
    const completedTransaction = await Transaction.findByPk(requestTransactionId);
    if (!completedTransaction || completedTransaction.status !== TRANSACTION_STATUS.COMPLETED) {
      throw new Error("Payment request was not marked completed after payment processing");
    }

    if (completedTransaction.reference !== reference) {
      throw new Error("Completed transaction reference does not match the original merchant reference");
    }

    currentStep = "post_payment_wallet_checks";
    const refreshedMerchantWallet = await Wallet.findByPk(merchantWallet.id);
    const refreshedPayerWallet = await Wallet.findByPk(payerWallet.id);
    const refreshedMerchant = await Merchant.findByPk(merchant.id);

    if (!EXTERNAL_WEBHOOK_URL.trim()) {
      if (!webhookEvents.find((event) => event.body?.event === "collection.completed")) {
        throw new Error("No collection.completed webhook was received by the merchant webhook endpoint");
      }
    }

    if (
      !Array.isArray(refreshedMerchant.webhook_delivery_log) ||
      !refreshedMerchant.webhook_delivery_log.length
    ) {
      throw new Error("Merchant webhook delivery log was not updated");
    }

    console.log("");
    console.log("Path A pilot PASSED");
    console.log(`- mode: local`);
    console.log(`- merchant_id: ${merchant.id}`);
    console.log(`- merchant_api_key_auth: ok`);
    console.log(`- payment_request_id: ${requestTransactionId}`);
    console.log(`- reference: ${reference}`);
    console.log(`- final_status: ${completedTransaction.status}`);
    console.log(`- merchant_balance_ct: ${refreshedMerchantWallet.balance}`);
    console.log(`- payer_balance_ct: ${refreshedPayerWallet.balance}`);
    console.log(
      `- webhook_events_received: ${
        EXTERNAL_WEBHOOK_URL.trim() ? "external receiver - check destination" : webhookEvents.length
      }`
    );
    console.log(
      `- last_webhook_status: ${refreshedMerchant.integration_health?.last_webhook_status || "unknown"}`
    );
  } catch (error) {
    console.error("");
    console.error("Path A pilot FAILED");
    console.error(`step: ${currentStep}`);
    if (error.response) {
      console.error(`status: ${error.response.status}`);
      console.error(`response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message || error);
    }
    process.exitCode = 1;
  } finally {
    try {
      const merchantUser = await User.findOne({ where: { email: MERCHANT_EMAIL } }).catch(() => null);
      if (merchantUser) {
        const merchant = await Merchant.findOne({ where: { user_id: merchantUser.id } }).catch(() => null);
        if (merchant) {
          merchant.webhook_url = originalWebhookUrl;
          await merchant.save();
        }
      }
    } catch (_) {
      // Best-effort cleanup only.
    }

    if (server) {
      server.close();
    }

    try {
      await sequelize.close();
    } catch (_) {
      // Ignore close failures.
    }
  }
}

async function run() {
  if (REMOTE_MODE) {
    await runRemoteMode();
    return;
  }

  await runLocalMode();
}

run();
