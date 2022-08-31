const AppError = require('../utils/appError');
const Auction = require('./../models/auctionModel')
const Badge = require('./../models/badgeModel');
const Report = require('./../models/reportModel');
const BidHistory = require('./../models/bidHistoryModel')
const {BillingInfo} = require('./../models/billingInfoModel')
const Review = require('./../models/reviewModel');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');

// Auction
exports.postAuction = catchAsync(async(req, res, next) => {
    const newAuction = await Auction.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newAuction
    })
})

exports.getAuctions = catchAsync(async(req, res, next) => {
    const allAuction = await Auction.find()
    res.status(200).json({
        status: 'success',
        results: allAuction.length,
        data: allAuction
    })
})

// Badge
exports.postBadge = catchAsync(async(req, res, next) => {
    const newBadge = await Badge.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newBadge
    })
})

exports.getBadges = catchAsync(async(req, res, next) => {
    const allBadge = await Badge.find()
    res.status(200).json({
        status: 'success',
        results: allBadge.length,
        data: allBadge
    })
})

// BidHistory
exports.postBidHistory = catchAsync(async(req, res, next) => {
    const newBidHistory = await BidHistory.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newBidHistory
    })
})

exports.getBidHistories = catchAsync(async(req, res, next) => {
    const allBidHistory = await BidHistory.find()
    res.status(200).json({
        status: 'success',
        results: allBidHistory.length,
        data: allBidHistory
    })
})

// BillingInfo
exports.postBillingInfo = catchAsync(async(req, res, next) => {
    const newBillingInfo = await BillingInfo.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newBillingInfo
    })
})

exports.getBillingInfo = catchAsync(async(req, res, next) => {
    const allBillingInfo = await BillingInfo.find()
    res.status(200).json({
        status: 'success',
        results: allBillingInfo.length,
        data: allBillingInfo
    })
})

// Report
exports.postReport = catchAsync(async(req, res, next) => {
    const newReport = await Report.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newReport
    })
})

exports.getReports = catchAsync(async(req, res, next) => {
    const allReport = await Report.find()
    res.status(200).json({
        status: 'success',
        results: allReport.length,
        data: allReport
    })
})

// Review
exports.postReview = catchAsync(async(req, res, next) => {
    const newReview = await Review.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newReview
    })
})

exports.getReviews = catchAsync(async(req, res, next) => {
    const allReview = await Review.find()
    res.status(200).json({
        status: 'success',
        results: allReview.length,
        data: allReview
    })
})

// Review
exports.postUser = catchAsync(async(req, res, next) => {
    const newUser = await User.create(req.body)
    res.status(201).json({
        status: 'success',
        data: newUser
    })
})

exports.getUsers = catchAsync(async(req, res, next) => {
    const allUser = await User.find()
    res.status(200).json({
        status: 'success',
        results: allUser.length,
        data: allUser
    })
})