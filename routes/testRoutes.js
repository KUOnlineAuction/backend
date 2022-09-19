const { Router } = require('express')
const express = require('express')
const testController = require('../controllers/testController')
const authController = require('../controllers/authController')

const router = express.Router()

router.route('/auction')
    .post(testController.postAuction)
    .get(authController.protect, testController.getAuctions)

router.route('/badge')
    .post(testController.postBadge)
    .get(authController.loggedInOnly, testController.getBadges)

router.route('/bidHistory')
    .post(testController.postBidHistory)
    .get(testController.getBidHistories)

router.route('/billingInfo')
    .post(testController.postBillingInfo)
    .get(testController.getBillingInfo)


// router.route('/notification')
//     .post(testController.)
//     .get(testController.)


router.route('/report')
    .post(testController.postReport)
    .get(testController.getReports)

router.route('/review/:id')
    .post(testController.postReview)
    .get(testController.getReviews)


router.route('/user')
    .post(testController.postUser)
    .get(testController.getUsers)



module.exports = router