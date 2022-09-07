const mongoose = require('mongoose');
// const validator = require('validator');

const shippingCompanyEnum = ["Kerry Express","Grab","Lalamove","Nim Express","Line Man","TNT Express","DHL Express","SCG Express","Flash Express","Skootar","J&T Express","Best Express","Inter Express Logistics","Ninja Van"]
const billingInfoStatusEnum = ['waitingForPayment','waitingConfirmSlip','waitingForShipping','waitingForConfirm','waitingAdminPayment','completed']

const billingBankAccountSchema = new mongoose.Schema({
    bankNO: {
        type: String
    },
    name: {
        type: String
    }
})

const slipSchema = new mongoose.Schema({
    slipPicture: {
        type: String
    },
    slipDateTime: {
        type: Date
    },
    slipAmount: {
        type: Number
    }
})

const deliverInfoSchema = new mongoose.Schema({
    packagePicture: {
        type: String
    },
    trackingNumber: {
        type: String
    },
    shippingCompany: {
        type: String,
        enum: shippingCompanyEnum
    }
})

const billingInfoSchema = new mongoose.Schema({
    auctionID: {
        type: mongoose.Schema.ObjectId,
        ref: 'Auction',
        required: [true, "A billing info must has the auctioneer's Id."]
    },
    price: {
        type: Number,
        required: [true, "A billing info must has its price."]
    },
    receiverName: {
        type: String,
        required: [true, "A billing info must has its reciever's name."]
    },
    address: {
        type: String,
        requried: [true, "A billing info must has its owner's address."]
    },
    billingBankAccount: billingBankAccountSchema,
    slip: slipSchema,
    deliverInfo: deliverInfoSchema,
    billingInfoStatus: {
        type: String,
        enum: billingInfoStatusEnum,
        default: 'waitingForPayment'
    }
})

const BillingInfo = mongoose.model('BillingInfo', billingInfoSchema)
const BillingBankAccount = mongoose.model('BillingBankAccount', billingBankAccountSchema)
const Slip = mongoose.model('Slip', slipSchema)
const DeliverInfo = mongoose.model('DeliverInfo', deliverInfoSchema)

module.exports = {BillingInfo, BillingBankAccount, Slip, DeliverInfo}