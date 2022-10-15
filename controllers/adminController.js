const mongoose = require("mongoose");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel");
const Report = require("./../models/reportModel");
const { BillingInfo } = require("./../models/billingInfoModel");
const Auction = require("./../models/auctionModel");
const { getPicture } = require("./../utils/getPicture");

const daysToDeliver = 5;

exports.getBlacklist = catchAsync(async (req, res, next) => {
  const blacklistedUsers = await User.aggregate([
    {
      $match: { userStatus: "blacklist" },
    },
    {
      $project: { displayName: 1, userID: "$_id", _id: 0 },
    },
  ]);
  res.status(200).json({
    status: "success",
    blacklistedUsers,
  });
});

exports.AddBlacklistedUser = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(
      new AppError("Please provide an email to add to the blacklist", 400)
    );
  }
  await User.findOneAndUpdate(
    {
      email: req.body.email,
    },
    {
      userStatus: "blacklist",
    }
  );
  res.status(200).json({
    status: "success",
  });
});

exports.removeBlacklistedUser = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return next(
      new AppError("Please provide an email to add to the blacklist", 400)
    );
  }
  const update = await User.findOneAndUpdate(
    {
      email: req.body.email,
      userStatus: "blacklist",
    },
    {
      userStatus: "activate",
    }
  );
  if (!update) {
    return next(
      new AppError(
        "The user's email provided either not exists or the user is not in the blacklist",
        400
      )
    );
  }
  res.status(200).json({
    status: "success",
  });
});

exports.getReports = catchAsync(async (req, res, next) => {
  // Fix format to match
  let reportList = await Report.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "reporterID",
        foreignField: "_id",
        as: "reporterMail",
      },
    },
    {
      $set: { reporterMail: { $arrayElemAt: ["$reporterMail.email", 0] } },
    },
    {
      $lookup: {
        from: "users",
        localField: "reportedID",
        foreignField: "_id",
        as: "reportedMail",
      },
    },
    {
      $set: { reportedMail: { $arrayElemAt: ["$reportedMail.email", 0] } },
    },
    {
      $project: {
        reportedDate: "$reportedTime",
        reporterMail: 1,
        reportedMail: 1,
        description: 1,
      },
    },
  ]);

  for (let el of reportList) {
    el.reportedDate = (el.reportedDate * 1).toString();
  }

  res.status(200).json({
    status: "success",
    reportList,
  });
});

exports.getTransacDetail = catchAsync(async (req, res, next) => {
  if (!req.params.billingInfoID) {
    return next(new AppError("Please include transactionID in the path", 400));
  }
  const billingInfo = await BillingInfo.findById(req.params.billingInfoID);
  if (!billingInfo) {
    return next(new AppError("Invalid transactionID", 400));
  }
  if (!req.query.detail) {
    return next(
      new AppError(
        "Please query with detail = either 'payment' or 'delivery'."
      ),
      400
    );
  }
  let detail;
  if (req.query.detail === "payment") {
    detail = await BillingInfo.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(req.params.billingInfoID) },
      },
      {
        $lookup: {
          from: "auctions",
          localField: "auctionID",
          foreignField: "_id",
          as: "involvedAuction",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "involvedAuction.currentWinnerID",
          foreignField: "_id",
          as: "winner",
        },
      },
      {
        $set: { involvedAuction: { $arrayElemAt: ["$involvedAuction", 0] } },
      },
      {
        $set: {
          transferDataTime: "$slip.slipDateTime",
          transactionSlip: "$slip.slipPicture",
          telephoneNO: "$bidderPhoneNumber"
        },
      },
      {
        $project: {
          receiverName: 1,
          telephoneNO: 1,
          address: 1,
          transferDataTime: 1,
          transactionSlip: 1,
        },
      },
    ]);
    detail = detail[0];
    detail.transferDataTime = (detail.transferDataTime * 1).toString();
    const slipPic = await getPicture(
      "slipPicture",
      detail.transactionSlip,
      null,
      null,
      true
    );
    if (!slipPic) {
      return next(new AppError("Couldn't find the picture"), 500);
    }
    detail.transactionSlip = slipPic;
  } else if (req.query.detail === "delivery") {
    detail = await BillingInfo.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(req.params.billingInfoID) },
      },
      {
        $set: {
          bankName: "$billingBankAccount.bankName",
          AccountNumber: "$billingBankAccount.bankNO",
          AccountName: "$billingBankAccount.auctioneerName",
          trackingNumber: "$deliverInfo.trackingNumber",
          shippingCompany: "$deliverInfo.shippingCompany",
          packagePicture: "$deliverInfo.packagePicture",
        },
      },
      {
        $project: {
          bankName: 1,
          accountNumber: 1,
          accountName: 1,
          trackingNumber: 1,
          shippingCompany: 1,
          packagePicture: 1,
          _id: 0,
        },
      },
    ]);
    detail = detail[0];
    const packagePic = await getPicture(
      "packagePicture",
      detail.packagePicture,
      null,
      null,
      true
    );
    if (!packagePic) {
      return next(new AppError("Couldn't find the picture"), 500);
    }
    detail.packagePicture = packagePic;
  }

  res.status(200).json({
    status: "success",
    detail,
  });
});

