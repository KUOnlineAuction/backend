const mongoose = require('mongoose');
// const validator = require('validator');

// TODO: Talk about the notification changes to the data model first then implement
const notificationSchema = new mongoose.Schema({

})

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification