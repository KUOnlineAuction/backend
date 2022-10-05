const { BillingInfo } = require("./../models/billingInfoModel");
const Auction = require("./../models/auctionModel");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { getPicture, savePicture } = require("./../utils/getPicture");

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

  savePicture(req.body.packagePicture, "packagePicture", pictureName);

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
  const auction = await Auction.findById(req.params.auction_id);
  const auctioneer = await User.findById(auction.auctioneerID);

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
  const billingInfo = await BillingInfo.find({
    auctionID: req.params.auction_id,
  });
  billingInfo.billingInfoStatus = req.body.confirm
    ? "waitingAdminPayment"
    : "completed";
  billingInfo.save();
  res.status(201).json({
    status: "success",
  });
});
