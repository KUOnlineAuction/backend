const jwt = require('jsonwebtoken');

const User = require('./../models/userModel');
const Auction = require('./../models/auctionModel');
const Review = require('./../models/reviewModel');

const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

exports.createReview = catchAsync(async (req, res, next) => {

	const auctionID = await Auction.findById(req.params.auction_id);

	// console.log(auctionID.currentWinnerID);

	const review = await Review.create({
		reviewerID: auctionID.currentWinnerID,
		auctioneerID: auctionID.auctioneerID,
		rating: req.body.rating,
		comment: req.body.comment,
		productName: auctionID.productDetail.productName
	});

	// 0) Auction never occur
	const checkAuctionID = Auction.findById(req.params.auction_id);
	if (!checkAuctionID) return next(new AppError("This Auction is never occur"));

	// 1) check winner bidder and reviever is the same 
	// if (!(req.User._id === auctionID.currentWinnerID)) return next(new AppError('Biider and Reviewer are not the same one'));

	// 2) review auction has only one 

	res.status(201).json({
		status: 'success',
	});
});
