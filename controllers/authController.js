const { promisify } = require("util");
const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const Email = require("./../utils/email");
const crypto = require("crypto");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createAndSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    user.password = undefined
    user.passwordConfirm = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    // 1) Clean the data to upload to the database
    const user = {
        displayName: req.body.displayName,
        email: req.body.email,
        password: req.body.password
    }

    const test = await User.findOne({email: user.email})
    if(test){
        return next(new AppError("The email haas already been used",400))
    }

    if(user.password.length<10){
        return next(new AppError("The password is too short (at least 10 character)",400))
    } else if (user.password.length>30){
        return next(new AppError("The password is too long (at most 30 character)",400))
    } else {
        const specialChar = "!@#$%^&*()_-+=[]{}|;:’”,.<>/?~"
        let lowercaseValidation = false
        let uppercaseValidation = false
        let numberValidation = false
        let specialCharValidation = false
        for (let letter of user.password){
            if (specialChar.includes(letter)){
                specialCharValidation = true
            } else if (!isNaN(letter)){
                numberValidation = true
            } else if (letter == letter.toUpperCase()) {
                uppercaseValidation = true
            } else if (letter == letter.toLowerCase()){
                lowercaseValidation = true
            }
        }
        if(!lowercaseValidation){
            return next(new AppError("The password must contain a lowercase character",400))
        }
        if(!uppercaseValidation){
            return next(new AppError("The password must contain a uppercase character",400))
        }
        if(!numberValidation){
            return next(new AppError("The password must contain a number",400))
        }
        if(!specialCharValidation){
            return next(new AppError("The password must contain a apecial character (!@#$%^&*()_-+=[]{}|;:’”,.<>/?~)",400))
        }
    }

    // 2) Create new user in database
    const newUser = await User.create(user)

    // 3) Try sending a verification email
    try{
    const url = `${req.protocol}://${req.get('host')}/account/verify/${newUser._id}` // MUST CHANGE TO VERIFICATION EMAIL
    await new Email(newUser,url).sendConfirmEmail()
    } catch (err) {
        await User.deleteOne(newUser)
        return next(new AppError("Internal server error",500))
    }
    
    res.status(201).json({
        "status": "success"
    })
})

exports.signupnoverify= catchAsync(async (req, res, next) => {
    if(process.env.NODE_ENV !== 'development'){
        return next(new AppError('You are not authorized to access this.', 401))
    }
    // 1) Make the user status = 'notConfirm' first
    req.body.userStatus = 'active'

    // 2) Create new user in database
    await User.create(req.body)

    // SKIP EMAIL VERIFICATION
    res.status(201).json({
        "status": "success"
    })
})

exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body

    // 1) check if emal password exists
    if(!email || !password){
        return next(new AppError('Please provide email and password', 400))
    }
    // 2) check if user exist && password is correct / and the user is verified or blacklisted

    const user = await User.findOne({email}).select('+password')

    if(user.userStatus === 'notConfirm'){
        return next(new AppError("The user hasn't verifed the email yet.",401))
    }

    if(user.userStatus === 'blacklist'){
        return next(new AppError("This account has been blacklisted.",401))
    }

    if(!user || !(await user.correctPassword(password, user.password))){
        return next(new AppError('Incorrect email or password', 401))
    }

    user.passwordInvalidDate = undefined
    await user.save({validateBeforeSave: false})

    // 3) if everything is ok, send the web token to the client
    createAndSendToken(user, 200, res)
})

exports.signout = catchAsync(async(req, res, next) => {
    // fix header
    const user = await User.findById(req.user.id)

    user.passwordInvalidDate = Date.now()
    user.save({validateBeforeSave: false})

    res.status(201).json({
        "status" : "success",
    })
})

exports.validateUser = catchAsync(async(req, res, next) => {
    await User.findByIdAndUpdate(req.params.id, {
        userStatus : 'active'
    })
    res.status(201).json({
        "status" : "success"
    })
})

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email address", 404));
  }

  // 2) Generate the random reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // 3) Send it as an email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/account/user/reset-password/${resetToken}`;

  await new Email(user, resetURL).sendPasswordReset();
  res.status(200).json({
    status: "success",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.query.id)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) if token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }

    if(req.body.password.length<10){
        return next(new AppError("The password is too short (at least 10 character)",400))
    } else if (req.body.password.length>30){
        return next(new AppError("The password is too long (at most 30 character)",400))
    } else {
        const specialChar = "!@#$%^&*()_-+=[]{}|;:’”,.<>/?~"
        let lowercaseValidation = false
        let uppercaseValidation = false
        let numberValidation = false
        let specialCharValidation = false
        for (let letter of req.body.password){
            if (specialChar.includes(letter)){
                specialCharValidation = true
            } else if (!isNaN(letter)){
                numberValidation = true
            } else if (letter == letter.toUpperCase()) {
                uppercaseValidation = true
            } else if (letter == letter.toLowerCase()){
                lowercaseValidation = true
            }
        }
        if(!lowercaseValidation){
            return next(new AppError("The password must contain a lowercase character",400))
        }
        if(!uppercaseValidation){
            return next(new AppError("The password must contain a uppercase character",400))
        }
        if(!numberValidation){
            return next(new AppError("The password must contain a number",400))
        }
        if(!specialCharValidation){
            return next(new AppError("The password must contain a apecial character (!@#$%^&*()_-+=[]{}|;:’”,.<>/?~)",400))
        }
    }

    user.password = req.body.newPassword
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

  // 3) log the user in, send JWT
  createAndSendToken(user, 200, res);
});

// must login to access this API
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1) Get the token and check if it's exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    }
    if (!token){
        return next(new AppError('You are not logged in, please log in to gain access.',401))
    }
    // 2) Validate the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    // Handled errors with errorController for JsonWebTokenError and TokenExpirefError

    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id)
    if(!freshUser){
        return next(new AppError('The user belonging to the token no longer exists.'))
    }

    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)){ // iat = token issued at
        return next(new AppError('User recently changed the password. Please log in again.'))
    }

    // 5) Check if user is signed out or not
    if (freshUser.passwordInvalidDate < Date.now()){
        return next(new AppError('The user has logged out. Please log in again to enter this site.'))
    }

    // Grant Access to protected route
    req.user = freshUser;
    next()
})

// Input list of user accessable user
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.userStatus)) {
      return next(
        new AppError("You do not have permission to perform this action"),
        403
      );
    }
    next();
  };
};
