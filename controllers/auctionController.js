const Auction = require("./../models/auctionModel");
const User = require("./../models/userModel");
const BidHistory = require("./../models/bidHistoryModel");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { getPicture, savePicture } = require("./../utils/getPicture");
const mongoose = require("mongoose");

//Hepler Function
/**
 * @desc calcuate bidStep by currentPrice
 * @param {Number} incomingBid
 * @returns bidStep
 */
const defaultMinimumBid = (incomingBid) => {
  const digitCount = Math.ceil(Math.log10(incomingBid));
  return incomingBid >= 5000
    ? Math.pow(10, digitCount - 3) *
        Math.ceil(incomingBid / Math.pow(10, digitCount - 1))
    : 50;
};

/**
 * @desc Censored input string
 * @param {String} name
 * @returns censored name
 */
const censoredName = (name) => {
  let censored = `${name[0]}******${name[name.length - 1]}`;
  return censored;
};

/**
 * @desc paginate array by page_size and page_number
 * @param {Array} array any array
 * @param {Number} page_size object per page
 * @param {Number} page_number skip to which page
 * @returns return paginated array
 */
const paginate = (array, page_size, page_number) => {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return array.slice((page_number - 1) * page_size, page_number * page_size);
};

/**
 * @desc calculate user stats wheather is fraud or not
 * @param {Number} totalAuctioned
 * @param {Number} successAuctioned
 * @param {Number} rating
 * @returns return true or false check wheather rating is low
 */
const fraudCalculate = (totalAuctioned, successAuctioned, rating) => {
  if (
    totalAuctioned > 5 &&
    (successAuctioned < totalAuctioned / 2 || rating < 2)
  )
    return true;
  return false;
};

/**
 * @desc get pictures from local storage and return base64 format
 * @param {String} folder
 * @param {Array} pictures
 * @param {Number} width
 * @param {Number} height
 * @returns array of base64
 */
const getPictures = (folder, pictures, width = 1000, height = 1000) => {
  let arrayOfBase64 = [];
  for (const pic of pictures) {
    const base64 = getPicture(folder, `${pic}`, width, height);
    arrayOfBase64.push(base64);
  }

  return arrayOfBase64;
};

/**
 * @desc get Array of base64 and save into local storage by using exist savePicture()
 * @param {String} folder name that want to save ex. productPicture
 * @param {Array} picturesBase64 array of base64
 * @param {Array} savedName array of pictureName
 */
const savePictures = catchAsync(
  async (
    folder,
    picturesBase64,
    savedName,
    width = 1000,
    height = 1000,
    quality = 80,
    original = false
  ) => {
    picturesBase64.forEach((value, index, arr) => {
      savePicture(
        value,
        folder,
        savedName[index],
        width,
        height,
        quality,
        original
      );
    });
  }
);

/**
 * @desc check wheather input id is valid mongodb objectID
 * @param {String} id that want to check
 * @return {Boolean} return true if inpur is valid mongodb;otherwise false
 */
const isValidObjectId = (id) => {
  if (mongoose.isValidObjectId(id)) return true;
  return false;
};

/**
 * @desc retrieve user id from bearer header. If bearer exist, will store token in decoded.id ,else decoded.id is undefined
 * @param {Object} req object
 * @return {Object} Returns decoded object which include token in deocded.id
 * @example
 *
 * getUserIdFromBearer(req)
 * // => { id: '632adc229b86a21bdbd0419a', iat: 1664723719, exp: 1672499719 }
 * /
 */
const getUserIdFromBearer = (req) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  let decoded = {};
  if (!token) {
    decoded.id = undefined;
  } else {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  }
  return decoded;
};

