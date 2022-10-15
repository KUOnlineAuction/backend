const express = require("express");
const scriptController = require("./../controllers/scriptController");

const router = express.Router();

router.route("/").delete(scriptController.deleteAllUser);

<<<<<<< HEAD
router
  .route("/changeEndDate/:auction_id")
  .patch(scriptController.changeEndDate);
=======
router.route('/')
    .delete(scriptController.deleteAllUser)
	.get(scriptController.getUser)

router.route('/badge')
	.get(scriptController.getBadge)

router.route('/user')
	.get(scriptController.getAllUser)
>>>>>>> 5d97155b763e501523becab8f2885ae80dc0ca20

module.exports = router;
