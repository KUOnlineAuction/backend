const catchAsync = require('./../utils/catchAsync');
const Auction = require('./../models/auctionModel');


exports.deleteAllUser = catchAsync(async (req, res, next) => {
    const script = await Auction.deleteMany({});

    if (!script) {
        return next(new AppError('No Data'), 404)
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});
