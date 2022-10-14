const mongoose = require('mongoose');
// const validator = require('validator');


const enumBadge = [
	"Top 10" ,
	"Top 100",
	"Fraud" ,
	"Rising Sarts" ,
	"ยอดนักขาย",
	"ยอดนักขายชุบแป้งทอด",
	"ยอดนักขายแห่ศตวรรษที่ 21",
	"Newbie",
	"Admin",
	"Official",
]

const badgeSchema = new mongoose.Schema({
    badgeName: {
        type: String,
		enum : enumBadge , 
        //required: [true, 'A badge must has a name.']
    }
})

const Badge = mongoose.model('Badge', badgeSchema)

module.exports = Badge
