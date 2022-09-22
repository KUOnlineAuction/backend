const express = require("express");
const paymentController = require("./../controllers/paymentController");
const authController = require("./../controllers/authController");

const router = express.Router();

router
  .get("/:auction_id", authController.protect, paymentController.getPayment)
  .post("/:auction_id", authController.protect, paymentController.postPayment);

router.post(
  "/createBillingInfo/:auction_id",
  paymentController.createBillingInfo
);

module.exports = router;
