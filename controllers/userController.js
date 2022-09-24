const multer = require('multer');
const sharp = require('sharp');
const path = require('path')
const mongoose = require('mongoose')
const Badge = require('./../models/badgeModel');
const User = require('./../models/userModel');
const Review = require('./../models/reviewModel');
const Auction = require('./../models/auctionModel');
const BillingInfo = require('./../models/billingInfoModel');
const BidHistory = require('./../models/bidHistoryModel');
const catchAsync = require('./../utils/catchAsync');
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const AppError = require("./../utils/appError")
const {getPicture, savePicture} = require("./../utils/getPicture")

// const multerStorage = multer.memoryStorage()

// const multerFilter = (req, file, cb) => {
//   if (file.mimetype.startsWith('image')) {
//     cb(null, true);
//   } else {
//     cb(new AppError('Not an image! Please upload only images.', 400), false);
//   }
// };

// const upload = multer({
//   storage: multerStorage,
//   fileFilter: multerFilter
// });

// exports.uploadUserImage = upload.single('photo')

// exports.resizeUserImage = (req ,res, next) => {
//     const img = req.body.profilePicture.replace(/.*,/, "");
//     const imageBuffer = Buffer.from(img, 'base64')
//     req.body.filename = `${req.user.id}.jpg`
//     const filePath = path.join(__dirname, '..', 'picture', 'profilePicture', req.body.filename)
//     sharp(imageBuffer).resize(1000,1000).toFormat('jpeg').jpeg({quality: 50}).toFile(filePath)
//     next()
// }

exports.myProfile = catchAsync( async (req, res, next) => {
    
    // 1) Get current user ID
    // no longer needed


    // 2) query user
    let user = await User.findById(req.user.id).select('accountDescription profilePicture displayName email phoneNumber address badge').lean()
    if(!user){
        return next(new AppError("something went wrong",400))
    }
    // front ไม่มี PhoneNumber

    // 3) Query the badge, and then replace the ids with the badge name
    let badgeNames = []
    for (let el of user.badge){
        const badgeEl = await Badge.findById(el)
        badgeNames.push(badgeEl.badgeName)
    }
    user.badge = badgeNames

    // 4) Convert profile image to base64 and send it
    const picture = await getPicture('profilePicture',user.profilePicture)
    if(!picture){
        return next(new AppError("Invalid folder/file name",500))
    }
    user.profilePicture = picture

    // Add handling errors
    res.status(200).json({
        result :"success",
        user
    })
})

exports.editProfle = catchAsync (async (req, res, next) =>{
    // 1) find the user
    const user = await User.findById(req.user.id)

    // 2) update the provided feilds
    // 2.1) update the profile picture

    if(req.body.profilePicture){
        const filename = `${req.user.id}.jpg`
        // await savePicture(req.body.profilePicture, 'profilePicture', filename, 1000,1000,quality=80)
        await savePicture(req.body.profilePicture, 'profilePicture', filename, null, null, null, original=true)
    }

    // 2.2) then the rest
    const updatedFields = ['displayName','email','phoneNumber','address','accountDescription']
    for(let el of updatedFields){
        if(req.body[el]){
             user[el] = req.body[el]
        }
    }
    await user.save()
    // await user.save()
    // console.log(user);
    res.status(200).json({
        result: "success",
    })
})

