const express = require("express");
const authController = require("./../controllers/authController");
const reportController = require("./../controllers/reportController");

const router = express.Router();

//Router

router.post("/", authController.protect, reportController.postReport);

module.exports = router;
