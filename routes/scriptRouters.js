const express = require('express');
const scriptController = require('./../controllers/scriptController');


const router = express.Router();


router.route('/')
    .delete(scriptController.deleteAllUser)
	.get(scriptController.getUser)

router.route('/badge')
	.get(scriptController.getBadge)

router.route('/user')
	.get(scriptController.getAllUser)

module.exports = router;
