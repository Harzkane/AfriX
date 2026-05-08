const express = require("express");
const router = express.Router();
const kaalisIntegrationController = require("../controllers/kaalisIntegrationController");

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

module.exports = router;
