const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const backNameEnum = [
  "BBL",
  "BAY",
  "CIMBT",
  "ICB",
  "KBANK",
  "KKP",
  "KTB",
  "LH",
  "SCB",
  "SCT",
  "TISCO",
  "UOB",
  "TTB",
  "GSB",
  "CITI",
  "GHB",
  "BAAC",
  "IBT",
  "TCRB",
  "HSBC",
];

const userSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: [true, "User must have a display name"],
    maxlength: [30, "Maximum display name is 30"],
  },
  phoneNumber: {
    type: String,
  },
  address: {
    type: String,
  },
  email: {
    type: String,
    required: [true, "User must have an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide valid email"],
  },
  password: {
    type: String,
    required: [true, "User must have a password"],
    minlength: 10,
    select: false,
  },
  profilePicture: {
    type: String,
    default: "default.jpg", // Fixed to the location of default image in final product
  },
  accountDescription: {
    type: String,
  },
  badge: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Badge",
    },
  ],
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  reviewList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Review",
    },
  ],
  bankNO: String,
  bankName: {
    type: String,
    enum: backNameEnum,
  },
  bankAccountName: String,
  totalAuctioned: {
    type: Number,
    default: 0,
  },
  successAuctioned: {
    type: Number,
    default: 0,
  },
  activeBiddingList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Auction",
    },
  ],
  followingList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Auction",
    },
  ],
  finishedBiddingList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Auction",
    },
  ],
  activeAuctionList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Auction",
    },
  ],
  finishedAuctionList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "Auction",
    },
  ],
  billingList: [
    {
      type: mongoose.Schema.ObjectId,
      ref: "BillingInfo",
    },
  ],
  // notificationList :
  // [{
  //     type : mongoose.Schema.ObjectId,
  //     ref : 'Notification'
  // }],
  userStatus: {
    type: String,
    enum: ["notConfirm", "active", "blacklist", "admin"],
    default: "notConfirm",
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordInvalidDate: Date,
  passwordChangedAt: Date,
});

userSchema.pre("save", async function (next) {
  // console.log(this._id);
  if (!this.isModified("password")) return next;
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// userSchema.post('save', async function(){
//     console.log(this._id);
// })

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  // false = no error
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // 1) Create a random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2) store hashed password reset token and expire time
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // console.log({resetToken}, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // returns original token BEFORE hashing into the database
  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
