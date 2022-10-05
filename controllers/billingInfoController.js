const Auction = require("./../models/auctionModel");
const User = require("./../models/userModel");
const { BillingInfo } = require("./../models/billingInfoModel");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const { getPicture } = require("./../utils/getPicture");

exports.getBillingInfo = catchAsync(async (req, res, next) => {
  const billingInfo = await BillingInfo.findOne({
    auctionID: req.params.auction_id,
  });
  const auction = await Auction.findById(req.params.auction_id);
  if (!auction) return next(new AppError("Cannot find auction", 400));
  const auctioneer = await User.findById({
    _id: auction.auctioneerID,
  });
  if (!auctioneer) return next(new AppError("Cannot find auctioneer", 400));
  const decoded = req.user;

  const info = {
    productName: auction.productDetail.productName,
    productPicture: await getPicture(
      "productPicture",
      auction.productDetail.productPicture[0]
    ),
    auctioneerID: auction.auctioneerID,
    auctioneerName: auctioneer.displayName,
    winningPrice: billingInfo.winningPrice,
    bidderName: billingInfo.receiverName || null,
    bidderAddress: billingInfo.address || null,
    bidderPhoneNumber: billingInfo.bidderPhoneNumber || null,
    trackingNumber: billingInfo.deliverInfo
      ? billingInfo.deliverInfo.trackingNumber
      : null,
    shippingCompany: billingInfo.deliverInfo
      ? billingInfo.deliverInfo.shippingCompany
      : null,
    packagePicture: await getPicture(
      "packagePicture",
      billingInfo.deliverInfo
        ? billingInfo.deliverInfo.packagePicture
        : "default.jpeg"
    ),
    billingInfoStatus: billingInfo.billingInfoStatus,
    isAuctioneer: decoded.id === Stirng(auction.auctioneerID),
  };

  res.status(200).json({
    status: "success",
    data: info,
  });
});
