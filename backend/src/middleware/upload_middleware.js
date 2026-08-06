const multer = require("multer");
const path = require("path");
const fs = require("fs");

const createUpload = (folder = "uploads", allowVideo = false) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = `src/${folder}/`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      // ใช้ field name ของไฟล์ (เช่น "idCardImage") แทน folder path
      // และแทนที่ "/" ด้วย "_" กันไว้อีกชั้น เผื่อ folder ยังมี "/" อยู่
      const safePrefix = file.fieldname || folder.replace(/\//g, "_");
      cb(null, `${safePrefix}_${Date.now()}${ext}`);
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedImage = [".jpg", ".jpeg", ".png", ".webp"];
    const allowedVideo = [".mp4", ".webm", ".mov", ".ogg"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = allowVideo
      ? [...allowedImage, ...allowedVideo]
      : allowedImage;
    if (allowed.includes(ext)) cb(null, true);
    else
      cb(
        new Error(
          allowVideo
            ? "ไฟล์ต้องเป็น jpg, jpeg, png, webp, mp4, webm, mov, ogg เท่านั้น"
            : "ไฟล์ต้องเป็น jpg, jpeg, png, webp เท่านั้น",
        ),
      );
  };

  const limit = allowVideo
    ? { fileSize: 200 * 1024 * 1024 }
    : { fileSize: 5 * 1024 * 1024 };

  return multer({ storage, fileFilter, limits: limit });
};

module.exports = createUpload;