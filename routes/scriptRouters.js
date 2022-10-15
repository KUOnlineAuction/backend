const express = require("express");
const scriptController = require("./../controllers/scriptController");

const router = express.Router();

router.route("/").delete(scriptController.deleteAllUser);

router
  .route("/changeEndDate/:auction_id")
  .patch(scriptController.changeEndDate);

router
  .route("/changeBillingInfo/:auction_id")
  .patch(scriptController.changeBillingInfo);

router
  .route("/")
  .delete(scriptController.deleteAllUser)
  .get(scriptController.getUser);

router.route("/badge").get(scriptController.getBadge);

router.route("/user").get(scriptController.getAllUser);

module.exports = router;
