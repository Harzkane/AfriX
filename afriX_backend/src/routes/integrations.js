const express = require("express");
const router = express.Router();
const kaalisIntegrationController = require("../controllers/kaalisIntegrationController");
const renthubIntegrationController = require("../controllers/renthubIntegrationController");

// ── Kaalis routes ──────────────────────────────────────────────────────────────
router.use(
  "/kaalis",
  kaalisIntegrationController.authenticateKaalis
);

router.post("/kaalis/verify-account", kaalisIntegrationController.verifyAccount);
router.post(
  "/kaalis/link-verification/request",
  kaalisIntegrationController.requestLinkVerification
);
router.post(
  "/kaalis/link-verification/confirm",
  kaalisIntegrationController.confirmLinkVerification
);
router.post("/kaalis/payouts", kaalisIntegrationController.createPayout);
router.get("/kaalis/payouts/:id", kaalisIntegrationController.getPayout);
router.post("/kaalis/collections", kaalisIntegrationController.createCollection);

// ── RentHub routes ─────────────────────────────────────────────────────────────
router.use(
  "/renthub",
  renthubIntegrationController.authenticateRentHub
);

router.post("/renthub/collections", renthubIntegrationController.createCollection);
router.post("/renthub/payouts", renthubIntegrationController.createPayout);
router.get("/renthub/payouts/:id", renthubIntegrationController.getPayout);
router.get("/renthub/rates", renthubIntegrationController.getRates);

module.exports = router;
