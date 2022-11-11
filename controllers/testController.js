
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const User = require('./../models/userModel');
const Auction = require('./../controllers/auctionController');

exports.showBadge = catchAsync(async (req,res,next) => {

	const user = await User.find().select("badge");
	console.log(user);

	for (let i = 0 ; i <  user.length ; i++ ){
		//console.log(user[i]);
	}

 	res.status(200).json({
 	   status: "success",
  });
});

exports.clearBadge = catchAsync(async (req,res,next) => {
	const user = await  User.find();
	for (let i = 0 ; i <  user.length ; i++ ){
		user[i].badge = [] ;
		user[i].save();
	}
 	res.status(200).json({
 	   status: "success",
  });
})

exports.topBadge = catchAsync(async (req,res,next) => {
  	const top_10 = { _id: "634954a6a102ac2aace71589" };
  	const top_100 = { _id: "634954e8a102ac2aace7158a" };
  	const newbie = { _id: "6349568da102ac2aace71590" };
		const auction = await  User.find().select("successAuctioned").select("_id").select("badge");
	auction.sort((a,b)=>{
		return b.successAuctioned - a.successAuctioned ;
	});
		for (let i = 0 ; i <  auction.length ; i++ ){

			if ( i <= 10 ){
				auction[i].badge.push(top_10);
			}
			else if (i<=100) {
				auction[i].badge.push(top_100);
			}
			else if (auction[i].badge.length === 0){
				auction[i].badge.push(newbie);
			}
			auction[i].save();
		}

	//let totalSuccesstioned = 0 ;

	//for (let i = 0 ; i <  auction.length ; i++ ){
		//console.log(auction[i].badge)
		//totalSuccesstioned += auction[i].successAuctioned ;
		//console.log(auction[i].successAuctioned)
	//}
	 res.status(200).json({
		status: "success",
  });
})

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


 	const userId = '6346b53b25021f041c285c98';
 	const user = await User.findById(userId); 
	console.log(user.userStatus);

 	 // clear Badge
 	 user.badge = [];
 	   
 	 // assign Badge


 	 // admin
 	 if (user.userStatus === "admin"){
 	     user.badge.push(admin)
 	 } 

 	 // fruad 
 	 const checkFraud = false ;
	if (user.totalAuctioned > 5 && (user.successAuctioned < user.totalAuctioned / 2 || user.rating < 2)){
		checkFraud = true ;
	} 	   
		if (checkFraud){
 	   	user.badge.push(fraud);
 	 }

	// stars
	if (user.rating >= 4 ){
		user.badge.push(stars)
	}

	// top seller
	if (user.totalAuctioned >= 10000){
		user.badge.push(top_seller_10k);
	}else if (user.totalAuctioned >= 1000){
		user.badge.push(top_seller_1k);
	}else if (user.totalAuctioned >= 100){
		user.badge.push(top_seller_100);
	}
 	
	// top
	//const auction = await  User.find().select("successAuctioned").select("_id").select("badge");
	//for (let i = 0 ; i <  auction.length ; i++ ){

		//if ( i <= 10 ){
			//auction[i].badge.push(top_10);
		//}
		//else {
			//auction[i].badge.push(top_100);
		//}
		//if (auction[i].badge === 0){
			//auction[i].badge.push(newbie);
		//}
		//auction[i].save();
	//}


 	 // newbie
	 //if (user.badge.length === 0 ){
			//user.badge.push(newbie);
	  //}
 	  
	
 	 // save 
 	 user.save();
 	 // #####################################
 	 res.status(200).json({
 	   status: "success",
  });
});


exports.getBadgeForAllUser = catchAsync(async (req, res, next) => {

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

	const allUser = await User.find().select("_id");
	//const array_id = []
	//for (let i = 0 ; i < allUser.length ; i++ ){
		////console.log(allUser[i])
		////console.log(allUser[i]._id)
		//array_id.push(allUser[i]._id);
	//}

	const auction = await  User.find().select("successAuctioned").select("_id").select("badge");
	auction.sort((a,b)=>{
		return b.successAuctioned - a.successAuctioned ;
	})
	for (let i = 0 ; i <  auction.length ; i++ ){
		auction[i].badge = [] ;
		if ( i <= 10 ){
			auction[i].badge.push(top_10);
		}
		else if ( i<=100 ) {
			auction[i].badge.push(top_100);
		}
		//if (auction[i].badge === 0){
			//auction[i].badge.push(newbie);
		//}
		auction[i].save();
	}

	for(let i = 0 ; i < allUser.length ; i++) {
	//for ( let i  = 0 ; i < array_id.length ; i++  ){
		const userId = allUser[i];
		const user = await User.findById(userId); 
		   
		 if (user.userStatus === "admin"){
			 user.badge.push(admin)
		 } 

		 let checkFraud = false ;
		if (user.totalAuctioned > 5 && (user.successAuctioned < user.totalAuctioned / 2 || user.rating < 2)){
			checkFraud = true ;
		} 	   
			if (checkFraud){
			user.badge.push(fraud);
		 }

		if (user.rating >= 4 ){
			user.badge.push(stars)
		}

		if (user.totalAuctioned >= 10000){
			user.badge.push(top_seller_10k);
		}else if (user.totalAuctioned >= 1000){
			user.badge.push(top_seller_1k);
		}else if (user.totalAuctioned >= 100){
			user.badge.push(top_seller_100);
		}
		

		  //newbie
		 if (user.badge.length === 0 ){
				user.badge.push(newbie);
		  }
		  
		
		 // save 
		 user.save();
	}
		// top
		 // #####################################
		 res.status(200).json({
		   status: "success",
	  });
});


exports.testBadge = catchAsync(async(req,res,next)=>{
	const allUser = await User.find().select("_id");
	console.log(allUser.length);
	for(let i = 0 ; i < allUser.length ; i++ ){
		console.log(allUser[i]._id);
	}

 	res.status(200).json({
		status: "success",
    });
});
