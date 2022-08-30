const mongoose = require('mongoose');
// const validator = require('validator');

// TODO: Add shipping company names that we will let the user choose
const shippingCompanyEnum = []
const shippingStatusEnum = ['WaitPayment','WaitConfirmSlip ','waitShipping','waitReceive','finished' ]

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
        type: string
    },
    trackingNumber: {
        type: String
    },
    shippingCompany: {
        type: String,
        enum: shippingCompany
    }
})

const billingInfoSchema = new mongoose.Schema({
    auctionId: {
        type: mongoose.ObjectId,
        required: [true, "A billing info must has the auctioneer's Id."]
    },
    price: {
        type: Number,
        required: [true, "A billing info must has its price."]
    },
    recieverName: {
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
        enum: shippingStatusEnum,
        default: 'WaitPayment'
    }
})

const Billing = mongoose.model('Billing', billingSchema)
const BillingBankAccount = mongoose.model('BillingBankAccount', billingBankAccountSchema)
const Slip = mongoose.model('Slip', slipSchema)
const DeliverInfo = mongoose.model('DeliverInfo', deliverInfoSchema)

module.exports = {Billing, BillingBankAccount, Slip, DeliverInfo}