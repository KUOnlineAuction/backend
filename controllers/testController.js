const jwt = require('jsonwebtoken');

const Auction = require('./../models/auctionModel');
const Review = require('./../models/reviewModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

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
