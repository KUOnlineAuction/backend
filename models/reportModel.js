const mongoose = require('mongoose');
// const validator = require('validator');

const maxReportLength = 200;

const reportSchema = new mongoose.Schema({
    reporterID: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "A report must has its reporter's Id"]
    },
    reportedID: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "A report must has the reported user's Id"]
    },
    description: {
        type: String,
        maxlength: maxReportLength
        // Can a report be empty?
    },
    reportedTime: {
        type: Date,
        default: Date.now(),
        requried: [true, "A report must record its time"]
    }
})

const Report = mongoose.model('Report', reportSchema)

module.exports = Report