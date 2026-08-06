const fs = require("fs");
const checkinModel = require("../models/checkin_model");
const bookingModel = require("../models/booking_model");

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

async function createCheckIn(data) {
  try {
    if (!data.bookingId && !data.booking_id) {
      return buildResponse(null, "กรุณาระบุ bookingId", 400);
    }
    const result = await checkinModel.createCheckIn(data);
    const bookingId = data.bookingId || data.booking_id;
    await bookingModel.updateCheckInStatus(bookingId);

    if (data.paymentSlipImage || data.payment_slip_image) {
      await bookingModel.updateBooking(bookingId, {
        slip_url: data.paymentSlipImage || data.payment_slip_image,
        payment_status: data.paymentStatus || data.payment_status || "PAID",
      });
    }

    const checkin = await checkinModel.getCheckInById(result.insertId);
    return buildResponse(checkin, "checkin created", 201);
  } catch (err) {
    //ลบไฟล์ที่ multer อัปโหลดไว้แล้ว ถ้า DB insert ล้มเหลว ป้องกันไฟล์กำพร้า
    const filesToCleanup = [
      data.idCardImage || data.id_card_image,
      data.paymentSlipImage || data.payment_slip_image,
    ].filter(Boolean);

    filesToCleanup.forEach((filePath) => {
      const fullPath = `src/${filePath}`;
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (unlinkErr) => {
          if (unlinkErr) console.error("cleanup failed:", unlinkErr);
        });
      }
    });

    return buildResponse(null, `createCheckIn error: ${err.message}`, 500);
  }
}

module.exports = {
  createCheckIn,
  getCheckIns: async () => buildResponse(await checkinModel.getCheckIns()),
  getCheckInById: async (id) => {
    const data = await checkinModel.getCheckInById(id);
    if (!data) return buildResponse(null, "checkin not found", 404);
    return buildResponse(data);
  },
};