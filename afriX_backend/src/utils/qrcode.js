// File: src/utils/qrcode.js
const QRCode = require("qrcode");

/**
 * Generate QR code as data URL
 * @param {string} data - Data to encode
 * @returns {Promise<string>} QR code data URL
 */
const generateQR = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      width: 300,
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
};

module.exports = { generateQR };