exports.getSummaryList = catchAsync(async (req, res, next) => {
  // Get user id if and store in decoded.id
  let decoded = getUserIdFromBearer(req);

  let filter = req.query.filter;
  let auctioneer = req.query.auctioneer;

  // Validate Query Param
  if (
    (auctioneer && filter !== "auctioneer") ||
    (filter === "auctioneer" && !auctioneer)
  ) {
    return next(new AppError("Incorrect Auctioneer Query", 400));
  }

  let auction;
  let formatedAuction = [];

  if (filter === "recent_bidding") {
    if (!decoded.id)
      return next(
        new AppError(
          "You are not logged in, please log in to gain access.",
          401
        )
      );

    const bidHistory = await BidHistory.find({ bidderID: decoded.id }).sort({
      biddingDate: -1,
    });

    // Get auctionID from BidHistory and convert into string
    const auctionIDs = Array.from(bidHistory, (value) =>
      String(value.auctionID)
    );

    // Distinct List of auctionID
    const distinctAuctionIDs = auctionIDs.filter(
      (v, i, a) => a.indexOf(v) === i
    );

    // Find Auction from distinct auctionID
    auction = await Auction.find({
      _id: { $in: distinctAuctionIDs },
      auctionStatus: "bidding",
      endDate: { $gt: Date.now() },
    });

    auction.sort(function (a, b) {
      return (
        distinctAuctionIDs.indexOf(String(a._id)) -
        distinctAuctionIDs.indexOf(String(b._id))
      );
    });

    // Formated response value
    auction.forEach((value) => {
      let tempVal = {
        auctionID: value._id,
        coverPicture: value.productDetail.productPicture[0] || "default.jpeg",
        productName: value.productDetail.productName,
        currentPrice: value.currentPrice
          ? value.currentPrice
          : value.startingPrice,
        endDate: String(new Date(value.endDate).getTime()),
        isWinning: String(value.currentWinnerID) === decoded.id,
      };
      formatedAuction.push(tempVal);
    });
  } else if (filter === "my_following_list") {
    // สุ่มที่กด follow มา
    if (!decoded.id)
      return next(
        new AppError(
          "You are not logged in, please log in to gain access.",
          401
        )
      );
    const user = await User.findById(decoded.id).populate({
      path: "followingList",
    });

    auction = user.followingList;
    // Formated response value
    auction.forEach((value) => {
      value = {
        auctionID: value._id,
        coverPicture: value.productDetail.productPicture[0] || "default.jpeg",
        productName: value.productDetail.productName,
        endDate: String(new Date(value.endDate).getTime()),
        currentPrice: value.currentPrice
          ? value.currentPrice
          : value.startingPrice,
        isWinning: value.currentWinnerID
          ? String(value.currentWinnerID) === decoded.id
          : false,
      };
      formatedAuction.push(value);
    });
  } else if (filter === "popular") {
    auction = await Auction.find({
      endDate: { $gt: Date.now() + 5 * 60 * 1000 },
      auctionStatus: "bidding",
    }).populate({
      path: "bidHistory",
    });

    // Formated response value
    Array.from(auction, (value) => {
      const distinctBidder = [
        ...new Set(value.bidHistory.map((x) => String(x.bidderID))),
      ];
      value = {
        auctionID: value._id,
        coverPicture: value.productDetail.productPicture[0] || "default.jpeg",
        productName: value.productDetail.productName,
        endDate: String(new Date(value.endDate).getTime()),
        currentPrice: value.currentPrice
          ? value.currentPrice
          : value.startingPrice,
        isWinning: value.currentWinnerID
          ? String(value.currentWinnerID) === decoded.id
          : false,
        bidderCount: distinctBidder.length,
      };
      formatedAuction.push(value);
    });
    formatedAuction.sort((a, b) => (a.bidderCount > b.bidderCount ? -1 : 1));
  } else if (filter === "ending_soon") {
    // Search ตาม Auction ใกล้หมดเวลา
    auction = await Auction.aggregate([
      {
        $match: { auctionStatus: "bidding" },
      },
      {
        $project: {
          auctionID: "$_id",
          coverPicture: "$productDetail.productPicture",
          productName: "$productDetail.productName",
          currentPrice: "$currentPrice",
          endDate: "$endDate",
          isWinning: {
            $eq: ["$currentWinnerID", { $toObjectId: decoded.id }],
          },
          timeRemaining: {
            $subtract: ["$endDate", Date.now()],
          },
        },
      },
    ]);

    // Sort by time remaining
    auction.sort((a, b) => (a.timeRemaining > b.timeRemaining ? 1 : -1));
    // Filter auction that already enter 5 minute system
    auction = auction.filter(
      (auction) => auction.timeRemaining >= 5 * 60 * 1000
    );

    // Formated response value
    auction.forEach((value) => {
      delete value._id;
      delete value.timeRemaining;
      value.coverPicture = value.coverPicture[0] || "default.jpeg";
      value.endDate = String(new Date(value.endDate).getTime());
    });
    formatedAuction = auction;
  } else if (filter === "auctioneer") {
    const user = await User.findById(auctioneer);
    user.activeAuctionList;
    auction = await Auction.aggregate([
      {
        $match: { _id: { $in: user.activeAuctionList } },
      },
      {
        $sort: { endDate: 1 },
      },
      {
        $project: {
          auctionID: "$_id",
          productName: "$productDetail.productName",
          coverPicture: "$productDetail.productPicture",
          currentPrice: 1,
          endDate: 1,
          isWinning: {
            $eq: ["$currentWinnerID", { $toObjectId: decoded.id }],
          },
        },
      },
    ]);
    auction.forEach((value) => {
      value.coverPicture = value.coverPicture[0] || "default.jpeg";
      value.endDate = String(new Date(value.endDate).getTime());
    });
    formatedAuction = auction;
  }

  formatedAuction = formatedAuction.slice(0, 15); // Get First 15 Auctions

  // Retrive coverPicture
  // formatedAuction = await Promise.all(
  //   formatedAuction.map(async (obj) => {
  //     const coverPicture = obj.coverPicture
  //       ? await getPicture("productPicture", obj.coverPicture, 300, 300)
  //       : await getPicture("productPicture", "default.jpeg", 300, 300);
  //     return {
  //       ...obj,
  //       coverPicture: coverPicture,
  //     };
  //   })
  // );

  formatedAuction.forEach((val) => {
    val.coverPicture = `http://52.220.108.182/api/picture/productPicture/${val.coverPicture}`;
  });

  res.status(200).json({
    status: "success",
    data: formatedAuction,
  });
});

