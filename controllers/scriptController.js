const catchAsync = require('./../utils/catchAsync');
const Auction = require('./../models/auctionModel');
const User = require('./../models/userModel');
const Badge = require('./../models/badgeModel');


exports.deleteAllUser = catchAsync(async (req, res, next) => {
    const script = await Auction.deleteMany({});

    if (!script) {
        return next(new AppError('No Data'), 404)
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});


exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.find().select('totalAuctioned').select('successAuctioned');

	
	let top = user
	
	top.sort((x,y)=> {
		return y.totalAuctioned - x.totalAuctioned;
	});

	let top100 = [];

	// add _id to top100 
	for(let i=0 ; i < 5 ;  i++){
		console.log(top[i].totalAuctioned)
		console.log(top[i]._id)
		top100.push(top[i]._id)
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

	let assignBadge = await User.findById({_id : `${top100[0]}`}) 
	// debug
	console.log(assignBadge);
	console.log(assignBadge.badge);
	
	//assignBadge.badge.push("top10");
	
	//obj id badge -->
	
	//assignBadge.save();
	
	//const user1 = await User.find().select('totalAuctioned');
	//let top1 = []
	//user1.forEach((e) => {
		//if (e.totalAuctioned >=1 ){
			//console.log(e.totalAuctioned)
		//}
	//});
	
	//for(let i = 0 ; i < top100.length ; i++ ){
		//if (i<10){
			//let userBadge = await User.findById(top100[i])
			//userBadge.badge.push("Top10")
		//}
		//else if (i<100){
			//let userBadge = await User.findByIdAndUpdate(top100[i])
			//userBadge.push("Top100")
		//}
	//}

	// ##################################################
    res.status(200).json({
        status: "success"
    })
});
