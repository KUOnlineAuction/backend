const mongoose = require('mongoose');
const validator = require('validator')

// TODO: Test collecting data using objectID and in a list first to do this.
const userSchema = new mongoose.Schema({
    displayName : {
        type : String,
        required : [true , 'User must have a display name']
    },
    phoneNumber : {
        type : String
    },
    address : {
        type : String
    },
    email : {
        type : String,
        required : [true, 'User must have an email'],
        unique : true,
        lowercase : true,
        validate : [validator.isEmail, 'Please provide valid email']
    },
    password : {
        type : String,
        required : [true, 'User'],
        minlength : 10,
        select : false
    },
    passwordConfirm : {
        type : String,
        required : [true, 'Please confirm your password']
    },
    bankAccountNumber : {
        type : String
    },
    profilePicture : {
        type : String,
        default : 'default.jpg'
    },
    accountDescription : {
        type : String
    },
    badge : [{
        type : mongoose.Schema.ObjectId,
        ref : 'Badge'
    }],
    rating : {
        type : Number,
        min : 0,
        max : 5
    },
    reviewList : [{
        type : mongoose.Schema.ObjectId,
        ref : 'Review',
    }],
    totalAuctioned : {
        type : Number,
        default : 0
    },
    
    sucessAuctioned : {
        type : Number,
        default : 0
    },
    activeBiddingList : 
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'Auction'
    }],
    followingList : 
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'Auction'
    }],
    finishedBiddingList : 
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'Auction'
    }],
    activeAuctionList : 
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'Auction'
    }],
    finishedAuctionList :
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'Auction'
    }],
    billingList :
    [{
        type: mongoose.Schema.ObjectId,
        ref : 'BillingInfo'
    }],
    notificationList : 
    [{
        type : mongoose.Schema.ObjectId,
        ref : 'Notification'
    }],
    userStatus : {
        type : String,
        enum : ['notConfirm', 'active', 'blackList'],
        default : 'notConfirm'
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User