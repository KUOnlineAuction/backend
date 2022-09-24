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
  // const auctionID = await Auction.findById(req.params.auction_id);
  // const auctioneerName = await User.findById(auctionID.auctioneerID).displayName;
  // const billingInfo = await BilllingInfo.findById()
  // const TrackingInfo = {
  // 	productName: auctionID.productDetail.productName,
  // 	auctioneerName: auctioneerName,
  // 	delivery: {
  // 		pacakepicture:
  // 			trackingNumber:
  // 		shippingCompany:
  // 	}
  // }

  const auctionID = await Auction.findById(req.params.auction_id);
  const billingInfo = await BillingInfo.find({
    auctionID: req.params.auction_id,
  });

  const trackingInfo = {
    productName: auction,
  };

  res.status(201).json({
    status: "success",
    data: {
      trackingInfo,
    },
  });
});

exports.confirmDelivery = catchAsync(async (req, res, next) => {
  const confirmStatus = await billingInfo.billingInfoStatus.create({
    confirm: "true",
  });
});
