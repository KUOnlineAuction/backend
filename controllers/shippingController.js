const BillingInfo = require('./../models/billingInfoModel');
const Auction = require('./../models/auctionModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.createDelivery = catchAsync(async (req, res, next) => {

    //const bank = await billingInfo.BillingBankAccount.create(
    //bankNO :  req.body.bankNO ,
    //bankName : req.body.bankName ,
    //bankAccountName : req.body.auctioneerName ,
    //});


    const bankInfo = await BillingInfo.BillingBankAccount.create(req.body);
    const shipping = await BillingInfo.DeliverInfo.create(req.body);

    const bidderInfo = await BillingInfo.BillingInfo.create({
        bankInfo: bankInfo,
        shipping: shipping,
    });

    res.status(201).json({
        status: 'success',
        data: {
            productName: 'putang ina',
            bidderName: bidderInfo.receiverName,
            bidderAddress: bidderInfo.address,
        },
    })

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
    const billingInfo = await BillingInfo.find({ auctionID: req.params.auction_id });

    const trackingInfo = {
        productName: auction

    }

    res.status(201).json({
        status: 'success',
        data: {
            trackingInfo
        }
    })
});

exports.confirmDelivery = catchAsync(async (req, res, next) => {
    const confirmStatus = await billingInfo.billingInfoStatus.create({
        confirm: "true"
    })
});
