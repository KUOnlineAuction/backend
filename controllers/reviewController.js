const jwt = require("jsonwebtoken");

const User = require("./../models/userModel");
const Auction = require("./../models/auctionModel");
const Review = require("./../models/reviewModel");

const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

const badge = require("./../utils/badge");

exports.createReview = catchAsync(async (req, res, next) => {
  const auctionID = await Auction.findById(req.params.auction_id);

  if (!auctionID) return next(new AppError("Auction not found", 404));

  // console.log(auctionID.currentWinnerID);
  const checkAuctionID = Auction.findById(req.params.auction_id);
  if (!checkAuctionID)
    return next(new AppError("This Auction is never occur", 400));

  const review = await Review.create({
    reviewerID: auctionID.currentWinnerID,
    auctioneerID: auctionID.auctioneerID,
    rating: req.body.rating,
    comment: req.body.comment,
    productName: auctionID.productDetail.productName,
  });

  const user = await User.findById(auctionID.auctioneerID);
  // 0) Auction never occur
  user.reviewList.push(review._id);
  user.rating = req.body.rating / user.totalAuctioned + user.rating;

  // 1) check winner bidder and reviever is the same
  // if (!(req.User._id === auctionID.currentWinnerID)) return next(new AppError('Biider and Reviewer are not the same one'));

  // 2) review auction has only one
  // badge.gernerateBadge();
  user.save();

  res.status(201).json({
    status: "success",
  });
});
