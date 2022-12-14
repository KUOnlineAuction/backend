const mongoose = require('mongoose');
// const validator = require('validator');

const badgeSchema = new mongoose.Schema({
    badgeName: {
        type: String,
        required: [true, 'A badge must has a name.']
    }
})

const Badge = mongoose.model('Badge', badgeSchema)

module.exports = Badge
