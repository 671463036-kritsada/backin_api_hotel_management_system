const express = require("express");
const bookingController = require("../controllers/booking_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const createUpload = require("../middleware/upload_middleware");
const router = express.Router();

const upload = createUpload("uploads/bookings");

router.get("/my-bookings", authMiddleware, bookingController.getMyBookings);
router.get("/pending", authMiddleware, bookingController.getPendingBookings);

//upload.single("paymentSlip") คั่นกลาง
router.post(
  "/",
  authMiddleware,
  upload.single("paymentSlip"),
  bookingController.createBooking,
);

router.get("/", authMiddleware, bookingController.getBookings);
router.get("/:id", authMiddleware, bookingController.getBookingById);
router.put("/:id", authMiddleware, bookingController.updateBooking);
router.delete("/:id", authMiddleware, bookingController.deleteBooking);

router.patch("/:id/checkin", authMiddleware, bookingController.checkIn);
router.patch("/:id/checkout", authMiddleware, bookingController.checkOut);

router.post("/:id/approve", authMiddleware, bookingController.approveBooking);
router.post("/:id/reject", authMiddleware, bookingController.rejectBooking);

module.exports = router;