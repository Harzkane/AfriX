// File: src/controllers/notificationController.js
const { Notification, User, UserNotificationSettings } = require("../models");
const { getOrCreateSettings } = require("../services/notificationService");
const { ApiError } = require("../utils/errors");

/**
 * List notifications for current user (paginated, optional unread only).
 */
async function list(req, res, next) {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const unreadOnly = req.query.unreadOnly === "true";

    const where = { user_id: userId };
    if (unreadOnly) where.is_read = false;

    const { count, rows } = await Notification.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      offset: (page - 1) * limit,
      limit,
      attributes: ["id", "type", "title", "message", "data", "is_read", "read_at", "created_at"],
    });

    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false },
    });

    res.json({
      success: true,
      data: rows,
      unreadCount,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark one notification as read.
 */
async function markRead(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      where: { id, user_id: userId },
    });
    if (!notification) throw new ApiError("Notification not found", 404);

    await notification.update({ is_read: true, read_at: new Date() });

    res.json({
      success: true,
      data: {
        id: notification.id,
        is_read: true,
        read_at: notification.read_at,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read for current user.
 */
async function markAllRead(req, res, next) {
  try {
    const userId = req.user.id;

    const [markedCount] = await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: userId, is_read: false } }
    );

    res.json({
      success: true,
      message: "All notifications marked as read",
      markedCount: markedCount || 0,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get notification settings (master switches from user + granular from user_notification_settings).
 */
async function getSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ["push_notifications_enabled", "email_notifications_enabled"],
    });
    if (!user) throw new ApiError("User not found", 404);

    const settings = await getOrCreateSettings(userId);

    res.json({
      success: true,
      data: {
        push: {
          enabled: !!user.push_notifications_enabled,
          transactions: !!settings.push_transactions,
          requests: !!settings.push_requests,
          agentUpdates: !!settings.push_agent_updates,
          security: !!settings.push_security,
          marketing: !!settings.push_marketing,
        },
        email: {
          enabled: !!user.email_notifications_enabled,
          transactionReceipts: !!settings.email_transaction_receipts,
          agentUpdates: !!settings.email_agent_updates,
          security: !!settings.email_security,
          marketing: !!settings.email_marketing,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update notification settings (master + granular).
 */
async function updateSettings(req, res, next) {
  try {
    const userId = req.user.id;
    const body = req.body || {};

    const user = await User.findByPk(userId);
    if (!user) throw new ApiError("User not found", 404);

    if (body.push && typeof body.push === "object") {
      if (typeof body.push.enabled === "boolean") user.push_notifications_enabled = body.push.enabled;
    }
    if (body.email && typeof body.email === "object") {
      if (typeof body.email.enabled === "boolean") user.email_notifications_enabled = body.email.enabled;
    }
    await user.save();

    const settings = await getOrCreateSettings(userId);
    const push = body.push || {};
    const email = body.email || {};

    await settings.update({
      push_transactions: typeof push.transactions === "boolean" ? push.transactions : settings.push_transactions,
      push_requests: typeof push.requests === "boolean" ? push.requests : settings.push_requests,
      push_agent_updates: typeof push.agentUpdates === "boolean" ? push.agentUpdates : settings.push_agent_updates,
      push_security: typeof push.security === "boolean" ? push.security : settings.push_security,
      push_marketing: typeof push.marketing === "boolean" ? push.marketing : settings.push_marketing,
      email_transaction_receipts: typeof email.transactionReceipts === "boolean" ? email.transactionReceipts : settings.email_transaction_receipts,
      email_agent_updates: typeof email.agentUpdates === "boolean" ? email.agentUpdates : settings.email_agent_updates,
      email_security: typeof email.security === "boolean" ? email.security : settings.email_security,
      email_marketing: typeof email.marketing === "boolean" ? email.marketing : settings.email_marketing,
    });

    const updatedUser = await User.findByPk(userId, { attributes: ["push_notifications_enabled", "email_notifications_enabled"] });
    const updatedSettings = await UserNotificationSettings.findOne({ where: { user_id: userId } });

    res.json({
      success: true,
      data: {
        push: {
          enabled: !!updatedUser.push_notifications_enabled,
          transactions: !!updatedSettings.push_transactions,
          requests: !!updatedSettings.push_requests,
          agentUpdates: !!updatedSettings.push_agent_updates,
          security: !!updatedSettings.push_security,
          marketing: !!updatedSettings.push_marketing,
        },
        email: {
          enabled: !!updatedUser.email_notifications_enabled,
          transactionReceipts: !!updatedSettings.email_transaction_receipts,
          agentUpdates: !!updatedSettings.email_agent_updates,
          security: !!updatedSettings.email_security,
          marketing: !!updatedSettings.email_marketing,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  list,
  markRead,
  markAllRead,
  getSettings,
  updateSettings,
};
