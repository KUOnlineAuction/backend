const Report = require("./../models/reportModel");
const User = require("./../models/userModel");

const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

exports.postReport = catchAsync(async (req, res, next) => {
  if (!req.body.reportID || !req.body.reportDescription) {
    return next(new AppError("Please enter reportID or description"), 400);
  }

  const reportedUser = await User.findById(req.body.reportID);

  if (!reportedUser) {
    return next(new AppError("Reported ID not found"), 400);
  }
  const report = {
    reporterID: req.user.id,
    reportedID: req.body.reportID,
    description: req.body.reportDescription,
    reportedTime: Date.now(),
  };

  const createdReport = await Report.create(report);

  res.status(201).json({
    status: "success",
  });
});
