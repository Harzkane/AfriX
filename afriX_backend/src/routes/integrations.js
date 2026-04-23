const express = require("express");
const router = express.Router();
const kaalisIntegrationController = require("../controllers/kaalisIntegrationController");

router.use(
  "/kaalis",
  kaalisIntegrationController.authenticateKaalis
);

router.post("/kaalis/payouts", kaalisIntegrationController.createPayout);
router.get("/kaalis/payouts/:id", kaalisIntegrationController.getPayout);
router.post("/kaalis/collections", kaalisIntegrationController.createCollection);

module.exports = router;
