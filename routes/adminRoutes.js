const express = require('express')
const adminController = require('./../controllers/adminController')
const authController = require('./../controllers/authController')

const router = express.Router();

router.use(authController.protect, authController.restrictTo('admin'))

// Blacklist related route
router.get('/blacklist', adminController.getBlacklist) // done
router.patch('/blacklist/add', adminController.AddBlacklistedUser) // done
router.patch('/blacklist/remove', adminController.removeBlacklistedUser) // done

// Report related route
router.get('/reports', adminController.getReports) // done

// Transaction Related Route
router.get('/transaction/:billingInfoID', adminController.getTransacDetail) // done
router.get('/transaction-list', adminController.getTransacList) // done
router.post('/transaction/confirm/:auction_id', adminController.confirmTransac) // done

// Refund Related Route
router.get('/refundlist', adminController.getRefundList) // done
router.get('/refund/:refundID', adminController.getRefundDetail) // not done
router.post('/refund/:refundID', adminController.confirmRefund) // not done

// Refund test
router.post('/testrefund', adminController.testCreateRefund) // not done

module.exports = router