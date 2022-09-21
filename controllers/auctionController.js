const Auction = require("./../models/auctionModel");
const User = require("./../models/userModel");
const BidHistory = require("./../models/bidHistoryModel");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const { getPicture, savePicture } = require("./../utils/getPicture");

//Hepler Function
const defaultMinimumBid = (incomingBid) => {
  const digitCount = Math.ceil(Math.log10(incomingBid));
  return incomingBid >= 5000
    ? Math.pow(10, digitCount - 3) *
        Math.ceil(incomingBid / Math.pow(10, digitCount - 1))
    : 50;
};

const censoredName = (name) => {
  let censored = `${name[0]}******${name[name.length - 1]}`;
  return censored;
};

const paginate = (array, page_size, page_number) => {
  // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
  return array.slice((page_number - 1) * page_size, page_number * page_size);
};

// fraud calcuation if return true == fraud , false === not fraud
const fraudCalculate = (totalAuctioned, successAuctioned, rating) => {
  if (
    totalAuctioned > 5 &&
    (successAuctioned < totalAuctioned / 2 || rating < 2)
  )
    return true;
  return false;
};

const getPictures = (folder, pictures) => {
  let arrayOfBase64 = [];
  for (const pic of pictures) {
    const base64 = getPicture(folder, `${pic}`);
    arrayOfBase64.push(base64);
  }

  return arrayOfBase64;
};

const savePictures = catchAsync(async (folder, picturesBase64, savedName) => {
  picturesBase64.forEach((value, index, arr) => {
    savePicture(value, folder, savedName[index]);
  });
});

/////////////////

