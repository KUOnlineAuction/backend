const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
// const testRouter = require('./routes/testRoutes')
const userRouter = require("./routes/userRoutes");
const auctionRouter = require("./routes/auctionRoutes");
const reportRouter = require("./routes/reportRoutes");

const app = express();

// Global Middlewares
// Set Security HTTP headers
app.use(helmet());

// Developement logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request from the same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, please try again in an hour",
});
app.use("/api", limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));

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

app.use(cookieParser());

// Serving static files
app.use(express.static(`${__dirname}/public`));

-(
  // Test middleware
  app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
  })
);

// Route

// app.use('/api/test', testRouter);
app.use("/api/user", userRouter);
app.use("/api/auction", auctionRouter);
app.use("/api/report", reportRouter);

// Handle other invalid routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
