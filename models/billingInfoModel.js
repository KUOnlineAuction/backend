const mongoose = require("mongoose");
// const validator = require('validator');

const shippingCompanyEnum = [
  "KEX",
  "GRAB",
  "LLMV",
  "NIM",
  "LINE",
  "TNT",
  "DHL",
  "SCG",
  "FLASH",
  "SKT",
  "J&T",
  "BEST",
  "IEL",
  "NINJA",
];
const billingInfoStatusEnum = [
  "waitingForPayment",
  "waitingConfirmSlip",
  "waitingForShipping",
  "waitingForConfirm",
  "waitingAdminPayment",
  "completed",
  "failed",
];
const backNameEnum = [
  "BBL",
  "BAY",
  "CIMBT",
  "ICB",
  "KBANK",
  "KKP",
  "KTB",
  "LH",
  "SCB",
  "SCT",
  "TISCO",
  "UOB",
  "TTB",
  "GSB",
  "CITI",
  "GHB",
  "BAAC",
  "IBT",
  "TCRB",
  "HSBC",
];
const failureMessage = [
  "noBidders",
  "biddderPaymentDeadlineBroken", 
  "auctioneerShippingDeadlineBroken",
  "bidderDenyItemReceive",
];

const billingBankAccountSchema = new mongoose.Schema({
  bankNO: {
    type: String,
  },
  bankName: {
    type: String,
    enum: backNameEnum,
  },
  auctioneerName: {
    type: String,
  },
});

const slipSchema = new mongoose.Schema({
  slipPicture: {
    type: String,
  },
  slipDateTime: {
    type: Date,
  },
  slipAmount: {
    type: Number,
  },
});

const deliverInfoSchema = new mongoose.Schema({
  packagePicture: {
    type: String,
  },
  trackingNumber: {
    type: String,
  },
  shippingCompany: {
    type: String,
    enum: shippingCompanyEnum,
  },
});

const billingInfoSchema = new mongoose.Schema({
  auctionID: {
    type: mongoose.Schema.ObjectId,
    ref: "Auction",
    required: [true, "A billing info must has the auctioneer's Id."],
  },
  winningPrice: {
    type: Number,
    required: [true, "A billing info must has its price."],
  },
  receiverName: {
    type: String,
  },
  address: {
    type: String,
    requried: [true, "A billing info must has its owner's address."],
  },
  bidderPhoneNumber: {
    type: String,
  },
  billingBankAccount: billingBankAccountSchema,
  slip: slipSchema,
  deliverInfo: deliverInfoSchema,
  billingInfoStatus: {
    type: String,
    enum: billingInfoStatusEnum,
    default: "waitingForPayment",
  },
  bidderPaymentDeadline: {
    type: Date
  },
  deliverDeadlineBroken: {
    type: Boolean,
    default: false
  },
  deliverDeadline:{
    type: Date
  },
  confirmItemRecieveDeadline:{
    type: Date
  },
  failureCause: {
    type: String,
    enum: failureMessage
  }
});

const BillingInfo = mongoose.model("BillingInfo", billingInfoSchema);
const BillingBankAccount = mongoose.model(
  "BillingBankAccount",
  billingBankAccountSchema
);
const Slip = mongoose.model("Slip", slipSchema);
const DeliverInfo = mongoose.model("DeliverInfo", deliverInfoSchema);

module.exports = { BillingInfo, BillingBankAccount, Slip, DeliverInfo };
