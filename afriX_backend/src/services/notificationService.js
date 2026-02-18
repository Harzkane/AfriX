// src/services/notificationService.js
const admin = require("firebase-admin");
const { User, Notification, UserNotificationSettings } = require("../models");
const { NOTIFICATION_CATEGORY, NOTIFICATION_EVENT_TYPES } = require("../config/constants");

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } catch (e) {
    console.warn("Firebase init skipped:", e.message);
  }
}

/**
 * Resolve preference category for an event type (transactions, requests, agent_updates, security, marketing).
 */
function getCategoryForType(type) {
  for (const [category, types] of Object.entries(NOTIFICATION_CATEGORY)) {
    if (types.includes(type)) return category;
  }
  return "agent_updates"; // fallback
}

/**
 * Get or create user notification settings (defaults: all on except marketing).
 */
async function getOrCreateSettings(userId) {
  let row = await UserNotificationSettings.findOne({ where: { user_id: userId } });
  if (!row) {
    row = await UserNotificationSettings.create({ user_id: userId });
  }
  return row;
}

const PUSH_CATEGORY_COLUMN = {
  transactions: "push_transactions",
  requests: "push_requests",
  agent_updates: "push_agent_updates",
  security: "push_security",
  marketing: "push_marketing",
};

const EMAIL_CATEGORY_COLUMN = {
  transactions: "email_transaction_receipts",
  requests: "email_agent_updates",
  agent_updates: "email_agent_updates",
  security: "email_security",
  marketing: "email_marketing",
};

function shouldSendPush(user, settings, category) {
  if (!user.push_notifications_enabled) return false;
  if (!user.fcm_token || !String(user.fcm_token).trim()) return false;
  const key = PUSH_CATEGORY_COLUMN[category] || "push_agent_updates";
  return settings[key] !== false;
}

function shouldSendEmail(user, settings, category) {
  if (!user.email_notifications_enabled) return false;
  const key = EMAIL_CATEGORY_COLUMN[category] || "email_agent_updates";
  return settings[key] !== false;
}

/**
 * Internal: send FCM push to one or more user ids (no pref check).
 */
async function sendPush(userIds, title, message, data = {}) {
  if (!admin.apps || !admin.apps.length) return;
  if (!Array.isArray(userIds)) userIds = [userIds];
  if (userIds.length === 0) return;

  const users = await User.findAll({
    where: { id: userIds },
    attributes: ["id", "fcm_token"],
  });

  const tokens = users.map((u) => u.fcm_token).filter((t) => t && String(t).trim());

  if (tokens.length === 0) {
    console.log("No FCM tokens for users:", userIds);
    return;
  }

  const payload = {
    notification: { title, body: message || "" },
    data: typeof data === "object" && data !== null ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(payload);
    console.log(`Push: ${response.successCount} success, ${response.failureCount} failed`);
  } catch (error) {
    console.error("FCM Error:", error.message);
  }
}

/**
 * Create inbox notification and send push/email according to user preferences.
 * @param {string} userId - Recipient user id
 * @param {string} type - NOTIFICATION_EVENT_TYPES value (e.g. TOKENS_MINTED, NEW_MINT_REQUEST)
 * @param {object} options - { title, message?, data?, sendPush?: true, sendEmail?: true }
 * @returns {Promise<Notification>} Created notification
 */
async function deliver(userId, type, options = {}) {
  const { title, message, data = {} } = options;
  const sendPushFlag = options.sendPush !== false;
  const sendEmailFlag = options.sendEmail !== false;

  if (!title) {
    console.warn("notificationService.deliver: title required");
    return null;
  }

  const notification = await Notification.create({
    user_id: userId,
    type,
    title,
    message: message || null,
    data: typeof data === "object" ? data : {},
  });

  const user = await User.findByPk(userId, {
    attributes: ["id", "push_notifications_enabled", "email_notifications_enabled", "fcm_token", "email", "full_name"],
  });
  if (!user) return notification;

  const settings = await getOrCreateSettings(userId);
  const category = getCategoryForType(type);

  if (sendPushFlag && shouldSendPush(user, settings, category)) {
    try {
      await sendPush(userId, title, message || "", data);
      await notification.update({ push_sent_at: new Date() });
    } catch (e) {
      console.error("deliver push failed:", e.message);
    }
  }

  if (sendEmailFlag && shouldSendEmail(user, settings, category)) {
    // Optional: send notification email (template by type). Skip for v1 if no template.
    // await sendNotificationEmail(user, type, { title, message, data });
    // await notification.update({ email_sent_at: new Date() });
  }

  return notification;
}

module.exports = { sendPush, deliver, getCategoryForType, getOrCreateSettings };
