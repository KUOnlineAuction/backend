const Auction = require("./../models/auctionModel");
const User = require("./../models/userModel");
const BidHistory = require("./../models/bidHistoryModel");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const multer = require("multer");

//Define Multer
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "picture/productPicture");
  },
  filename: catchAsync(async (req, file, cb) => {
    //1. Get UserId
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    const decoded = token
      ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
      : undefined;

    const ext = file.minetype.split("/")[1];
    cb(null, `auction-${decoded}.${ext}`);
  }),
});

//Hepler Function
const defaultMinimumBid = (incomingBid) => {
  const digitCount = Math.ceil(Math.log10(incomingBid));
  return incomingBid >= 5000
    ? Math.pow(10, digitCount - 3) *
        Math.ceil(incomingBid / Math.pow(10, digitCount - 1))
    : 50;
};

const multerFilter = (req, file, cb) => {
  if (file.minetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadProductPicture = upload.single("photo");

/////////////////

exports.getSummaryList = catchAsync(async (req, res, next) => {
  //1. Get UserId
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  const decoded = token
    ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    : undefined;

  //2 Qurey Handler
  let filter = req.query.filter;
  let auctioneer = req.query.auctioneer;
  if (
    (auctioneer && filter !== "auctioneer") ||
    (filter === "auctioneer" && !auctioneer)
  ) {
    return next(new AppError("Incorrect Auctioneer Query", 400));
  }

  if (filter === "popular") {
    const auctions = await Auction.find({ auctionStatus: "bidding" });
  }
  //   if (filter === "recent_bidding") {
  //     const user = await User.findById(decoded.id);
  //     res.status(200).json({
  //       status: "success",
  //       user,
  //     });
  //   }
});

exports.getSearch;

exports.getFollow = catchAsync(async (req, res, next) => {
  // 1) Get current user ID
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const decoded = token
    ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    : undefined;

  if (!decoded) {
    return next(new AppError("Token not found"), 401);
  }
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError("User not found"), 400);
  }

  res.status(200).json({
    status: "success",
    data: {
      following: user.followingList.includes(req.params.auction_id)
        ? "true"
        : "false",
    },
  });
});

exports.postFollow = catchAsync(async (req, res, next) => {
  // 1) Get current user ID
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const decoded = token
    ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    : undefined;

  // 2) Error Handler
  if (!decoded) {
    return next(new AppError("Token not found"), 401);
  }
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError("User not found"), 400);
  }

  const auction = await Auction.findOne({
    _id: req.params.auction_id,
    auctionStatus: "bidding",
  });

  console.log(auction);
  if (!auction) {
    return next(new AppError("Auction not found"), 400);
  }
  // 3) Insert or Removing following Auctions
  if (req.body.follow === "true") {
    if (!user.followingList.includes(req.params.auction_id)) {
      user.followingList.push(req.params.auction_id);
    }
  } else if (req.body.follow === "false") {
    if (user.followingList.includes(req.params.auction_id)) {
      user.followingList = user.followingList.filter(function (
        value,
        index,
        arr
      ) {
        return value === req.params.auction_id;
      });
    }
  } else {
    return next(new AppError("Please enter either true or false"));
  }
  user.save();

  res.status(200).json({
    stauts: "success",
  });
});

// Not Implement store picture yet
exports.postAuction = catchAsync(async (req, res, next) => {
  // 1) Get current user ID
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const decoded = token
    ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    : undefined;

  if (!decoded.id) {
    return next(new AppError("Token not found"), 401);
  }

  //2) Create Auction
  const createdAuction = { ...req.body };
  const productDetail = {
    productName: req.body.productName,
    category: req.body.category,
    description: req.body.description,
  };

  delete createdAuction.productName;
  delete createdAuction.category;
  delete createdAuction.description;
  delete createdAuction.productPicture;

  createdAuction.productDetail = productDetail;
  createdAuction.auctioneerID = decoded.id;
  createdAuction.endDate = new Date(req.body.endDate * 1000);

  const newAuction = await Auction.create(createdAuction);

  //3) Add auction to auctionList
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(AppError("User not found"), 401);
  }
  user.activeAuctionList.push(newAuction._id);
  user.save();

  res.status(201).json({
    stauts: "sucess",
  });
});

