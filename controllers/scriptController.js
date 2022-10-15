const catchAsync = require("./../utils/catchAsync");
const Auction = require("./../models/auctionModel");

const AppError = require("./../utils/appError");

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
      endDate: Date.now() + 5 * 60 * 1000 + 20 * 1000,
    });
  } else if (req.query.option === "hour") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 65 * 60 * 1000,
    });
  } else if (req.query.option === "day") {
    const auction = await Auction.findByIdAndUpdate(req.params.auction_id, {
      endDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
    });
  } else {
    return next(new AppError("Required query params"));
  }

  res.status(204).json({
    status: "success",
  });
});

exports.getAllUser = catchAsync(async (req, res, next) => {
  const user = await User.find()
    .select("_id")
    .select("successAuctioned")
    .select("totalAuctioned")
    .select("rating");
  //console.log(user);
  for (let i = 0; i < user.length; i++) {
    console.log(user[i].successAuctioned);
    console.log(user[i].totalAuctioned);
    console.log(user[i].rating);
    console.log(user[i]._id);
  }

  // #####################################
  res.status(200).json({
    status: "success",
  });
});

exports.getBadge = catchAsync(async (req, res, next) => {
  const top_10 = { _id: "634954a6a102ac2aace71589" };
  const top_100 = { _id: "634954e8a102ac2aace7158a" };
  const fraud = { _id: "6349552aa102ac2aace7158b" };
  const stars = { _id: "63495544a102ac2aace7158c" };
  const top_seller_100 = { _id: "63495554a102ac2aace7158d" };
  const top_seller_1k = { _id: "6349556ea102ac2aace7158e" };
  const top_seller_10k = { _id: "63495661a102ac2aace7158f" };
  const newbie = { _id: "6349568da102ac2aace71590" };
  const admin = { _id: "6349569da102ac2aace71591" };
  const official = { _id: "634956b7a102ac2aace71592" };

  //const badge = await Badge.find();
  //console.log(badge);

  const user = await User.find()
    .select("_id")
    .select("successAuctioned")
    .select("totalAuctioned")
    .select("rating")
    .select("badge");
  //console.log(user.badge)
  //console.log(user[0].badge.length)
  for (let i = 0; i < user.length; i++) {
    if (user[i].badge.length === 0) {
      user[i].badge.push(newbie);
    }
    user[i].save();
  }

  // #####################################
  res.status(200).json({
    status: "success",
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.find()
    .select("_id")
    .select("successAuctioned")
    .select("totalAuctioned")
    .select("rating")
    .select("badge")
    .select("userStatus");

  const top_10 = { _id: "634954a6a102ac2aace71589" };
  const top_100 = { _id: "634954e8a102ac2aace7158a" };
  const fraud = { _id: "6349552aa102ac2aace7158b" };
  const stars = { _id: "63495544a102ac2aace7158c" };
  const top_seller_100 = { _id: "63495554a102ac2aace7158d" };
  const top_seller_1k = { _id: "6349556ea102ac2aace7158e" };
  const top_seller_10k = { _id: "63495661a102ac2aace7158f" };
  const newbie = { _id: "6349568da102ac2aace71590" };
  const admin = { _id: "6349569da102ac2aace71591" };
  const official = { _id: "634956b7a102ac2aace71592" };

  for (let i = 0; i < user.length; i++) {
    if (user[i].userStatus === "admin") {
      user[i].badge.push(admin);
      user[i].save();
    }
  }

  /*
	user.sort((x,y)=> {
		return y.totalAuctioned - x.totalAuctioned;
	});

	let top100 = [];

	// add _id to top100 
	for(let i=0 ; i < user.length  ;  i++){
		console.log(user[i].totalAuctioned)
		console.log(user[i]._id)
		top100.push(user[i]._id)
	}

	console.log("")
	console.log("space")
	console.log("")

	// debug top100
	top100.forEach((e)=>{
		console.log(e)
	})

	console.log("")
	console.log("space")
	console.log("")

	*/

  // ##################################################
  res.status(200).json({
    status: "success",
  });
});
