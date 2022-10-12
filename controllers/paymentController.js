const Auction = require("./../models/auctionModel");
const User = require("./../models/userModel");
const BidHistory = require("./../models/bidHistoryModel");
const { BillingInfo } = require("./../models/billingInfoModel");

const mongoose = require("mongoose");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const { verify } = require("crypto");
const { getPicture, savePicture } = require("./../utils/getPicture");

exports.getPayment = catchAsync(async (req, res, next) => {
  const auction_id = req.params.auction_id;
  const billingInfo = await BillingInfo.findOne({ auctionID: auction_id });
  const auction = await Auction.findById(auction_id);
  //Check if it is your auction
  console.log(String(req.user._id) == String(auction.auctioneerID));
  console.log(auction.auctioneerID);
  console.log(req.user._id);
  console.log();
  if (
    !(
      String(auction.currentWinnerID) == String(req.user._id) &&
      billingInfo.billingInfoStatus == "waitingForPayment"
    ) &&
    !(
      String(auction.auctioneerID) == String(req.user._id) &&
      billingInfo.billingInfoStatus == "waitingForShipping"
    )
  ) {
    return next(new AppError("Invalid auctionID", 404));
  }
  if (auction.auctionStatus === "waitingForPayment")
    return next(new AppError("Auction is already paid or not ended", 404));
  if (!auction) return next(new AppError("Auction not found"), 404);
  const auctioneer = await User.findById(auction.auctioneerID);
  if (!auctioneer) return next(new AppError("Auctioneer not found"), 404);
  const picture = await getPicture("productPicture", `${auction_id}-0.jpeg`);
  res.status(200).json({
    status: "success",
    data: {
      productName: auction.productDetail.productName,
      winningPrice: billingInfo.winningPrice,
      auctioneerName: auctioneer.displayName,
      productPicture: picture,
    },
  });
});

exports.postPayment = catchAsync(async (req, res, next) => {
  let billingInfo = await BillingInfo.findOne({
    auctionID: req.params.auction_id,
  });
  if (!billingInfo) {
    return next(new AppError("BillingInfo not found"));
  }
  const pictureName = `${billingInfo._id}.jpeg`;

  savePicture(
    req.body.slipPicture,
    "slipPicture",
    pictureName,
    null,
    null,
    null,
    true
  );

  const slip = {
    slipPicture: pictureName,
    slipDateTime: new Date(req.body.transferDate * 1),
    slipAmount: req.body.value,
  };

  const billingBankAccount = {
    bankNO: req.body.bankAccountNO,
    bankName: req.body.bankName,
    auctioneerName: req.body.bankAccountName,
  };

  billingInfo.slip = slip;
  billingInfo.bidderPhoneNumber = req.body.phoneNumber;
  billingInfo.receiverName = req.body.bidderName;
  billingInfo.billingInfoStatus = "waitingConfirmSlip";
  billingInfo.address = req.body.bidderAddress;

  billingInfo.save();

  res.status(201).json({
    status: "success",
  });
});

exports.createBillingInfo = catchAsync(async (req, res, next) => {
  const auction_id = req.params.auction_id;
  const auction = await Auction.findById(auction_id);
  const billingInfo = await BillingInfo.create({
    auctionID: auction_id,
    winningPrice: auction.currentPrice,
  });

  res.status(201).json({
    status: "success",
  });
});
