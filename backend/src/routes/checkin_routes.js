const express = require("express");
const checkinController = require("../controllers/checkin_controller");
const createUpload = require("../middleware/upload_middleware");

const router = express.Router();
const upload = createUpload("uploads/checkins");

router.post(
  "/",
  upload.fields([
    { name: "idCardImage", maxCount: 1 },
    { name: "paymentSlipImage", maxCount: 1 },
  ]),
  checkinController.createCheckIn,
);
router.get("/", checkinController.getCheckIns);
router.get("/:id", checkinController.getCheckInById);

module.exports = router;