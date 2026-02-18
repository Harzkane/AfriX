/**
 * Modern HTML email templates for AfriX (Resend).
 * Used by emailService.js when RESEND_API_KEY is set.
 */

const APP_NAME = "AfriX";
const BRAND_COLOR = "#00B14F";
const BRAND_DARK = "#008F40";

function baseWrap(htmlContent) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${APP_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased; }
    .root { max-width: 560px; margin: 0 auto; padding: 32px 20px; }
    .card { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06); }
    .card-head { background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .card-head h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .card-body { padding: 32px 24px; color: #374151; font-size: 15px; line-height: 1.6; }
    .card-body p { margin: 0 0 16px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_DARK} 100%); color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 600; font-size: 15px; margin: 8px 0 24px 0; box-shadow: 0 4px 14px rgba(0, 177, 79, 0.35); }
    .btn:hover { opacity: 0.95; }
    .muted { color: #6b7280; font-size: 13px; margin-top: 8px; }
    .code-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; font-family: 'SF Mono', Monaco, monospace; font-size: 13px; word-break: break-all; color: #111827; margin: 12px 0; }
    .notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 20px 0; font-size: 14px; color: #92400e; }
    .notice strong { color: #78350f; }
    .footer { text-align: center; padding: 24px 16px; color: #9ca3af; font-size: 12px; }
    .footer a { color: #6b7280; text-decoration: none; }
  </style>
</head>
<body>
  <div class="root">
    <div class="card">
      ${htmlContent}
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Peer-to-peer token exchange.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Verification email (signup / resend)
 */
function verificationEmail(name, verificationUrl, token) {
  const content = `
    <div class="card-head">
      <h1>Verify your email</h1>
    </div>
    <div class="card-body">
      <p>Hi ${name},</p>
      <p>Thanks for signing up. Tap the button below to verify your email and get started.</p>
      <p style="text-align: center;">
        <a href="${verificationUrl}" class="btn">Verify email</a>
      </p>
      <p class="muted">Or open this link in your browser:</p>
      <div class="code-box">${verificationUrl}</div>
      <p class="muted">Or use this code in the app: <strong>${token}</strong></p>
      <div class="notice">
        <strong>Note:</strong> This link and code expire in 24 hours. If you didn't create an account, you can ignore this email.
      </div>
    </div>`;
  return baseWrap(content);
}

/**
 * Password reset email
 */
function passwordResetEmail(name, resetUrl) {
  const content = `
    <div class="card-head">
      <h1>Reset your password</h1>
    </div>
    <div class="card-body">
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Tap the button below to choose a new password.</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset password</a>
      </p>
      <p class="muted">Or copy this link into your browser:</p>
      <div class="code-box">${resetUrl}</div>
      <div class="notice">
        <strong>Security:</strong> This link expires in 1 hour. If you didn't request a reset, ignore this email and your password will stay the same.
      </div>
    </div>`;
  return baseWrap(content);
}

/**
 * Transaction receipt email
 */
function transactionReceiptEmail(name, transaction) {
  const date = transaction.created_at
    ? new Date(transaction.created_at).toLocaleString()
    : new Date().toLocaleString();
  const content = `
    <div class="card-head">
      <h1>Transaction receipt</h1>
    </div>
    <div class="card-body">
      <p>Hi ${name},</p>
      <p>Your transfer completed successfully.</p>
      <table style="width:100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 10px 0; color: #6b7280;">Transaction ID</td><td style="padding: 10px 0; text-align: right; font-weight: 500;">${transaction.id || "—"}</td></tr>
        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 10px 0; color: #6b7280;">Type</td><td style="padding: 10px 0; text-align: right;">${transaction.type || "—"}</td></tr>
        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 10px 0; color: #6b7280;">Amount</td><td style="padding: 10px 0; text-align: right; font-weight: 600;">${transaction.amount || "—"} ${transaction.token_type || ""}</td></tr>
        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 10px 0; color: #6b7280;">Fee</td><td style="padding: 10px 0; text-align: right;">${transaction.fee ?? "—"} ${transaction.token_type || ""}</td></tr>
        <tr style="border-bottom: 1px solid #e5e7eb;"><td style="padding: 10px 0; color: #6b7280;">Date</td><td style="padding: 10px 0; text-align: right;">${date}</td></tr>
        <tr><td style="padding: 10px 0; color: #6b7280;">Status</td><td style="padding: 10px 0; text-align: right; color: #059669; font-weight: 600;">Completed</td></tr>
      </table>
      <p class="muted">You can view this in your app under Activity.</p>
    </div>`;
  return baseWrap(content);
}

module.exports = {
  verificationEmail,
  passwordResetEmail,
  transactionReceiptEmail,
};
