const express = require("express");
const bookingController = require("../controllers/booking_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const router = express.Router();

// ต้องอยู่ก่อน "/:id" เสมอ ไม่งั้น Express จะจับ "my-bookings" เป็นค่า :id แทน
router.get("/my-bookings", authMiddleware, bookingController.getMyBookings);

router.post("/", authMiddleware, bookingController.createBooking);
router.get("/", authMiddleware, bookingController.getBookings);
router.get("/:id", authMiddleware, bookingController.getBookingById);
router.put("/:id", authMiddleware, bookingController.updateBooking);
router.delete("/:id", authMiddleware, bookingController.deleteBooking);

router.patch("/:id/checkin", authMiddleware, bookingController.checkIn);
router.patch("/:id/checkout", authMiddleware, bookingController.checkOut);

// Admin shortcuts
router.post("/:id/approve", authMiddleware, bookingController.approveBooking);
router.post("/:id/reject", authMiddleware, bookingController.rejectBooking);

module.exports = router;

// const express = require("express");
// const bookingController = require("../controllers/booking_controller");
// const { authMiddleware } = require("../middleware/auth_middleware");
// const router = express.Router();

// //ต้องอยู่ก่อน "/:id" เสมอ ไม่งั้น Express จะจับ "my-bookings" เป็นค่า :id แทน
// router.get("/my-bookings", authMiddleware, bookingController.getMyBookings);

// router.post("/",authMiddleware , bookingController.createBooking);
// router.get("/", bookingController.getBookings);
// router.get("/:id", bookingController.getBookingById);
// router.put("/:id", bookingController.updateBooking);
// router.delete("/:id", bookingController.deleteBooking);
// router.patch(
//     "/bookings/:id/checkin",
//     authMiddleware,
//     bookingController.checkIn
// );

// // Admin shortcuts
// router.post("/:id/approve", bookingController.approveBooking);
// router.post("/:id/reject", bookingController.rejectBooking);
// router.post("/:id/check-in", bookingController.markCheckedIn);

// module.exports = router;
