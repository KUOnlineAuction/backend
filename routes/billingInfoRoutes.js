const express = require("express");
const billingInfoController = require("./../controllers/billingInfoController");

const router = express.Router();

router.get(
  "/:auction_id",
  authController.protect,
  billingInfoController.getBillingInfo
);

module.exports = router;
