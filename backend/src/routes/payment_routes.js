const express = require("express");
const paymentController = require("../controllers/payment_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const router = express.Router();

router.post(
  "/promptpay-qr/booking-cart",
  authMiddleware,
  paymentController.getBookingCartPromptPayQr,
);
router.post(
  "/promptpay-qr/checkin",
  authMiddleware,
  paymentController.getCheckinPromptPayQr,
);

module.exports = router;
