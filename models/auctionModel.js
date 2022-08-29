const mongoose = require('mongoose');
// const validator = require('validator');

const categoryTypes = ["Tmp"]; // please edit this
const productNameMaxLength = 30;
const productDesciptionMaxLength = 200;

const productDetailSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "A product must has a name."],
        maxlength: [productNameMaxLength, `The name cannot exceed ${productNameMaxLength}.`]
    },
    category: {
        type: String,
        required: [true, "A product must has a category."],
        enum : categoryTypes
    },
    description: {
        type: String,
        required: [true, "A product must has a description."],
        maxlength: [productDesciptionMaxLength, `The description cannot exceed ${productDesciptionMaxLength}.`]
    },
    picture: {
        type: [String],
        required: [true, "A product must have atleast 1 picture."]
    }
})

const auctionSchema = new mongoose.Schema({
    productDetail: {
        type: productDetailSchema,
        required: [true, "An auction must have the complete detail of the products."]
    },
    auctioneerID: {
        type: mongoose.ObjectId,
        required: [true, "An auction must has an auctioneer ID."]
    },
    startingPrice: {
        type: Number,
        required: [true, "An auction must has a stating price."]
        // TODO: Is posiive validator?
    },
    minimumBidPrice: {
        type: Number,
        // TODO: Is posiive validator?
    },
    expectedPrice: {
        type: Number,
        // TODO: Is posiive validator?
    },
    startDate: {
        type: Date,
        required: [true, "An auction must has a starting date."]
    },
    endDate: {
        type: Date,
        required: [true, "An auction must has a ending date."]
    },
    isOpenBid: {
        type: Boolean,
        default: false
    },
    currentPrice: {
        type: Number
        // TODO: validator for updates:    is the number higher than now?
        //                                 is it higher or equal than starting price
    },
    currentWinnerId: {
        type: mongoose.ObjectId,
    },
    bidHistory: {
        type: [mongoose.ObjectId],
        default: []
    },
    autoDestroy: {
        type: Date
    },
    auctionStatus: {
        type: String,
        enum: ['Bidding', 'Waiting', 'Finished']
    }
})

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;

// TODO: Test using subdocuments