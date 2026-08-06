const bookingModel = require("../models/booking_model");

async function createBooking(userId, customerName, data) {
  data.user_id = userId;
  data.customer_name = customerName;

  const result = await bookingModel.createBooking(data);

  if (result && result.insertId) {
    const booking = await bookingModel.getBookingById(result.insertId);
    return {
      success: true,
      data: booking,
    };
  }

  return {
    success: false,
    message: "create failed",
  };
}

async function getBookings() {
  const data = await bookingModel.getBookings();
  return { success: true, data };
}

async function getMyBookings(userId) {
  const data = await bookingModel.getBookingsByUserId(userId);
  return { success: true, data };
}

async function getBookingById(id) {
  const data = await bookingModel.getBookingById(id);
  if (!data) return { success: false, message: "booking not found" };
  return { success: true, data };
}

async function updateBooking(id, data) {
  const result = await bookingModel.updateBooking(id, data);
  if (result.affectedRows === 0)
    return { success: false, message: "booking not found" };
  const booking = await bookingModel.getBookingById(id);
  return { success: true, data: booking };
}

async function deleteBooking(id) {
  const result = await bookingModel.deleteBooking(id);
  if (result.affectedRows === 0)
    return { success: false, message: "booking not found" };
  return { success: true, data: { id } };
}

module.exports = {
  createBooking,
  getBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
