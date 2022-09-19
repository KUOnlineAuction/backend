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
  if (!auction) return next(new AppError("Auction not found"));
  res.status(200).json({
    status: "success",
    data: {
      productName: auction.productDetail.productName,
      winningPrice: billingInfo.winningPrice,
    },
  });
});

exports.postPayment = catchAsync(async (req, res, next) => {
  const billingInfo = await BillingInfo.findOne({
    auctionID: req.params.auction_id,
  });
  const pictureName = `${billingInfo._id}.jpeg`;

  savePicture = (req.params.slipPicture, "slipPicture", pictureName);
  const slip = {
    slipPicture: pictureName,
    slipDateTime: req.body.transferDate,
    slipAmount: req.body.value,
  };
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
