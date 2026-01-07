///Users/harz/Documents/backUps/AfriExchange/afriX_backend/src/utils/helpers.js
const crypto = require("crypto");

/**
 * Generate unique, prefixed transaction reference
 * Example: TRX-20251023-8F3A1B9C
 */
function generateTransactionReference(prefix = "TRX") {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${date}-${random}`;
}

/**
 * Format currency amount safely
 */
function formatAmount(value) {
  return parseFloat(parseFloat(value).toFixed(2));
}

module.exports = {
  generateTransactionReference,
  formatAmount,
};
