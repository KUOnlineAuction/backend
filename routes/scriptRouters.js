const express = require('express');
const scriptController = require('./../controllers/scriptController');


const router = express.Router();


router.route('/')
    .delete(scriptController.deleteAllUser)


module.exports = router;