exports.myorder = catchAsync (async (req, res, next) =>{
    // 0) check the type of auction queried is correct
    if(!req.query.list || (req.query.list !== 'mybid' && req.query.list !== 'myauction')){
        return( next( new AppError("Invalid query, please query for 'mybid' or 'myauction'",400)))
    }

    // 1) find the user + check if valid
    let user = await User.findById(req.user.id).select('activeBiddingList finishedBiddingList activeAuctionList finishedAuctionList').lean()
    if(!user){
        return( next(new AppError("The user does not exists",400)))
    }

    // 2.1) find query for my bids
    let queryString = []
    if(req.query.list === 'mybid'){
        for (let el of user.activeBiddingList){
            queryString.push(mongoose.Types.ObjectId(el))
        }
        for (let el of user.finishedBiddingList){
            queryString.push(mongoose.Types.ObjectId(el))
        }
    } 
    // 2.2) for my auctions
    else if(req.query.list === 'myauction'){
        for (let el of user.activeAuctionList){
            queryString.push(mongoose.Types.ObjectId(el))
        }
        for (let el of user.finishedAuctionList){
            queryString.push(mongoose.Types.ObjectId(el))
        }
    }
    
    // 3) Altered the response as the API specified
    let auctions = await Auction.find({
        '_id': { $in : queryString}
    }).select('productDetail endDate currentPrice auctionStatus billingHistoryID bidHistory').sort('endDate').lean()

    for( let el of auctions){
        el.auctionID = el._id
        // comment next line if picture hasn't been implemented
        const aucPic = await getPicture('auctionPicture', el.productDetail.productPicture[0])
        if(!aucPic){
            return next(new AppError("Couldn't find the picture"),500)
        }
        el.productPicture = aucPic
        el.productName = el.productDetail.productName
        el.lastBid = el.currentPrice
        if(el.auctionStatus === 'waiting'){
            const bill = await BillingInfo.findById(el.billingHistoryID).select('billingInfoStatus').lean()
            el.billingStatus = bill.billingInfoStatus
        } else {
            el.billingStatus = null
        }
        
        if(req.query.list === 'mybid' && el.auctionStatus === 'bidding'){
            let bidQueryString = []
            for (let bid of el.bidHistory){
                bidQueryString.push(mongoose.Types.ObjectId(bid))
            }
            const userLastBid = await BidHistory.find({_id: { $in : bidQueryString}, bidderID : user._id}).sort({'biddingPrice': -1}).limit(1)
            el.userBidPrice = userLastBid[0].biddingPrice
        }

        const excludedField = ["_id","productDetail","currentPrice","billingHistoryID","endDate","bidHistory"]
        for(field of excludedField){
            el[field] = undefined
        }
    }

    res.status(200).json({
        result: "success",
        auctions
    })
})

exports.aucProfile = catchAsync (async (req, res, next) =>{
    // 1) find the user + check if valid
    let user = await User.findById(req.params.id).select('displayName activeAuctionList email phoneNumber address description profilePicture rating totalAuctioned successAuctioned badge reviewList').lean()
    if(!user){
        return( next(new AppError("The user does not exists",400)))
    }

    // 2) get the badges
    let badgeNames = []
    for (let el of user.badge){
        const badgeEl = await Badge.findById(el)
        badgeNames.push(badgeEl.badgeName)
    }
    user.badge = undefined
    user.badgeNames = badgeNames

    // 3) get the comments
    let reviews = []
    for (let el of user.reviewList){
        const badgeEl = await Review.findById(el).select(['-auctioneerID','-_id','-__v'])
        reviews.push(badgeEl)
    }
    user.reviewList = undefined
    user.reviews = reviews

    // 4) calucate isFruad
    if(user.totalAuctioned < 5){
        user.isFraud = false
    } else if(user.rating < 2 || (successAuctioned < (totalAuctioned/2)))
        user.ifFraud = true
    else{
        user.isFraud = false
    }

    // 5) get the user profile pic
    user.profilePicture = await getPicture('profilePicture',user.profilePicture, 200,200)

    // 6) get the auctions
    let queryString = []
    for (let el of user.activeAuctionList){
        queryString.push(mongoose.Types.ObjectId(el))
    }

    let auctions = await Auction.find({
        '_id': { $in : queryString}
    }).select('productDetail endDate currentPrice').sort('endDate').limit(15).lean()
    
    for(let el of auctions){
        // comment next line if picture hasn't been implemented
        el.productPicture = await getPicture('auctionPicture', el.productDetail.productPicture[0])
        el.productName = el.productDetail.productName
        el.productDetail._id = undefined
        el.productDetail = undefined
    }

    user.activeAuctionList = auctions

    res.status(200).json({
        result: "success",
        user
    })
})