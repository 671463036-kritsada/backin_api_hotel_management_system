const bookingModel = require("../models/booking_model");
const checkinModel = require("../models/checkin_model");

async function autoCheckoutExpiredBookings() {
  const expiredBookings = await bookingModel.getExpiredCheckedInBookings();

  if (expiredBookings.length === 0) {
    return { processed: 0, results: [] };
  }

  const results = [];

  for (const booking of expiredBookings) {
    try {
      // 1. อัปเดต bookings table (เหมือนกับตอน user กด checkout เอง)
      await bookingModel.updateCheckOutStatus(booking.id, "CHECKED_OUT");

      // 2. sync ไปที่ checkins table ด้วย (ตาม pattern เดิมที่ทำไว้ตอน checkout ปกติ)
      const checkin = await checkinModel.getCheckInByBookingId(booking.id);
      if (checkin) {
        await checkinModel.checkOutCheckin(checkin.id);
      }

      results.push({ bookingId: booking.id, success: true });
      console.log(`[auto-checkout] booking ${booking.id} checked out automatically`);
    } catch (err) {
      results.push({ bookingId: booking.id, success: false, error: err.message });
      console.error(`[auto-checkout] failed for booking ${booking.id}:`, err.message);
    }
  }

  return { processed: results.length, results };
}

module.exports = { autoCheckoutExpiredBookings };