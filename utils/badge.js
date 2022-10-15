const User = require("./../models/userModel");
const Auction = require("./models/auctoinModel")
const Badge = require("./../models/badgeModel");

const auctionController = require("./../controllers/auctionController");

module.exports.gernerateBadge = catachAsync(async (req, res, next) => {

	const successAuctioned = await User.find().select('successAuctioned');
	const totalAuctioned = await User.find().select('totalAuctioned');
	const topRating = await User.find().select('rating');

	const user = await User.find().select('_id').select('successAuctioned').select('totalAuctioned').select('rating').select("badge").select('userStatus');

	const top_10  		 =    { _id: '634954a6a102ac2aace71589'}
	const top_100		 =    { _id: '634954e8a102ac2aace7158a'}
	const top_seller_100 =    { _id: '63495554a102ac2aace7158d'}
	const top_seller_1k  =    { _id: '6349556ea102ac2aace7158e'}
	const top_seller_10k =    { _id: '63495661a102ac2aace7158f'}
	const stars  		 =    { _id: '63495544a102ac2aace7158c'}
	const fraud  		 =    { _id: '6349552aa102ac2aace7158b'}
	const newbie		 =    { _id: '6349568da102ac2aace71590'}
	const admin 		 =    { _id: '6349569da102ac2aace71591'}
	const official       =    { _id: '634956b7a102ac2aace71592'}

	// clear badge
	for (let i = 0 ; i < user.length ; i++){
		user[i].badge.length = 0 ;
	}
	
	// admin 
	for (let i = 0 ; i < user.length ; i++){
		
		if (user[i].userStatus === "admin") {
			user[i].badge.push(admin)
			user[i].save();
		}
	}
	

	// top_10 top_100
	successAuctioned.sort((a,b) => {
		return b.totalAuctioned - a.totalAuctioned
	})

	let topSuccess = successAuctioned;
	let topSuccess100 = [];

	
	// collect  top successAuctioned by user_id 
	for (let i = 0 ; i < topSuccess.length ; i++){
		if(i < 100){
			topSuccess100.push(topSuccess[i]._id)
		}
	}

	// assign badge 
	for (let i = 0 ; i < 100 ; i++ ){
		let assignBadge = await User.findById({_id : `${topSuccess100[i]}`}) 
		if (i < 10){
			assignBadge.badge.push(top_10);
		}
		else {
			assignBadge.badge.push(top_100);
		}
		assignBadge.save();
	}

	// top_seller_100 top_seller_1k top_seller_10k 
	totalAuctioned.sort((a, b) => {
		return b.totalAuctioned - a.totalAuctioned
	})
	
	let topSeller =  totalAuctioned
	let topSeller100 = [];

	// collect top totalAuctioned  by user_id
	for(let i = 0 ; i < topSeller.length ; i++){
		topSeller100.push(topSeller[i]._id)
	}
	
	// assignBadge
	for(let i = 0 ; i<topSeller.length ; i++){
		let assignBadge = await User.findById({_id : `${topSeller100[i]}`}) 
		if (assignBadge.totalAuctioned >= 10000) {
			assignBadge.badge.push(top_seller_10k)
		}
		else if (assignBadge.totalAuctioned >= 1000){
			assignBadge.badge.push(top_seller_1k)
		}
		else {
			assignBadge.badge.push(top_seller_100)
		}
		assignBadge.save();
	}

	
	// star
	topRating.sort((a,b) => {
		return b.starRating - a.starRating 
	})
	let topStar = topRating ;
	let topStar4 = [];

	// collection top Star by User _id 
	for(let i = 0 ; i < topStar.length ; i++){
		topStar4.push(topStar[i]._id)
	}

	// assignBadge
	for(let i = 0 ; i < topStar4.length ; i++){
		let assignBadge = await User.findById({_id : `${topStar4[i]}`}) 
		if (assignBadge.rating >= 4){
			assignBadge.badge.push(star)
		}
		assignBadge.save();
	}

	// fraud    totalAuctioned , successAuctioned , rating 
	// assignBadge
	for(let i = 0 ; i < user.length ; i++){
		const checkFraud  = auctionController.fraudCalculator( user[i].totalAuctioned , user[i].successAuctioned , user[i].rating); 
		if (checkFruad){
			let assignBadge = await User.findById({id : `${user[i]._id}`})
			assignBadge.badge.push(fraud)
		} 
		assignBadge.save();

	} 
	
	// newbie 
	for (let i = 0 ; i < user.length ; i++){
		if (user[i].badge.length === 0 ){
			user[i].badge.push(newbie)
		}
		user[i].save();
	}
});


