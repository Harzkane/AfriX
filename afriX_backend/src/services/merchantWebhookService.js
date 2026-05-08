// File: src/services/merchantWebhookService.js
//
// Path A merchant webhook dispatcher.
// Signs and delivers event payloads to merchant-configured webhook URLs,
// using the same HMAC-SHA256 contract as the Kaalis webhook dispatcher so
// merchants can use a single verification pattern regardless of path.
//
// Signature format:
//   x-afriexchange-timestamp: <ISO timestamp>
//   x-afriexchange-signature: sha256=<hmac-sha256(secret, `${timestamp}.${rawBody}`)>

const crypto = require("crypto");
const axios = require("axios");
const { Merchant } = require("../models");

/**
 * Record the outcome of a webhook delivery attempt on the merchant's
 * integration_health field. Mirrors the Kaalis recordKaalisWebhookHealth
 * pattern so both paths write identical health shapes.
 */
const recordMerchantWebhookHealth = async (merchantId, { status, event, reference = "", httpStatus = null, error = "", webhookUrl = "", payload = null }) => {
  try {
    const logEntry = {
      attempted_at: new Date().toISOString(),
      event: event || "",
      reference: reference || "",
      status: status || "",
      http_status: httpStatus,
      error: error || "",
      webhook_url: webhookUrl || "",
      payload: payload,
    };

    // Fetch current log to prepend the new entry (cap at 50)
    const merchant = await Merchant.findByPk(merchantId, {
      attributes: ["webhook_delivery_log"],
    });
    const existing = Array.isArray(merchant?.webhook_delivery_log)
      ? merchant.webhook_delivery_log
      : [];
    const updatedLog = [logEntry, ...existing].slice(0, 50);

    await Merchant.update(
      {
        integration_health: {
          last_webhook_attempt_at: logEntry.attempted_at,
          last_webhook_event: logEntry.event,
          last_webhook_reference: logEntry.reference,
          last_webhook_status: logEntry.status,
          last_webhook_http_status: logEntry.http_status,
          last_webhook_error: logEntry.error,
        },
        webhook_delivery_log: updatedLog,
      },
      { where: { id: merchantId } }
    );
  } catch (updateError) {
    console.error(`[MerchantWebhook] Failed to record health for merchant ${merchantId}:`, updateError.message);
  }
};

/**
 * Ensure a merchant has a webhook secret. Generates and persists one if missing.
 * Called lazily so existing merchants get a secret the first time a webhook fires.
 */
const ensureWebhookSecret = async (merchant) => {
  if (merchant.webhook_secret) return merchant.webhook_secret;
  const secret = crypto.randomBytes(32).toString("hex");
  await Merchant.update({ webhook_secret: secret }, { where: { id: merchant.id } });
  merchant.webhook_secret = secret; // update in-memory reference
  return secret;
};

/**
 * Emit a signed webhook to a Path A merchant's configured URL.
 *
 * @param {string} merchantId - The merchant's DB id
 * @param {object} payload    - The event payload, e.g. { event, eventId, data }
 *
 * Payload shape (mirrors Kaalis pattern):
 *   {
 *     event: "collection.completed",
 *     eventId: "afrix-collection-<txId>",
 *     data: { ... }
 *   }
 *
 * This function is fire-and-forget safe — it catches all errors internally
 * and records them to integration_health so the merchant can diagnose from
 * the portal. It never throws.
 */
const emitMerchantWebhook = async (merchantId, payload) => {
  let merchant;
  try {
    merchant = await Merchant.findByPk(merchantId);
  } catch (err) {
    console.error(`[MerchantWebhook] Could not load merchant ${merchantId}:`, err.message);
    return;
  }

  if (!merchant) {
    console.warn(`[MerchantWebhook] Merchant ${merchantId} not found — skipping webhook.`);
    return;
  }

  const webhookUrl = merchant.webhook_url?.trim();
  if (!webhookUrl) {
    // Merchant has not configured a webhook URL — silently skip.
    return;
  }

  let secret;
  try {
    secret = await ensureWebhookSecret(merchant);
  } catch (err) {
    console.error(`[MerchantWebhook] Could not ensure webhook secret for ${merchantId}:`, err.message);
    return;
  }

  const timestamp = new Date().toISOString();
  const rawBody = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    const response = await axios.post(webhookUrl, rawBody, {
      headers: {
        "content-type": "application/json",
        "x-afriexchange-timestamp": timestamp,
        "x-afriexchange-signature": `sha256=${signature}`,
      },
      timeout: 8000,
    });

    await recordMerchantWebhookHealth(merchantId, {
      status: "delivered",
      event: payload?.event,
      reference: payload?.eventId || payload?.data?.reference || "",
      httpStatus: response.status,
      webhookUrl,
      payload,
    });

    return {
      delivered: true,
      httpStatus: response.status,
      timestamp,
      signature: `sha256=${signature}`,
      webhookUrl,
    };
  } catch (error) {
    await recordMerchantWebhookHealth(merchantId, {
      status: "failed",
      event: payload?.event,
      reference: payload?.eventId || payload?.data?.reference || "",
      httpStatus: error.response?.status || null,
      error: error.message,
      webhookUrl,
      payload,
    });
    console.error(`[MerchantWebhook] Delivery failed for merchant ${merchantId} (${webhookUrl}):`, error.message);

    return {
      delivered: false,
      httpStatus: error.response?.status || null,
      error: error.message,
      timestamp,
      signature: `sha256=${signature}`,
      webhookUrl,
    };
  }
};

module.exports = { emitMerchantWebhook, ensureWebhookSecret };
