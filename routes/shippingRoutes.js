const express = require("express");

const shippingController = require('./../controllers/shippingController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.post('/:auction_id/shipping', authController.protect, shippingController.createDelivery);
// router.get('/:auction_id/tracking', authController.protect, shippingController.getTrackingstatus);
router.post('/:auction_id', authController.protect, shippingController.confirmDelivery);

module.exports = router;