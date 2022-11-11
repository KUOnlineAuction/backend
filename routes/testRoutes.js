const { Router } = require('express')
const express = require('express')
const testController = require('../controllers/testController')
const authController = require('../controllers/authController')

const router = express.Router()

//router.route('/auction')
    //.post(testController.postAuction)
    //.get(authController.protect, testController.getAuctions)

//router.route('/badge')
    //.post(testController.postBadge)
    //.get(authController.loggedInOnly, testController.getBadges)

//router.route('/bidHistory')
    //.post(testController.postBidHistory)
    //.get(testController.getBidHistories)

//router.route('/billingInfo')
    //.post(testController.postBillingInfo)
    //.get(testController.getBillingInfo)


// router.route('/notification')
//     .post(testController.)
//     .get(testController.)


//router.route('/report')
    //.post(testController.postReport)
    //.get(testController.getReports)

//router.route('/review/:id')
    //.post(testController.postReview)
    //.get(testController.getReviews)


//router.route('/user')
    //.post(testController.postUser)
    //.get(testController.getUsers)


router.route('/showBadge').get(testController.showBadge);
router.route('/getBadge').get(testController.getBadge);
router.route('/clearBadge').get(testController.clearBadge);
router.route('/topBadge').get(testController.topBadge);
router.route('/getBadgeForAllUser').get(testController.getBadgeForAllUser)
router.route('/testBadge').get(testController.testBadge);
module.exports = router
