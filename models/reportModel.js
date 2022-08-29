const mongoose = require('mongoose');
// const validator = require('validator');

// TODO: Talk about the notification changes to the data model first then implement
const reportSchema = new mongoose.Schema({
    reporterId: {
        type: mongoose.ObjectId,
        required: [true, "A report must has its reporter's Id"]
    },
    reportedId: {
        type: mongoose.ObjectId,
        required: [true, "A report must has the reported user's Id"]
    },
    description: {
        type: String
        // Can a report be empty?
    },
    reportedTime: {
        type: Date,
        requried: [true, "A report must record its time"] // Is it required? But probably doesn't matter
    }
})

const Report = mongoose.model('Report', reportSchema)

module.exports = Report