exports.getSummaryList = catchAsync(async (req, res, next) => {
  //1. Get UserId
  let token;
  // 1) Get the token and check if it's exists
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
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  }

  //2 Qurey Handler
  let filter = req.query.filter;
  let auctioneer = req.query.auctioneer;
  if (
    (auctioneer && filter !== "auctioneer") ||
    (filter === "auctioneer" && !auctioneer)
  ) {
    return next(new AppError("Incorrect Auctioneer Query", 400));
  }
  let auction;
  let formatedAuction = [];
  if (filter === "recent_bidding") {
    const bidHistory = await BidHistory.find({ bidderID: decoded.id }).sort({
      biddingDate: -1,
    });
    const auctionIDs = Array.from(bidHistory, (value) =>
      String(value.auctionID)
    );
    const distinctAuctionIDs = auctionIDs.filter(
      (v, i, a) => a.indexOf(v) === i
    );

    auction = await Auction.find({ _id: { $in: distinctAuctionIDs } });

    auction.forEach((value) => {
      let tempVal = {
        auctionID: value._id,
        coverPicture: value.productDetail.productPicture[0] || "default.jpg",
        productName: value.productDetail.productName,
        currentPrice: value.currentPrice
          ? value.currentPrice
          : value.startingPrice,
        endDate: String(new Date(value.endDate).getTime()),
        isWinning: String(value.currentWinnerID) === decoded.id,
      };

      formatedAuction.push(tempVal);
    });
  } else if (filter === "my_following_list" && decoded) {
    // สุ่มที่กด follow มา
    const user = await User.findById(decoded.id).populate({
      path: "followingList",
    });

    auction = user.followingList;
    auction.forEach((value) => {
      value = {
        auctionID: value._id,
        coverPicture: value.productDetail.productPicture[0] || "default.jpg",
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
    // Serach ตามจำนวน bidder
    auction = await Auction.find().populate({ path: "bidHistory" });
    Array.from(auction, (value) => {
      const distinctBidder = [
        ...new Set(value.bidHistory.map((x) => String(x.bidderID))),
      ];
      value = {
        auctionID: value._id,
        coverPicture: value.productDetail.productPicture[0] || "default.jpg",
        productName: value.productDetail.productName,
        endDate: String(new Date(value.endDate).getTime()),
        currentPricee: value.currentPrice
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
        $project: {
          auctionID: "$_id",
          coverPicture: "$productDetail.productPicture",
          productName: "$productDetail.productName",
          currentPrice: "$currentPrice",
          endDate: "$endDate",
          //ใช้ได้เฉย
          isWinning: {
            $eq: ["$currentWinnerID", { $toObjectId: decoded.id }],
          },
          timeRemaining: {
            $subtract: ["$endDate", Date.now()],
          },
        },
      },
    ]);

    auction.sort((a, b) => (a.timeRemaining > b.timeRemaining ? 1 : -1));
    auction.forEach((value) => {
      delete value._id;
      delete value.timeRemaining;
      value.coverPicture = value.coverPicture[0] || "default.jpeg";
      value.endDate = String(new Date(value.endDate).getTime());
    });
    formatedAuction = auction;
  }

  formatedAuction = formatedAuction.slice(0, 15);
  formatedAuction = await Promise.all(
    formatedAuction.map(async (obj) => {
      console.log(formatedAuction);
      const coverPicture = obj.coverPicture
        ? await getPicture("productPicture", obj.coverPicture)
        : await getPicture("productPicture", "default.jpeg");
      return {
        ...obj,
        coverPicture: coverPicture,
      };
    })
  );

  res.status(200).json({
    stauts: "success",
    data: formatedAuction,
  });
});

exports.getSearch = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get the token and check if it's exists
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
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  }

  const page = req.query.page ? req.query.page : 1;
  const sort = req.query.sort;
  const name = req.query.name;
  const category = req.query.category;

  //1) Search by name or category
  let auction;
  if (name) {
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
          //isWinning พังอยู่
          isWinning: {
            $eq: ["$currentWinnerID", decoded.id],
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
        $match: { "productDetail.category": category },
      },
      {
        $project: {
          timeRemaining: {
            $subtract: ["$endDate", Date.now()],
          },
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

  auction = await Promise.all(
    auction.map(async (obj) => {
      const coverPicture = obj.coverPicture[0]
        ? await getPicture("productPicture", obj.coverPicture[0])
        : await getPicture("productPicture", "default.jpeg");
      obj.isWinning = String(obj.currentWinnerID) == decoded.id;
      obj.endDate = String(new Date(obj.endDate).getTime());
      return {
        ...obj,
        coverPicture: coverPicture,
      };
    })
  );

  // 2) Sorting
  if (sort === "highest_bid") {
    auction.sort((a, b) => (a.currentPrice > b.currentPrice ? -1 : 1));
  } else if (sort === "lowest_bid") {
    auction.sort((a, b) => (a.currentPrice > b.currentPrice ? 1 : -1));
  } else if (sort === "newest") {
    auction.sort((a, b) => (a.startDate > b.startDate ? -1 : 1));
  } else if (sort === "time_remaining") {
    auction.sort((a, b) => (a.timeRemaining > b.timeRemaining ? 1 : -1));
  } else {
    auction.sort((a, b) => (a.currentPrice > b.currentPrice ? -1 : 1));
  }

  let totalResult = auction.length;
  let paginateAuction = paginate(auction, 35, page);
  paginateAuction.forEach((value) => {
    delete value.timeRemaining;
    delete value._id;
    delete value.currentWinnerID;
  });

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
  // 1) Get current user ID
  const decoded = req.user;

  if (!decoded) {
    return next(new AppError("Token not found"), 401);
  }
  const user = await User.findById(decoded.id);

  if (!user) {
    return next(new AppError("User not found"), 400);
  }

  //If user already bid item cant follow
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
        return value === req.params.auction_id;
      });
    }
  } else {
    return next(new AppError("Please enter either true or false"));
  }
  user.save();

  res.status(200).json({
    status: "success",
  });
});

// Not Implement store picture yet
exports.postAuction = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get the token and check if it's exists
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
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  }

  //2) Create Auction

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
  //Format Picture

  const productPictureNames = [];
  if (!req.body.productPicture) {
    return next(new AppError("Please send productPicure"), 400);
  }
  req.body.productPicture.forEach((value, index, arr) => {
    const pictureName = `${newAuction._id}-${index}.jpeg`;
    productPictureNames.push(pictureName);
    newAuction.productDetail.productPicture.push(pictureName);
  });

  savePictures("productPicture", req.body.productPicture, productPictureNames);
  // savePicture(req.body.productPicture, "productPicture", "HelloWorkd.jpeg");

  newAuction.save();

  //3) Add auction to auctionList
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(AppError("User not found"), 401);
  }
  user.activeAuctionList.push(newAuction._id);
  user.save();

  res.status(201).json({
    status: "success",
  });
});

