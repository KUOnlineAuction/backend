const mongoose = require("mongoose");


const totalSuccessAuctionedSchema = new mongoose.Schema({
	totalSuccessAuctioned : {
		type : Int 
	}
})

const TotalSuccessAuctioned = mongoose.model("totalSuccessAuctioned")
module.exports =  TotalSuccessAuctioned ;
