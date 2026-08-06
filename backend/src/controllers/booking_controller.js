const bookingService = require("../services/booking_service");

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const customerName = req.user.name;

    const result = await bookingService.createBooking(
      userId,
      customerName,
      req.body,
    );

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({
      message: "create booking failed",
      error: error.message,
    });
  }
};

exports.getBookings = async (req, res) => {
  try {
    const result = await bookingService.getBookings();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "getBookings failed",
      error: error.message,
    });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id; // มาจาก JWT ที่ authMiddleware decode ไว้ ไม่ใช่จาก req.params/req.query
    const result = await bookingService.getMyBookings(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "getMyBookings failed",
      error: error.message,
    });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const result = await bookingService.getBookingById(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "getBookingById failed",
      error: error.message,
    });
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, req.body);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "updateBooking failed", error: error.message });
  }
};

exports.deleteBooking = async (req, res) => {
  try {
    const result = await bookingService.deleteBooking(req.params.id);
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res
      .status(500)
      .json({ message: "deleteBooking failed", error: error.message });
  }
};



exports.checkIn = async (req, res) => {
    const bookingId = req.params.id;

    const result = await bookingService.checkIn(
        bookingId,
        req.body
    );

    res.json(result);
};



// Admin shortcuts
exports.approveBooking = async (req, res) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, {
      status: "APPROVED",
    });
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "approve failed", error: error.message });
  }
};

exports.rejectBooking = async (req, res) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, {
      status: "REJECTED",
    });
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "reject failed", error: error.message });
  }
};

exports.markCheckedIn = async (req, res) => {
  try {
    const result = await bookingService.updateBooking(req.params.id, {
      check_in_status: "CHECKED_IN",
    });
    if (!result.success) return res.status(404).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "check-in failed", error: error.message });
  }
};