exports.getSearch = catchAsync(async (req, res, next) => {
  // Get user id if and store in decoded.id
  let decoded = getUserIdFromBearer(req);

  const page = req.query.page ? req.query.page : 1;
  const sort = req.query.sort;
  const name = req.query.name;
  const category = req.query.category;

  //1) Search by name or category
  let auction;
  if (name && !category) {
    //Search by Name
    auction = await Auction.aggregate([
      { $unwind: "$productDetail" },
      {
        $match: {
          "productDetail.productName": { $regex: `${name}`, $options: "i" },
          auctionStatus: "bidding",
        },
      },
      {
        $project: {
          auctionID: "$_id",
          productName: "$productDetail.productName",
          category: "$productDetail.category",
          coverPicture: "$productDetail.productPicture",
          endDate: "$endDate",
          currentPrice: "$currentPrice",
          currentWinnerID: "$currentWinnerID",
          isWinning: {
            $eq: ["$currentWinnerID", decoded.id],
          },
          timeRemaining: {
            $subtract: ["$endDate", Date.now()],
          },
        },
      },
    ]);
  } else if (name && category) {
    console.log(name);
    console.log(category);
    //Search By Category and Name
    auction = await Auction.aggregate([
      {
        $match: {
          "productDetail.category": category,
          "productDetail.productName": { $regex: `${name}`, $options: "i" },
          auctionStatus: "bidding",
        },
      },
      {
        $project: {
          auctionID: "$_id",
          productName: "$productDetail.productName",
          category: "$productDetail.category",
          coverPicture: "$productDetail.productPicture",
          endDate: "$endDate",
          currentPrice: "$currentPrice",
          //isWinning พังอยู่
          isWinning: {
            $eq: ["$currentWinnerID", { $toObjectId: decoded.id }],
          },
          timeRemaining: {
            $subtract: ["$endDate", Date.now()],
          },
        },
      },
    ]);
  } else {
    //Search By Category
    auction = await Auction.aggregate([
      { $unwind: "$productDetail" },
      {
        $match: {
          "productDetail.category": category,
          auctionStatus: "bidding",
        },
      },
      {
        $project: {
          auctionID: "$_id",
          productName: "$productDetail.productName",
          category: "$productDetail.category",
          coverPicture: "$productDetail.productPicture",
          endDate: "$endDate",
          currentPrice: "$currentPrice",
          //isWinning พังอยู่
          isWinning: {
            $eq: ["$currentWinnerID", { $toObjectId: decoded.id }],
          },
          timeRemaining: {
            $subtract: ["$endDate", Date.now()],
          },
        },
      },
    ]);
  }
  // Retrive productPicture
  auction = await Promise.all(
    auction.map(async (obj) => {
      // const coverPicture = obj.coverPicture[0]
      //   ? await getPicture("productPicture", obj.coverPicture[0], 300, 300)
      //   : await getPicture("productPicture", "default.jpeg", 300, 300);
      const coverPicture = `http://52.220.108.182/api/picture/procutPicture/${obj.coverPicture[0]}`;
      obj.isWinning = String(obj.currentWinnerID) == decoded.id;
      obj.endDate = String(new Date(obj.endDate).getTime());
      return {
        ...obj,
        coverPicture: coverPicture,
      };
    })
  );

  // Sorting
  if (sort === "highest_bid") {
    auction.sort((a, b) => (a.currentPrice > b.currentPrice ? -1 : 1));
  } else if (sort === "lowest_bid") {
    auction.sort((a, b) => (a.currentPrice > b.currentPrice ? 1 : -1));
  } else if (sort === "newest") {
    auction.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));
  } else if (sort === "time_remaining") {
    auction.sort((a, b) => (a.timeRemaining > b.timeRemaining ? 1 : -1));
  } else {
    auction.sort((a, b) => (a.startDate > b.startDate ? 1 : -1));
  }

  // Paginate and format response value
  let totalResult = auction.length;
  let paginateAuction = paginate(auction, 35, page);
  paginateAuction.forEach((value) => {
    delete value.timeRemaining;
    delete value._id;
    delete value.currentWinnerID;
  });

  // Calculate total page
  let totalPage = Math.floor(auction.length / 35) + 1;

  res.status(200).json({
    status: "success",
    data: {
      pageCount: totalPage,
      itemCount: totalResult,
      auctionList: paginateAuction,
    },
  });
});

