const express = require('express');
const scriptController = require('./../controllers/scriptController');


const router = express.Router();


router.route('/')
    .delete(scriptController.deleteAllUser)
	.get(scriptController.getUser)


module.exports = router;
