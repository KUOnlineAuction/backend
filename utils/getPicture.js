const fs = require("fs");
const path = require("path");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const { promisify } = require("util");
const sharp = require("sharp");

const readFile = promisify(fs.readFile);

const getPicture = async (folder, filename, width = 1000, height = 1000) => {
  picturePath = path.join(__dirname, "..", "picture", folder, filename);
  const pictureContentBuffer = await readFile(picturePath);
  const pictureContent = await sharp(pictureContentBuffer)
    .resize(width, height)
    .toBuffer();
  const base64pictureContent = pictureContent.toString(`base64`);
  return `data:image/jpeg;base64,${base64pictureContent}`;
};

const savePicture = async (
  base64Image,
  folder,
  filename,
  width = 1000,
  height = 1000,
  quality = 80
) => {
  const img = base64Image.replace(/(.*,)?/, "");
  const imageBuffer = Buffer.from(img, "base64");
  const filePath = path.join(__dirname, "..", "picture", folder, filename);
  await sharp(imageBuffer)
    .resize(width, height)
    .toFormat("jpeg")
    .jpeg({ quality: quality })
    .toFile(filePath);
};

module.exports = { getPicture, savePicture };
