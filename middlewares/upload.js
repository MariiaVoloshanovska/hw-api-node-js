const multer = require("multer");
const path = require("path");

const destination = path.resolve("temp");

const storage = multer.diskStorage({
  destination,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + uniqueSuffix);
  },
});

const limits = {
  fileSize: 1024 * 1024 * 15,
};

const upload = multer({
  storage,
  limits,
});

module.exports = upload;
