// File: afriX_backend/src/services/emailService.js
// Sends email via Resend (preferred) or nodemailer fallback.

const {
  verificationEmail,
  passwordResetEmail,
  transactionReceiptEmail,
} = require("./emailTemplates");

const USE_RESEND = !!process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM || "AfriX <support@exonec.com>";

let resendClient;
if (USE_RESEND) {
  try {
    resendClient = new (require("resend").Resend)(process.env.RESEND_API_KEY);
  } catch (e) {
    console.warn("Resend package not installed. Run: npm install resend");
    resendClient = null;
  }
}

// Nodemailer fallback (used when Resend not configured or not installed)
const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendVerificationEmail(email, name, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || "https://app.afrix.com"}/verify-email?token=${token}`;
  const subject = "Verify your email – AfriX";
  const html = verificationEmail(name, verificationUrl, token);
  const text = `Hi ${name},\n\nVerify your email: ${verificationUrl}\n\nOr use this code in the app: ${token}\n\nThis expires in 24 hours.\n\nAfriX`;

  if (resendClient) {
    const { error } = await resendClient.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("Resend verification email error:", error);
      throw error;
    }
    console.log(`Verification email sent to ${email} (Resend)`);
    return true;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "AfriX <noreply@afrix.com>",
    to: email,
    subject,
    html,
    text,
  });
  console.log(`Verification email sent to ${email} (nodemailer)`);
  return true;
}

async function sendPasswordResetEmail(email, name, token) {
  const resetUrl = `${process.env.FRONTEND_URL || "https://app.afrix.com"}/reset-password?token=${token}`;
  const subject = "Reset your password – AfriX";
  const html = passwordResetEmail(name, resetUrl);
  const text = `Hi ${name},\n\nReset your password: ${resetUrl}\n\nThis link expires in 1 hour.\n\nAfriX`;

  if (resendClient) {
    const { error } = await resendClient.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("Resend password reset email error:", error);
      throw error;
    }
    console.log(`Password reset email sent to ${email} (Resend)`);
    return true;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "AfriX <noreply@afrix.com>",
    to: email,
    subject,
    html,
    text,
  });
  console.log(`Password reset email sent to ${email} (nodemailer)`);
  return true;
}

async function sendTransactionReceipt(email, name, transaction) {
  const subject = `Receipt – ${transaction.id || "Transaction"} – AfriX`;
  const html = transactionReceiptEmail(name, transaction);
  const text = `Hi ${name},\n\nYour transfer completed.\nAmount: ${transaction.amount} ${transaction.token_type}\nDate: ${new Date(transaction.created_at).toLocaleString()}\n\nAfriX`;

  if (resendClient) {
    const { error } = await resendClient.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
      text,
    });
    if (error) {
      console.error("Resend receipt email error:", error);
      throw error;
    }
    console.log(`Transaction receipt sent to ${email} (Resend)`);
    return true;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "AfriX <noreply@afrix.com>",
    to: email,
    subject,
    html,
    text,
  });
  console.log(`Transaction receipt sent to ${email} (nodemailer)`);
  return true;
}

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTransactionReceipt,
};
