const express = require("express");
const bookingController = require("../controllers/booking_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const router = express.Router();

//ต้องอยู่ก่อน "/:id" เสมอ ไม่งั้น Express จะจับ "my-bookings" เป็นค่า :id แทน
router.get("/my-bookings", authMiddleware, bookingController.getMyBookings);

router.post("/",authMiddleware , bookingController.createBooking);
router.get("/", bookingController.getBookings);
router.get("/:id", bookingController.getBookingById);
router.put("/:id", bookingController.updateBooking);
router.delete("/:id", bookingController.deleteBooking);
router.patch(
    "/bookings/:id/checkin",
    authMiddleware,
    bookingController.checkIn
);

// Admin shortcuts
router.post("/:id/approve", bookingController.approveBooking);
router.post("/:id/reject", bookingController.rejectBooking);
router.post("/:id/check-in", bookingController.markCheckedIn);

module.exports = router;