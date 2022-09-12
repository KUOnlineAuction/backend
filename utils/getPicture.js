const fs = require('fs');
const path = require('path');
const AppError = require("./../utils/appError")
const catchAsync = require('./../utils/catchAsync');
const { promisify } = require('util')

const readFile = promisify(fs.readFile);

const getPicture = async(folder, filename) => {
    picturePath = path.join(__dirname, '..', 'picture', folder, filename)
    pictureContent = await readFile(picturePath, 'base64').catch(err => {return undefined})
    // Add an (couldn't load picture) default image?
    return pictureContent
}

module.exports = getPicture