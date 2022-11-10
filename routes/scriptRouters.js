const express = require("express");
const scriptController = require("./../controllers/scriptController");

const router = express.Router();


router.route("/changeEndDate/:auction_id").get(scriptController.changeEndDate);

router
  .route("/changeBillingInfo/:auction_id")
  .get(scriptController.changeBillingInfo);


module.exports = router;