exports.getFollow = catchAsync(async (req, res, next) => {
  //Check auction_id is valid?
  if (!isValidObjectId(req.params.auction_id))
    return next("Please enter valid mongoDB ID", 400);

  // Get current user ID
  const decoded = req.user;

  if (!decoded) {
    return next(new AppError("Token not found"), 401);
  }
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError("User not found"), 400);
  }

  // If user already bid item cant follow
  user.activeBiddingList.forEach((value) => {
    if (String(value) === req.params.auction_id)
      return next(new AppError("You already bid this auction", 400));
  });

  // Your own auction
  user.activeAuctionList.forEach((value) => {
    if (String(value) === req.params.auction_id)
      return next(new AppError("This is your auction"), 400);
  });

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

  const decoded = req.user;

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

  if (!auction) {
    return next(new AppError("Auction not found"), 400);
  }

  //If user already bid item cant follow
  user.activeBiddingList.forEach((value) => {
    if (String(value) === req.params.auction_id)
      return next(new AppError("You cannot follow your activeBidding", 400));
  });

  //If user follow their own auction
  user.activeAuctionList.forEach((value) => {
    if (String(value) === req.params.auction_id)
      return next(new AppError("You cannot follow your own auction"), 400);
  });

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
        return value != req.params.auction_id;
      });
    }
    console.log(String(user.followingList[0]) == req.params.auction_id);
  } else {
    return next(new AppError("Please enter either true or false"), 400);
  }
  user.save();

  res.status(200).json({
    status: "success",
  });
});

