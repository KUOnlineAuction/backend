const catchAsync = require("./../utils/catchAsync");
const Auction = require("./../models/auctionModel");
const { BillingInfo } = require("./../models/billingInfoModel");
const User = require("./../models/userModel");

const AppError = require("./../utils/appError");

const billingInfoStatusEnum = [
  "waitingForPayment",
  "waitingConfirmSlip",
  "waitingForShipping",
  "waitingForConfirm",
  "waitingAdminPayment",
  "completed",
];

exports.changeEndDate = catchAsync(async (req, res, next) => {
  if (req.query.option === "five_minute") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 5 * 60 * 1000 + 20 * 1000,
    });
  } else if (req.query.option == "ended") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 10 * 1000,
    });
  } else if (req.query.option === "hour") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 65 * 60 * 1000,
    });
  } else if (req.query.option === "day") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    });
  } else {
    return next(new AppError("Required query params"));
  }

  res.status(204).json({
    status: "success",
  });
});

exports.changeBillingInfo = catchAsync(async (req, res, next) => {
  const auction = await Auction.findById(req.params.auction_id);
  if (req.query.state === "waitingForPayment") {
    if (auction.auctionStatus === "waiting")
      return next(AppError("Auction already ended"));

    const billingInfo = await BillingInfo.create({
      auctionID: auction._id,
      winningPrice: auction.currentPrice,
    });
    auction.endDate = Date.now();
    auction.auctionStatus = "waiting";
    auction.billingHistoryID = billingInfo._id;
  }
  auction.save();
  res.status(204).json({
    status: "success",
  });
});

