const express = require("express");
const scriptController = require("./../controllers/scriptController");

const router = express.Router();

router.route("/").delete(scriptController.deleteAllUser);

router
  .route("/changeEndDate/:auction_id")
  .patch(scriptController.changeEndDate);

module.exports = router;
