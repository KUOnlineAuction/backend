const mongoose = require('mongoose');
// const validator = require('validator');

const bidHistorySchema = new mongoose.Schema({
    bidderID: {
        type: mongoose.ObjectId,
        required: [true, "A bid must has the bidder ID."]
    },
    auctionID: {
        type: mongoose.ObjectId,
        required: [true, "A bid must has the auctioneer ID."]
    },
    biddingPrice: {
        type: Number,
        required: [true, "A bid must specify its bid price."]
    },
    biddingDate: {
        type: Date,
        required: [true, "A bid must have the date and time of the bidding."]
    }
})

const BidHistory = mongoose.model('BidHistory', bidHistorySchema)

module.exports = BidHistory