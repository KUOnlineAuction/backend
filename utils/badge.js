const User = require("./../models/userModel");
const Auction = require("../models/auctionModel");
const Badge = require("./../models/badgeModel");
const catchAsync = require("./../utils/catchAsync");

module.exports.gernerateBadge = catchAsync(async (userId) => {
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

  const user = await User.findById(userId);

  // top 10 100 newbie
  //const auction = await User.find()
    //.select("successauctioned")
    //.select("_id")
    //.select("badge");
  //auction.sort((a, b) => {
    //return b.successauctioned - a.successauctioned;
  //});
  //for (let i = 0; i < auction.length; i++) {
	//auction[i].badge = [] ;
    //if (i <= 10) {
      //auction[i].badge.push(top_10);
    //} else if (i <= 100) {
      //auction[i].badge.push(top_100);
    //}
	//if (auction[i].badge === 0) {
	  //auction[i].badge.push(newbie);
	//}
    //auction[i].save();
  //}
	
  // clear Badge
  user.badge = [];

  // assign Badge

  // admin
  if (user.userStatus === "admin") {
    user.badge.push(admin);
  }

  // fruad
  let checkFraud = false;
  if (
    user.totalAuctioned > 5 &&
    (user.successAuctioned < user.totalAuctioned / 2 || user.rating < 2)
  ) {
    checkFraud = true;
  }
  if (checkFraud) {
    user.badge.push(fraud);
  }

  // stars
  if (user.rating >= 4) {
    user.badge.push(stars);
  }

  // top seller
  if (user.totalAuctioned >= 10000) {
    user.badge.push(top_seller_10k);
  } else if (user.totalAuctioned >= 1000) {
    user.badge.push(top_seller_1k);
  } else if (user.totalAuctioned >= 100) {
    user.badge.push(top_seller_100);
  }


  //newbie
  if (user.badge.length === 0 ){
  user.badge.push(newbie);
  }

  // save
  user.save();
  // #####################################
  res.status(200).json({
	status: "success",
	});
});
