const User = require("./../models/userModel");
const Auction = require("./models/auctoinModel")
const Badge = require("./../models/badgeModel");

/*
 * psudo
 * 1) find user
 * 2) check
 * 3) assign badge
 */

/*
 * check every 5 auction
 */

/*
 * how to assign to user
 */

/*
 * top 10 , top 100 -> sort /
 *
 * fruad -> follow the formular (total auction successful auctoin)
 *
 * rising star -> 4 star / 
 *
 * top seller >= 100 /
 * top seller boil  -> total auction >= 1000 /
 * top seller century 21 ->  total auction >= 10000 / 
 *
 * Newbie -> every role -> sign up
 * Admin -> hand
 * Official ->  future
 *
 */

module.exports.gernerateBadge = catachAsync(async (req, res, next) => {
	const totalAuctioned = await User.find().select('totalAuctioned');
	const successAuctioned = await User.find().select('successAuctioned')
	// console.log(typeof (totalAuctioned));

	// sort revere 
	totalAuctioned.sort((a, b) => {
		return b.totalAuctioned - a.totalAuctioned
	})

	successAuctioned.sort((a,b) => {
		return b.totalAuctioned - a.totalAuctioned
	})

	let topSuccess = successAuctioned;
	let topSuccess100 = [];

	// collect top total auciton _id 
	for (let i = 0 ; i < topSuccess.length ; i++){
		if(i < 100){
			topSuccess100.push(topSuccess[i]._id)
		}
	}
	
	// asign badge 
	for (let i=0 ; i< topSuccess100.length ; i++){
		const badgeTop = await User.find
	}

	// top 10 , top 100 , top seller 
	//for (let i = 0; i <= top.length; i++) {

		//if (i > 100) {
			//break;
		//}

		//if (top[i] >= 10000) {
			//topSeller21Century.push(top[i]);
		//}

		//else if (top[i] >= 1000) {
			//topSeller.push(top[i]);
		//}

		//if (i < 10) {
			//top10.push(top[i])
		//}
		//top100.push(top[i]);
	//};

	// rising star

	const rating = await User.find().select(rating);
	let risingStar = []
	rating.forEach((e) => {
		if (e.rating >= 4) {
			risingStar.push(e)
		}
	});

});


