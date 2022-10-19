const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
    refundeeID: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "An refund entry must contain the refundee's userID"]
    },
    refundAmount: {
        type: Number,
        required: [true, "An refund entry must contain the refund amount"]
    },
    // If "True" = refunded, "False" = hasn't refunded yet
    refundStatus: {
        type: Boolean,
        required: [true, "An refund entry must contain the status of the refund"]
    },
    dateCreated: {
        type: Date
    },
    dateRefunded: {
        type: Date
    }
});

const Refund = mongoose.model('Refund', refundSchema);

module.exports = Refund