const express = require("express");
const historyController = require("../controllers/history_controller");
const { authMiddleware } = require("../middleware/auth_middleware");

const router = express.Router();

router.get("/", authMiddleware, historyController.getHistory);
router.get("/:bookingId", authMiddleware, historyController.getHistoryByBookingId);
router.post("/:bookingId/review", authMiddleware, historyController.submitReview);

module.exports = router;