const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");

exports.profile = catchAsync(async (req, res, next) => {
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
  console.log(`decoded = ${decoded}`);
  // 2) query user
  const user = await User.findById(req.params.id).select("+password");

  if (!user) {
    return next(new AppError("Incorrect UserID", 401));
  }

  // 3) Check if the userID of the user who is checking match the id finding it or not

  const isHimself = decoded ? decoded.id == req.params.id : false;

  // 4) Query the badges, reviews and item bidding
  // not done yet

  res.status(200).json({
    result: "success",
    isHimself,
    user,
  });
});

exports.test = (req, res, next) => {
  const decoded = req.cookies.jwt;
  console.log(decoded);
  res.status(200);
};
