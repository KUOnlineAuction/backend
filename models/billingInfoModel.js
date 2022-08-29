const mongoose = require('mongoose');
// const validator = require('validator');


// TODO: UNFINISHED, LET ME TEST THE SUBDOCUMENTS FIRST
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

})

const Billing = mongoose.model('Billing', billingSchema)

module.exports = Billing