const { BillingInfo } = require("./../models/billingInfoModel");
const Auction = require("./../models/auctionModel");
const User = require("./../models/userModel");
const Report = require("./../models/reportModel");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { getPicture, savePicture } = require("./../utils/getPicture");
const Badge = require("./../utils/badge");

const confirmItemRecieveDeadlineLength = 10;

exports.createDelivery = catchAsync(async (req, res, next) => {
  const billingInfo = await BillingInfo.findOne({
    auctionID: req.params.auction_id,
  });
  if (!billingInfo) return next(new AppError("BillingInfo not found"));
  const billingBankAccount = {
    bankNO: req.body.bankAccountNO,
    bankName: req.body.bankName,
    auctioneerName: req.body.bankAccountName,
  };
  const pictureName = `${billingInfo._id}.jpeg`;
  const deliverInfo = {
    packagePicture: pictureName,
    trackingNumber: req.body.trackingNumber,
    shippingCompany: req.body.shippingCompany,
  };

  billingInfo.billingBankAccount = billingBankAccount;
  billingInfo.deliverInfo = deliverInfo;
  billingInfo.billingInfoStatus = "waitingForConfirm";

  savePicture(req.body.packagePicture, "packagePicture", pictureName);

  billingInfo.confirmItemRecieveDeadline =
    Date.now() + confirmItemRecieveDeadlineLength * 1000 * 60 * 60 * 24;

  billingInfo.save();

  res.status(201).json({
    status: "success",
  });
});

// "productName" : "Nintendo Switch",
// "auctioneerName" :"Kong",
// "delivery" : {
//     "packagePicture" : "pic",
//     "trackingNumber" : "12312421",
//     "shippingCompany" : "Thailand Post"

exports.getTrackingStatus = catchAsync(async (req, res, next) => {
  const billingInfo = await BillingInfo.findOne({
    auctionID: req.params.auction_id,
  });

  //Error Handling
  if (!billingInfo) return next(new AppError("Invalid auctionID", 400));
  if (billingInfo.billingInfoStatus !== "waitingForConfirm")
    return next(new AppError("You cannot tracking shipping right now", 400));
  const auction = await Auction.findById(req.params.auction_id);

  if (!auction) return next(new AppError("Auction not found", 400));
  const auctioneer = await User.findById(auction.auctioneerID);
  if (!auctioneer) return next(new AppError("Auctioneer not found", 400));

  const trackingInfo = {
    productName: auction.productDetail.productName,
    auctioneerName: auctioneer.displayName,
    delivery: {
      packagePicture: await getPicture(
        "packagePicture",
        billingInfo.deliverInfo.packagePicture
      ),

      trackingNumber: billingInfo.deliverInfo.trackingNumber,
      shippingCompany: billingInfo.deliverInfo.shippingCompany,
    },
  };
  res.status(200).json({
    status: "success",
    data: {
      trackingInfo,
    },
  });
});

exports.confirmDelivery = catchAsync(async (req, res, next) => {
  const billingInfo = await BillingInfo.findOne({
    auctionID: req.params.auction_id,
  });
  if (!billingInfo) return next(new AppError("BillingInfo not found", 400));
  billingInfo.billingInfoStatus = req.body.confirm
    ? "waitingAdminPayment"
    : "failed";

  //Create reprot if deny
  if (billingInfo.billingInfoStatus === "failed") {
    const auction = await Auction.findById(req.params.auction_id);
    const user = await User.findById(auction.auctioneerID);
    const report = await Report.create({
      reportedTime: Date.now(),
      reporterID: auction.currentWinnerID,
      reportedID: auction.auctioneerID,
      description: `User ${billingInfo.receiverName}(${auction.currentWinnerID}) did not recieve or recieve correctly from ${user.displayName}(${auction.auctioneerID})`,
    });
    user.totalAuctioned += 1;
	badge.generateBadge(user._id);
    user.save();
  }
  billingInfo.save();
  res.status(201).json({
    status: "success",
  });
});