exports.getAuctionDetail = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get the token and check if it's exists
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
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  }

  const auctionId = req.params.auction_id;
  if (!auctionId) {
    return next(new AppError("Required auction_id query"), 400);
  }

  const auction = await Auction.findById(auctionId);
  if (!auction) {
    return next(new AppError("Auction not found"));
  }

  // Get myLastBid
  const bidHistory = await BidHistory.find({
    auctionID: auctionId,
    bidderID: decoded.id,
  }).sort({ biddingDate: -1 });

  // Get product Picture
  const productPicture = await Promise.all(
    getPictures("productPicture", auction.productDetail.productPicture || [])
  );

  // Get fraud
  const user = await User.findById(auction.auctioneerID);
  const isFraud = fraudCalculate(
    user.totalAuctioned,
    user.successAuctioned,
    user.rating
  );

  res.status(200).json({
    status: "success",
    data: {
      productDetail: {
        productName: auction.productDetail.productName,
        description: auction.productDetail.description,
        productPicture,
      },
      auctioneerID: auction.auctioneerID,
      bidStep: auction.bidStep || defaultMinimumBid(auction.currentPrice),
      endDate: String(new Date(auction.endDate).getTime()),
      currentPrice: !auction.currentPrice //if auction did not have bidder send startPrice instead currentPrice
        ? auction.startingPrice
        : auction.currentPrice,

      myLastBid: bidHistory[0] ? bidHistory[0].biddingPrice : 0,
      isAuctioneer: decoded.id === String(auction.auctioneerID),
      isFraud,
    },
  });
});

exports.getBidHistory = catchAsync(async (req, res, next) => {
  let token;
  // 1) Get the token and check if it's exists
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
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  }

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
    (!user.activeBiddingList.includes(auction_id) || !decoded)
  ) {
    return next(
      new AppError(
        "Closed Bid can be only seen by bidder who already bid this auction",
        401
      )
    );
  }

  // เงื่อนไข Bidhistory ่ก่อน 5 นาที และหลัง 5 นาที
  let bidHistory = auction.bidHistory;

  if (auction.endDate - Date.now() <= 5 * 60 * 1000) {
    // auction enter 5 minute system
    bidHistory = bidHistory.filter((value, index, arr) => {
      return auction.endDate - value.biddingDate > 5 * 60 * 1000;
    });
  }
  const formatBidHistory = [];
  bidHistory.forEach(async (value, index, arr) => {
    const user = await User.findById(value.bidderID);
    formatBidHistory.push({
      bidderName: censoredName(user.displayName),
      biddingDate: String(new Date(value.biddingDate).getTime()),
      biddingPrice: value.biddingPrice,
    });

    // Please come and fixed this in the future
    if (index === bidHistory.length - 1 || bidHistory.length === 0) {
      res.status(200).json({
        status: "success",
        bidHistory: formatBidHistory,
      });
    }
  });
  // If there is no bid History
  if (bidHistory.length === 0) {
    res.status(200).json({
      status: "success",
      bidHistory: formatBidHistory,
    });
  }
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
  const user_id = req.user.id;
  //2 Get AuctionID
  const auctionID = req.params.auction_id;

  let user = await User.findById(user_id);
  const auction = await Auction.findById(req.params.auction_id);

  // Error Handler
  // If auction already in 5 minute system user can only bid once
  if (auction.endDate - Date.now() <= 5 * 60 * 1000) {
    const bidHistory = await BidHistory.find({
      bidderID: user._id,
      auctionID: auction._id,
      biddingDate: {
        $gte: auction.endDate + 5 * 60 * 1000,
      },
    });

    if (bidHistory.length > 0)
      return next(new AppError("5 minute auction can be only bid once"));
  }

  // If postBid after bidding endded

  if (auction.auctionStatus !== "bidding")
    return next(new AppError("Bid is already ended"));

  //3 Update Auction ขอใส่อันนี้ไปก่อนเดียวไป refactor code ทีหลัง

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
  // Expected Price
  const updatedAuction = await Auction.updateOne(
    { _id: req.params.auction_id },
    {
      currentPrice: req.body.biddingPrice,
      currentWinnerID: user_id,
      endDate:
        auction.expectedPrice && auction.expectedPrice <= auction.currentPrice
          ? Date.now() + 60 * 60 * 1000
          : auction.endDate,
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