exports.getTransacList = catchAsync(async (req, res, next) => {
  if (!req.query.filter) {
    return next(
      new AppError(
        "Please query with filter = either 'confirmSlip' or 'payAuctioneer'.",
        400
      )
    );
  }

  let transactionList;

  if (req.query.filter === "confirmSlip") {
    transactionList = await BillingInfo.aggregate([
      {
        $match: { billingInfoStatus: "waitingConfirmSlip" },
      },
      {
        $lookup: {
          from: "auctions",
          localField: "auctionID",
          foreignField: "_id",
          as: "involvedAuction",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "involvedAuction.currentWinnerID",
          foreignField: "_id",
          as: "winner",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "involvedAuction.auctioneerID",
          foreignField: "_id",
          as: "auctioneer",
        },
      },
      {
        $set: { involvedAuction: { $arrayElemAt: ["$involvedAuction", 0] } },
      },
      {
        $set: {
          bidderEmail: { $arrayElemAt: ["$winner.email", 0] },
          auctioneerEmail: { $arrayElemAt: ["$auctioneer.email", 0] },
        },
      },
      {
        $project: {
          auctionID: 1,
          billingInfoID: "$_id",
          bidderEmail: 1,
          auctioneerEmail: 1,
          winningPrice: 1,
          _id: 0,
        },
      },
    ]);
  } else if (req.query.filter === "payAuctioneer") {
    transactionList = await BillingInfo.aggregate([
      { $match: { billingInfoStatus: "waitingAdminPayment" } },
      {
        $lookup: {
          from: "auctions",
          localField: "auctionID",
          foreignField: "_id",
          as: "involvedAuction",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "involvedAuction.currentWinnerID",
          foreignField: "_id",
          as: "winner",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "involvedAuction.auctioneerID",
          foreignField: "_id",
          as: "auctioneer",
        },
      },
      {
        $set: { involvedAuction: { $arrayElemAt: ["$involvedAuction", 0] } },
      },
      {
        $set: {
          bidderEmail: { $arrayElemAt: ["$winner.email", 0] },
          auctioneerEmail: { $arrayElemAt: ["$auctioneer.email", 0] },
        },
      },
      {
        $project: {
          auctionID: 1,
          billingInfoID: "$_id",
          bidderEmail: 1,
          auctioneerEmail: 1,
          winningPrice: 1,
          _id: 0,
          bidderPhoneNumber: 1,
          address: 1
        },
      },
    ]);
  } else {
    return next(
      new AppError(
        "Please query with filter = either 'confirmSlip' or 'payAuctioneer'.",
        400
      )
    );
  }

  res.status(200).json({
    status: "success",
    transactionList,
  });
});

exports.confirmTransac = catchAsync(async (req, res, next) => {
  if (!req.body.confirm) {
    return next(
      new AppError(
        `Please provide the type of confirmation ("confirm":"slip" or "payment")`,
        400
      )
    );
  }
  let auction;
  if (req.body.confirm === "slip") {
    auction = await Auction.findById(req.params.auction_id);
    if (!auction) {
      return next(new AppError("Invalid auctionID provided", 400));
    }
    let billingInfo = await BillingInfo.findById(auction.billingHistoryID);
    if (!billingInfo) {
      return next(new AppError("Couldn't find the billingInfo", 500));
    }
    if (billingInfo.billingInfoStatus !== "waitingConfirmSlip") {
      return next(
        new AppError(
          "The billing info status doesn't match the current request",
          400
        )
      );
    }
    billingInfo.billingInfoStatus = "waitingForShipping";
    billingInfo.deliverDeadline =
      Date.now() + daysToDeliver * 1000 * 60 * 60 * 24;
    billingInfo.save();
  }
  if (req.body.confirm === "payment") {
    auction = await Auction.findById(req.params.auction_id);
    if (!auction) {
      return next(new AppError("Invalid auctionID provided", 400));
    }
    let billingInfo = await BillingInfo.findById(auction.billingHistoryID);
    if (!billingInfo) {
      return next(new AppError("Couldn't find the billingInfo", 500));
    }
    if (billingInfo.billingInfoStatus !== "waitingAdminPayment") {
      return next(
        new AppError(
          "The billing info status doesn't match the current request",
          400
        )
      );
    }
    let auctioneer = await User.findById(auction.auctioneerID);
    if (!auctioneer) {
      return next(new AppError("Couldn't find the user.", 500));
    }
    auctioneer.successAuctioned = auctioneer.successAuctioned + 1;
    auctioneer.totalAuctioned = auctioneer.totalAuctioned + 1;
    await auctioneer.save({ validateBeforeSave: false });
    billingInfo.billingInfoStatus = "completed";
    await billingInfo.save();
    auction.auctionStatus = "finished";
    await auction.save({ validateBeforeSave: false });
  }
  res.status(200).json({
    status: "success",
  });
});
