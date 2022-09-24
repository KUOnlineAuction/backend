const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// const testRouter = require('./routes/testRoutes')
const userRouter = require("./routes/userRoutes");
const auctionRouter = require("./routes/auctionRoutes");
const reportRouter = require("./routes/reportRoutes");
const paymentRouter = require("./routes/paymentRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const shippingRouter = require("./routes/shippingRoutes");
const adminRouter = require("./routes/adminRoutes");

const app = express();

// Global Middlewares
// Set Security HTTP headers
app.use(helmet());

// Developement logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request from the same API
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: "Too many request from this IP, please try again in an hour",
// });
// app.use("/", limiter);

// Body parser, reading data from body into req.body

app.use(express.json({ limit: "10MB" }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization againtst XSS
app.use(xss());

// Prevent parameter polution
app.use(
  hpp({
    whitelist: [],
  })
);

//CORS!!!!!!!!!!
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Route

// app.use('/test', testRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/auction", auctionRouter);
app.use("/report", reportRouter);
app.use("/payment", paymentRouter);

app.use("/review", reviewRouter);
app.use("/shipping", shippingRouter);

// Handle other invalid routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
