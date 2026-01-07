// File: /Users/harz/AfriExchange/afriX_backend/src/services/emailService.js

const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Verification token
 */
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "AfriToken <noreply@afritoken.com>",
    to: email,
    subject: "Verify Your Email - AfriToken",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #16A34A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .token-box { background: #e5e7eb; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .note { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to AfriToken!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for creating your AfriToken profile. Please verify your email address to start exchanging tokens.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </div>

            <p>Or copy and paste this link in your browser:</p>
            <p class="token-box">${verificationUrl}</p>

            <p>Or use this verification token directly:</p>
            <p class="token-box">${token}</p>

            <div class="note">
              <strong>Important:</strong> NT and CT are digital tokens on our platform, not actual Naira or CFA Francs. They're blockchain-based digital assets.
            </div>
            
            <p>This verification link and token will expire in 24 hours.</p>
            <p>If you didn't create this profile, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 AfriToken. All rights reserved.</p>
            <p>AfriToken is a peer-to-peer token exchange platform.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${name},

      Thank you for creating your AfriToken profile. Please verify your email address by visiting:
      ${verificationUrl}

      Or use this verification token directly:
      ${token}

      Important: NT and CT are digital tokens on our platform, not actual currency. They help you transfer value easily using blockchain technology.

      This link and token will expire in 24 hours.

      If you didn't create this profile, please ignore this email.

      AfriToken Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} token - Reset token
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || "AfriToken <noreply@afritoken.com>",
    to: email,
    subject: "Reset Your Password - AfriToken",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #16A34A; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            
            <div class="warning">
              <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Hi ${name},
      
      We received a request to reset your password. Visit this link to create a new password:
      ${resetUrl}
      
      This link will expire in 1 hour.
      
      If you didn't request this, please ignore this email.
      
      AfriToken Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

/**
 * Send transaction receipt email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {object} transaction - Transaction details
 */
const sendTransactionReceipt = async (email, name, transaction) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || "AfriToken <noreply@afritoken.com>",
    to: email,
    subject: `Token Transfer Receipt - ${transaction.id}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #16A34A; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .receipt { background: white; padding: 20px; border: 1px solid #ddd; margin: 20px 0; }
          .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Transaction Receipt</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your token transfer was completed successfully.</p>
            <div class="receipt">
              <div class="row">
                <span class="label">Transaction ID:</span>
                <span>${transaction.id}</span>
              </div>
              <div class="row">
                <span class="label">Type:</span>
                <span>${transaction.type}</span>
              </div>
              <div class="row">
                <span class="label">Amount:</span>
                <span>${transaction.amount} ${transaction.token_type}</span>
              </div>
              <div class="row">
                <span class="label">Fee:</span>
                <span>${transaction.fee} ${transaction.token_type}</span>
              </div>
              <div class="row">
                <span class="label">Date:</span>
                <span>${new Date(
                  transaction.created_at
                ).toLocaleString()}</span>
              </div>
              <div class="row">
                <span class="label">Status:</span>
                <span style="color: #16A34A;">Completed</span>
              </div>
            </div>
            <p>You can view this transaction in your profile history.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Transaction receipt sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending transaction receipt:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTransactionReceipt,
};
