
const bookingService = require("../services/booking_service");


exports.getPendingBookings = async (req, res) => {
  try {
    const result = await bookingService.getPendingBookings();
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "get pending bookings failed", error: error.message });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const customerName = req.user.name;

    // ถ้ามีไฟล์แนบ (จาก multer) แปลงเป็น path ที่เก็บใน DB
    const slipPath = req.file
      ? `uploads/bookings/${req.file.filename}`
      : (req.body.slip_url || req.body.slipUrl || null);

    const data = { ...req.body, slip_url: slipPath };

    const result = await bookingService.createBooking(userId, customerName, data);
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
    const userId = req.user.id;
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
  try {
    const bookingId = req.params.id;
    const result = await bookingService.checkIn(bookingId, req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "check-in failed", error: error.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const result = status
      ? await bookingService.checkOut(bookingId, status)
      : await bookingService.checkOut(bookingId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "check-out failed", error: error.message });
  }
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