exports.postAuction = catchAsync(async (req, res, next) => {
  // Get UserId
  const decoded = req.user;

  // Error Handling
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(AppError("User not found"), 400);
  }

  // expected price must higher than starting price
  if (req.body.startingPrice >= req.body.expectedPrice)
    return next(
      new AppError("Expected Price must higher than starting price", 401)
    );

  // Data Validation
  // endDate mustn't be a past
  if (new Date(req.body.endDate * 1) < Date.now())
    return next(new AppError("Enddate cannnot be a past"));
  // Minimum auction range is 1 hours
  if (new Date(req.body.endDate * 1) - 1 * 60 * 60 * 1000 < Date.now()) {
    return next(new AppError("Minimum auction range is 1 hour", 400));
  }
  if (new Date(req.body.endDate * 1) >= Date.now() + 365 * 24 * 60 * 60 * 1000)
    return next(new AppError("Maximum auction range is 1 years", 400));

  // Create Auction

  const createdAuction = { ...req.body };
  const productDetail = {
    productName: req.body.productName,
    category: req.body.category,
    description: req.body.description,
    productPicture: [],
  };

  delete createdAuction.productName;
  delete createdAuction.category;
  delete createdAuction.description;
  delete createdAuction.productPicture;

  createdAuction.productDetail = productDetail;
  createdAuction.auctioneerID = decoded.id;
  createdAuction.endDate = req.body.endDate
    ? new Date(req.body.endDate * 1)
    : null;

  const newAuction = await Auction.create(createdAuction);
  newAuction.productDetail.productPicture = [];

  const productPictureNames = [];
  if (!req.body.productPicture) {
    return next(new AppError("Please send productPicture"), 400);
  }
  req.body.productPicture.forEach((value, index, arr) => {
    const pictureName = `${newAuction._id}-${index}.jpeg`;
    productPictureNames.push(pictureName);
    newAuction.productDetail.productPicture.push(pictureName);
  });

  savePictures(
    "productPicture",
    req.body.productPicture,
    productPictureNames.at,
    null,
    null,
    100,
    true
  );

  newAuction.save();

  // Add auction to auctionList

  user.activeAuctionList.push(newAuction._id);
  user.save();

  res.status(201).json({
    status: "success",
    data: {
      auctionID: newAuction._id,
    },
  });
});

exports.getAuctionDetail = catchAsync(async (req, res, next) => {
  // Get user id if and store in decoded.id
  let decoded = getUserIdFromBearer(req);

  const auctionId = req.params.auction_id;
  if (!auctionId) {
    return next(new AppError("Required auction_id query"), 400);
  }

  const auction = await Auction.findById(auctionId);
  if (!auction) {
    return next(new AppError("Auction not found"), 400);
  }

  // Get myLastBid
  const bidHistory = await BidHistory.find({
    auctionID: auctionId,
    bidderID: decoded.id,
  }).sort({ biddingDate: -1 });

  // Get product Picture
  // const productPicture = await Promise.all(
  //   getPictures("productPicture", auction.productDetail.productPicture || [])
  // );

  const productPicture = auction.productDetail.productPicture.map(
    (val) => `http://52.220.108.182/api/picture/productPicture/${val}`
  );

  // Get fraud
  const user = await User.findById(auction.auctioneerID);
  const isFraud = fraudCalculate(
    user.totalAuctioned,
    user.successAuctioned,
    user.rating
  );
  let isAlreadyBid5Minute = false;
  let bidHistoryBefore5 = await BidHistory.find({
    auctionID: auctionId,
  }).sort({ biddingDate: -1 });

  bidHistoryBefore5 = bidHistoryBefore5.filter(
    (bidHistory) => bidHistory.biddingDate < auction.endDate - 5 * 60 * 1000
  );

  let currentPrice = !auction.currentPrice
    ? auction.startingPrice
    : auction.currentPrice;

  // 5 minute System currentPrice condition
  if (auction.endDate - Date.now() <= 5 * 60 * 1000) {
    if (
      bidHistory[0] &&
      auction.endDate - bidHistory[0].biddingDate <= 5 * 60 * 1000
    ) {
      isAlreadyBid5Minute = true;
      currentPrice = bidHistory[0] ? bidHistory[0].biddingPrice : 0;
    } else {
      currentPrice = bidHistoryBefore5[0]
        ? bidHistoryBefore5[0].biddingPrice
        : auction.startingPrice;
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      productDetail: {
        productName: auction.productDetail.productName,
        description: auction.productDetail.description,
        category: auction.productDetail.category,
        productPicture,
      },
      auctioneerID: auction.auctioneerID,
      auctioneerName: user.displayName,
      bidStep: auction.bidStep || defaultMinimumBid(auction.currentPrice),
      endDate: String(new Date(auction.endDate).getTime()),
      currentPrice,

      myLastBid: bidHistory[0] ? bidHistory[0].biddingPrice : 0,
      isAuctioneer: decoded.id === String(auction.auctioneerID),
      isFraud,
      isAlreadyBid5Minute,
    },
  });
});

