const catchAsync = require("./../utils/catchAsync");
const Auction = require("./../models/auctionModel");

exports.deleteAllUser = catchAsync(async (req, res, next) => {
  const script = await Auction.deleteMany({});

  if (!script) {
    return next(new AppError("No Data"), 404);
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.changeEndDate = catchAsync(async (req, res, next) => {
  if (req.query.option === "five_minute") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 5 * 60 * 1000 + 10 * 1000,
    });
  } else if (req.query.option === "hour") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 65 * 60 * 1000,
    });
  } else if (req.query.option === "day") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Data.now() + 2 * 24 * 60 * 60 * 1000,
    });
  }

  re.status(204).json({
    status: "success",
  });
});
