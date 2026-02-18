// File: src/routes/notifications.js
const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);

// Inbox
router.get("/", notificationController.list);
router.post("/read-all", notificationController.markAllRead);
router.post("/:id/read", notificationController.markRead);

// Preferences (granular)
router.get("/settings", notificationController.getSettings);
router.put("/settings", notificationController.updateSettings);

module.exports = router;
