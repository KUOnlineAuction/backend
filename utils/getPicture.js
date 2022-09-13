const fs = require('fs');
const path = require('path');
const AppError = require("./../utils/appError")
const catchAsync = require('./../utils/catchAsync');
const { promisify } = require('util')

const readFile = promisify(fs.readFile);

const getPicture = async(folder, filename) => {
    picturePath = path.join(__dirname, '..', 'picture', folder, filename)
    pictureContent = await readFile(picturePath, 'base64')
    return pictureContent
}

module.exports = getPicture