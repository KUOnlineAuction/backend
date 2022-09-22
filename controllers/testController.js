const jwt = require('jsonwebtoken');

const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const Auction = require('./../models/auctionModel');
const Review = require('./../models/reviewModel');
const User = require('./../models/userModel');

exports.createReview = catchAsync(async (req, res, next) => {

    const auctionID = Auction.findById(req.params);

    const review = await Review.create({
        reviewerID: auctionID.currentWinnerID,
        auctioneerID: auctionID.auctioneerID,
        rating: req.body.rating,
        comment: req.body.comment,
        productName: auctionID.productDetail.productName
    });
});


exports.signUp = catchAsync(async (req, res, next) => {
    const test1 = await User.create({

    });
});