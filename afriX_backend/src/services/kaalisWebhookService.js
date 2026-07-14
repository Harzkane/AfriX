/**
 * kaalisWebhookService.js
 *
 * Emits AfriExchange → Kaalis webhook events for buyer-side collection events
 * (collection.completed, collection.reversed, collection.failed, etc.).
 *
 * Uses the same HMAC-SHA256 signature scheme as the existing emitKaalisWebhook
 * function in kaalisIntegrationController so the Kaalis-store webhook handler
 * can verify authenticity.
 *
 * Environment variables expected:
 *   KAALIS_AFRIEXCHANGE_WEBHOOK_URL    — the Kaalis-store webhook endpoint
 *   KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET — shared HMAC secret (must match
 *                                        AFRIEXCHANGE_WEBHOOK_SECRET in
 *                                        kaalis-store/backend/.env)
 */

const crypto = require("crypto");
const axios  = require("axios");

/**
 * Emit a collection-related webhook event to the Kaalis-store backend.
 *
 * @param {{ event: string, data: Record<string,unknown> }} payload
 */
async function emitKaalisCollectionWebhook(payload) {
  const webhookUrl    = process.env.KAALIS_AFRIEXCHANGE_WEBHOOK_URL;
  const webhookSecret = process.env.KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET;

  if (!webhookUrl || !webhookSecret) {
    console.warn(
      "[kaalisWebhookService] KAALIS_AFRIEXCHANGE_WEBHOOK_URL or " +
      "KAALIS_AFRIEXCHANGE_WEBHOOK_SECRET is not set — collection webhook skipped."
    );
    return;
  }

  const timestamp = new Date().toISOString();
  const rawBody   = JSON.stringify(payload);

  const signature = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const response = await axios.post(webhookUrl, rawBody, {
    headers: {
      "content-type":               "application/json",
      "x-afriexchange-timestamp":   timestamp,
      "x-afriexchange-signature":   `sha256=${signature}`,
    },
    timeout: 8000,
  });

  return response;
}

module.exports = { emitKaalisCollectionWebhook };
