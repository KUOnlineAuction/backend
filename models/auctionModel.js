const mongoose = require('mongoose');
// const validator = require('validator');

const categoryTypesEnum = ["Home Improvement","Jewellery","Coins, Currentcy, Stamps","Watches","Fashion","Arts","Antiques & Collectables and Amulet","Electronics","Cars & Automotive","Handbags","Miscellaneous"];
const productNameMaxLength = 30;
const productDesciptionMaxLength = 200;


const defaultMinimumBid = (incomingBid) => {
    const digitCount = Math.ceil(Math.log10(incomingBid))
    return (incomingBid >= 5000) ? Math.pow(10,digitCount-3) 
    * Math.ceil( incomingBid / Math.pow(10,digitCount-1)) : 50
}

// Schema for productDetail 
const productDetailSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: [true, "A product must has a name."],
        maxlength: [productNameMaxLength, `The name cannot exceed ${productNameMaxLength}.`]
    },
    category: {
        type: String,
        required: [true, "A product must has a category."],
        enum : categoryTypesEnum
    },
    description: {
        type: String,
        required: [true, "A product must has a description."],
        maxlength: [productDesciptionMaxLength, `The description cannot exceed ${productDesciptionMaxLength}.`]
    },
    productPicture: {
        type: [String],
        required: [true, "A product must have atleast 1 picture."]
    }
})

// main Schema
const auctionSchema = new mongoose.Schema({
    productDetail: {
        type: productDetailSchema,
        required: [true, "An auction must have the complete detail of the products."]
    },
    auctioneerID: {
        type: mongoose.Schema.ObjectId,
        ref : "User",
        required: [true, "An auction must has an auctioneer ID."]
    },
    startingPrice: {
        type: Number,
        required: [true, "An auction must has a stating price."],
        min : [0, "The starting price must not be negative."],
    },
    bidStep: {
        type: Number,
        min : [1, "The minimum bid price must not be more than 0."]
        // If undefined : use default method to calculate minumum bid price
        // คนทำส่วน Auction คุยแก้กันเองได้เลยว่าจะเก็บ 0 หรือ NULL เป็น ไม่มี minimum bid price
    },
    expectedPrice: {
        type: Number,
        min : [0, "The expected price must not be negative."]
        // If undefined : Don't check the expected price since there are none
    },
    startDate: {
        type: Date,
        default: Date.now(),
        required: [true, "An auction must has a starting date."] 
        // Date Set in pre middleware
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
        type: Number,
        validate: {
            validator: function(el){
                // if there was no bid yet
                if(!this.currentPrice){
                    return el >= currentPrice
                }
                // if there was already a bid
                const bidstep = this.minimumBidPrice | defaultMinimumBid(this.currentPrice)
                return el >= (this.currentPrice + bidstep)
             },
             message: "The input bid is lower than the current bid + minimum bid step"
        }
        // ยังไม่ได่ตรวจ bug สำหรับ validator นี้นะ เช็คด้วย
    },
    currentWinnerID: {
        type: mongoose.Schema.ObjectId,
        ref : "User"
    },
    bidHistory: {
        type: [mongoose.Schema.ObjectId],
        ref : "BidHistory",
        default: []
    },
    // Date.now() + 6 month as default
    autoDestroy: {
        type: Date,
        default : Date.now() + 6 * 30 * 24 * 60 * 60 * 1000
    },
    auctionStatus: {
        type: String,
        enum: ['bidding', 'waiting', 'finished'],
        default: 'Bidding'
    },
    billingHistoryID: {
        type: mongoose.Schema.ObjectId,
        ref: 'BillingInfo'
    }
})

const ProductDetail = mongoose.model('ProductDetail', productDetailSchema);
const Auction = mongoose.model('Auction', auctionSchema);


module.exports = Auction;