exports.getBidHistory = catchAsync(async (req, res, next) => {
  if (!isValidObjectId(req.params.auction_id))
    return next(new AppError("Please enter valid mongoDB ID", 400));

  let decoded = getUserIdFromBearer(req);

  const auction_id = req.params.auction_id;
  const auction = await Auction.findById(auction_id)
    .populate({
      path: "bidHistory",
    })
    .populate({ path: "bidderID" });
  const user = await User.findById(decoded.id);
  // Close bid and not bid yet or not login
  if (
    !auction.isOpenBid &&
    user &&
    (!user.activeBiddingList.includes(auction_id) || !decoded)
  ) {
    return next(
      new AppError(
        "Closed Bid can be only seen by bidder who already bid this auction",
        401
      )
    );
  }

  // // เงื่อนไข Bidhistory ่ก่อน 5 นาที และหลัง 5 นาที
  // let bidHistory = auction.bidHistory;

  // if (auction.endDate - Date.now() <= 5 * 60 * 1000) {
  //   // auction enter 5 minute system
  //
  // }
  // const formatBidHistory = [];

  let bidHistory = await BidHistory.aggregate([
    {
      $match: {
        auctionID: auction._id,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "bidderID",
        foreignField: "_id",
        as: "bidder",
      },
    },
    {
      $project: {
        bidderName: "$bidder.displayName",
        biddingDate: "$biddingDate",
        biddingPrice: "$biddingPrice",
      },
    },
    { $set: { bidderName: { $arrayElemAt: ["$bidderName", 0] } } },
  ]);

  bidHistory = bidHistory.filter((value, index, arr) => {
    return auction.endDate - value.biddingDate > 5 * 60 * 1000;
  });
  bidHistory.sort((a, b) => {
    return a.biddingPrice < b.biddingPrice;
  });
  bidHistory = bidHistory.map((value, index, arr) => {
    return {
      bidderName: censoredName(value.bidderName),
      biddingDate: String(value.biddingDate.getTime()),
      biddingPrice: value.biddingPrice,
    };
  });

  res.status(200).json({
    status: "success",
    data: bidHistory,
  });
});

// Refresh (Finished)
exports.refresh = catchAsync(async (req, res, next) => {
  //Check id params
  if (!isValidObjectId(req.params.auction_id))
    return next(new AppError("Please enter valid mongoDB ID", 400));

  const auction = await Auction.findById(req.params.auction_id);

  if (!auction) {
    return next(new AppError("Auction not found"), 400);
  }

  let isAlreadyBid5Minute = false;
  let bidHistoryBefore5 = await BidHistory.find({
    auctionID: auctionId,
  }).sort({ biddingDate: -1 });

  bidHistoryBefore5 = bidHistoryBefore5.filter(
    (bidHistory) => bidHistory.biddingDate < auction.endDate - 5 * 60 * 1000
  );

  let currentPrice = !auction.currentPrice
    ? auction.startingPrice
    : auction.currentPrice;

  // 5 minute System currentPrice condition
  if (auction.endDate - Date.now() <= 5 * 60 * 1000) {
    if (
      bidHistoryBefore5[0] &&
      auction.endDate - bidHistoryBefore5[0].biddingDate <= 5 * 60 * 1000
    ) {
      isAlreadyBid5Minute = true;
      currentPrice = bidHistoryBefore5[0]
        ? bidHistoryBefore5[0].biddingPrice
        : 0;
    } else {
      currentPrice = bidHistoryBefore5[0]
        ? bidHistoryBefore5[0].biddingPrice
        : auction.startingPrice;
    }
  }

  res.status(200).json({
    status: "success",
    data: {
      currentPrice,
      dateNow: String(Date.now()),
    },
  });
});

