const express = require("express");
const checkinController = require("../controllers/checkin_controller");
const createUpload = require("../middleware/upload_middleware");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");
const router = express.Router();
const upload = createUpload("uploads/checkins");

router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "idCardImage", maxCount: 1 },
    { name: "paymentSlipImage", maxCount: 1 },
  ]),
  checkinController.createCheckIn,
);

// ต้องอยู่ก่อน "/:id" ไม่งั้น Express จะจับ "pending" เป็น :id
router.get("/pending", authMiddleware, isAdmin, checkinController.getPendingCheckins);
router.patch("/:id/approve", authMiddleware, isAdmin, checkinController.approveCheckin);
router.patch("/:id/reject", authMiddleware, isAdmin, checkinController.rejectCheckin);

router.get("/", checkinController.getCheckIns);
router.get("/:id", checkinController.getCheckInById);

module.exports = router;