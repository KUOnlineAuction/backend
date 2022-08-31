const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    reviewerID: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "A review must has its revierer's user Id."]
    },
    auctioneerID: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "A review must has the auctioneer user's Id."]
    },
    rating: {
        type: Number,
        required: [true, "A review must has a rating."]
    },
    comment: {
        type: String,
        requried: [true, "A report must record its time."] // Is it required or optional?
    },
    productName: {
        type: String,
        requied: [true, "A review must has the name of the product that reviewer auctioned."]
    }
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review