exports.getAuctionDetail = catchAsync(async (req, res, next) => {
  const auctionId = req.params.auction_id;
  if (!auctionId) {
    return next(new AppError("Required auction_id query"), 400);
  }

  const auction = await Auction.findById(auctionId);

  if (!auction) {
    return next(new AppError("Auction not found"));
  }
  res.status(200).json({
    status: "success",
    data: {
      productDetail: {
        productName: auction.productDetail.productName,
        description: auction.productDetail.description,
        productPicture: auction.productDetail.productPicture,
      },
      auctioneerID: auction.auctioneerID,
      bidStep: auction.bidStep,
      endDate: auction.endDate,
      currentPrice: !auction.currentPrice //if auction did not have bidder send startPrice instead currentPrice
        ? auction.startingPrice
        : auction.currentPrice,
    },
  });
});

exports.getBidHistory = catchAsync(async (req, res, next) => {
  // 1) Get current user ID
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const decoded = token
    ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    : undefined;

  const auction_id = req.params.auction_id;
  const auction = await Auction.findById(auction_id);
  const user = await User.findById(decoded.id);
  // Close bid and not bid yet or not login
  if (
    !auction.isOpenbid &&
    (!user.activeBiddingList.includes(auction_id) || !decoded)
  ) {
    return next(
      new AppError(
        "Closed Bid can be only seen by bidder who already bid this auction"
      ),
      401
    );
  }
  // เงื่อนไข Bidhistory ่ก่อน 5 นาที และหลัง 5 นาที
  let bidHistoryList;
});

// Refresh (Finished)
exports.refresh = catchAsync(async (req, res, next) => {
  const auction = await Auction.findById(req.params.auction_id);

  if (!auction) {
    return next(new AppError("Auction not found"), 400);
  }

  res.status(200).json({
    status: "success",
    data: {
      currentPrice: !auction.currentPrice
        ? auction.startingPrice
        : auction.currentPrice,
      dateNow: String(Date.now()),
    },
  });
});

exports.postBid = catchAsync(async (req, res, next) => {
  // 1) Get current user ID
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  const decoded = token
    ? await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    : undefined;

  if (!decoded) {
    return next(new AppError("User not found"), 400);
  }
  //2 Get AuctionID
  const auctionID = req.params.auction_id;

  //3 Update Auction ขอใส่อันนี้ไปก่อนเดียวไป refactor code ทีหลัง
  const auction = await Auction.findById(req.params.auction_id);

  const bidStep =
    auction.minimumBidPrice | defaultMinimumBid(auction.currentPrice);

  if (req.body.biddingPrice < auction.currentPrice + bidStep) {
    return next(
      new AppError(
        "The input bid is lower than the current bid + minimum bid step"
      ),
      400
    );
  }

  const updatedAuction = await Auction.updateOne(
    { _id: req.params.auction_id },
    { currentPrice: req.body.biddingPrice }
  );

  //4) Add to activeBiddingList if user never bid before
  const user = await User.findById(decoded.id);
  if (!user.activeBiddingList.includes(req.params.auction_id)) {
    user.activeBiddingList.push(req.params.auction_id);
  }
  user.save();

  //5 Create Bid History
  const bidHistory = {
    bidderID: decoded.id,
    auctionID,
    biddingPrice: req.body.biddingPrice,
    biddingDate: Date.now(),
  };
  const newBidHistory = await BidHistory.create(bidHistory);

  const addBidHistory = await Auction.updateOne(
    { _id: req.params.auction_id },
    { $push: { bidHistory: newBidHistory._id } }
  );

  res.status(201).json({
    status: "success",
  });
});
