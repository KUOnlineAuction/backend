const mongoose = require('mongoose');
// const validator = require('validator');

// TODO: Test collecting data using objectID and in a list first to do this.
const userSchema = new mongoose.Schema({

})

const User = mongoose.model('User', userSchema)

module.exports = User