exports.postBid = catchAsync(async (req, res, next) => {
  //Check valid id
  if (!isValidObjectId(req.params.auction_id))
    return next(new AppError("Please enter valid mongoDB ID", 400));
  // 1) Get current user ID
  const user_id = req.user.id;
  //2 Get AuctionID
  const auctionID = req.params.auction_id;

  let user = await User.findById(user_id);
  const auction = await Auction.findById(req.params.auction_id);

  // Error Handler

  // You cannot bid your own auction

  if (auction.auctioneerID == user_id)
    return next(new AppError("You cannot bid your own auction", 400));

  // If postBid after bidding endded
  if (auction.auctionStatus !== "bidding")
    return next(new AppError("Bid is already ended"), 400);

  // 5 minute system
  let auctionUpdatedCurrentPrice = req.body.biddingPrice;
  let auctionUpdatedCurrentWinnerID = user_id;
  if (auction.endDate - Date.now() <= 5 * 60 * 1000) {
    auctionUpdatedCurrentPrice = auction.currentPrice;
    auctionUpdatedCurrentWinnerID = auction.currentWinnerID;
    // If auction already in 5 minute system user can only bid once
    const bidHistory = await BidHistory.find({
      bidderID: user._id,
      auctionID: auction._id,
      biddingDate: {
        $gte: auction.endDate + 5 * 60 * 1000,
      },
    });

    if (bidHistory.length > 0)
      return next(new AppError("5 minute auction can be only bid once"), 400);

    if (req.body.biddingPrice > auction.currentPrice) {
      auctionUpdatedCurrentPrice = req.body.biddingPrice;
      auctionUpdatedCurrentWinnerID = user._id;
    }
  }

  const bidStep = auction.bidStep || defaultMinimumBid(auction.currentPrice);
  if (
    req.body.biddingPrice < auction.currentPrice + bidStep &&
    !(auction.endDate - Date.now() <= 5 * 60 * 1000)
  ) {
    return next(
      new AppError(
        "The input bid is lower than the current bid + minimum bid step"
      ),
      400
    );
  }

  // Expected Price
  const expectedPriceCheck = (auction) => {
    if (auction.endDate - Date.now() <= 60 * 60 * 1000) return auction.endDate;
    if (
      auction.expectedPrice &&
      auction.expectedPrice <= req.body.biddingPrice
    ) {
      return Date.now() + 60 * 60 * 1000;
    }
    return auction.endDate;
  };

  const updatedAuction = await Auction.updateOne(
    { _id: req.params.auction_id },
    {
      currentPrice: req.body.biddingPrice,
      currentWinnerID: user_id,
      endDate: expectedPriceCheck(auction),
    }
  );
  //4) Add to activeBiddingList if user never bid before
  if (!user.activeBiddingList.includes(req.params.auction_id)) {
    user.activeBiddingList.push(req.params.auction_id);
  }

  //5 Remove auction from followingList if exist
  const index = user.followingList.indexOf(req.params.auction_id);
  if (index > -1) {
    user.followingList.splice(index, 1);
  }

  user.save();

  //6 Create Bid History
  const bidHistory = {
    bidderID: user_id,
    auctionID,
    biddingPrice: req.body.biddingPrice,
    biddingDate: String(Date.now()),
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
