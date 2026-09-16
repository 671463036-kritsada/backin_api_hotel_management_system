const express = require("express");
const controller = require("../controllers/houskeeper_issues_controller");
const {
  authMiddleware,
  isUserOrHousekeeper,
} = require("../middleware/auth_middleware");
const uploadImage = require("../middleware/upload_room_image"); // ใช้ตัวเดิมร่วมกัน

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  isUserOrHousekeeper,
  uploadImage.array("images", 5), // รับได้สูงสุด 5 รูปต่อการแจ้งชำรุดหนึ่งครั้ง
  controller.createIssue
);

router.get("/", authMiddleware, controller.getIssues);
router.get("/:id", authMiddleware, controller.getIssueById);

module.exports = router;