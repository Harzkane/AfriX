// src/services/notificationService.js
const admin = require("firebase-admin");
const { User } = require("../models");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

async function sendPush(userIds, title, message, data = {}) {
  if (!Array.isArray(userIds)) userIds = [userIds];
  if (userIds.length === 0) return;

  const users = await User.findAll({
    where: { id: userIds },
    attributes: ["id", "fcm_token"],
  });

  const tokens = users.map((u) => u.fcm_token).filter((t) => t && t.trim());

  if (tokens.length === 0) {
    console.log("No FCM tokens for users:", userIds);
    return;
  }

  const payload = {
    notification: { title, body: message },
    data: Object.keys(data).length ? data : undefined,
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(payload);
    console.log(
      `Push: ${response.successCount} success, ${response.failureCount} failed`
    );
  } catch (error) {
    console.error("FCM Error:", error.message);
  }
}

module.exports = { sendPush };
