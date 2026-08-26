const multer = require("multer");
const path = require("path");

const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExt.includes(ext)) cb(null, true);
  else cb(new Error("ไฟล์ต้องเป็น jpg, jpeg, png, webp เท่านั้น"));
};

const uploadRoomImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = uploadRoomImage;