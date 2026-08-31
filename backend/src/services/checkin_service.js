const fs = require("fs");
const checkinModel = require("../models/checkin_model");
const bookingModel = require("../models/booking_model");
const promotionService = require("../services/promotion_service");

const { generateRoomKey } = require("../utils/room_key_generator");

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

async function createCheckIn(data, userId) {
  try {
    const bookingId = data.bookingId || data.booking_id;
    if (!bookingId) {
      return buildResponse(null, "กรุณาระบุ bookingId", 400);
    }

    const booking = await bookingModel.getBookingById(bookingId);
    if (!booking) {
      return buildResponse(null, "ไม่พบข้อมูลการจอง", 404);
    }

    const baseAmount = Number(booking.remaining_amount) || 0;
    let discountAmount = 0;
    let userPromotionId =
      data.userPromotionId || data.user_promotion_id || null;
    let promotionId = null;

    if (userPromotionId) {
      const couponResult = await promotionService.validateAndCalculateDiscount(
        userPromotionId,
        userId,
        baseAmount,
      );
      if (!couponResult.valid) {
        return buildResponse(null, couponResult.message, 400);
      }
      discountAmount = couponResult.discountAmount;
      promotionId = couponResult.promotionId;
    }

    const amountPaid = Math.max(baseAmount - discountAmount, 0);

    const checkinData = {
      ...data,
      bookingId,
      userPromotionId,
      discountAmount,
      amountPaid,
    };

    const result = await checkinModel.createCheckIn(checkinData);

    // await bookingModel.updateCheckInStatus(bookingId, data);

    if (data.paymentStatus || data.payment_status) {
      await bookingModel.updateBooking(bookingId, {
        payment_status: data.paymentStatus || data.payment_status || "PAID",
      });
    }

    if (userPromotionId) {
      await promotionService.markCouponUsed(
        userPromotionId,
        promotionId,
        bookingId,
      );
    }

    const checkin = await checkinModel.getCheckInById(result.insertId);
    return buildResponse(checkin, "checkin created", 201);
  } catch (err) {
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

async function getPendingCheckins() {
  const data = await checkinModel.getPendingCheckins();
  return buildResponse(data);
}

async function approveCheckin(id) {
  const checkin = await checkinModel.getCheckInById(id);
  if (!checkin) return buildResponse(null, "ไม่พบรายการเช็คอิน", 404);

  const roomKey = generateRoomKey();

  await checkinModel.updateCheckinStatus(id, "checked_in");

  if (checkin.booking_id) {
    await bookingModel.updateCheckInStatus(checkin.booking_id, { room_key: roomKey });
  }

  const updated = await checkinModel.getCheckInById(id);
  return buildResponse(updated, "checkin approved");
}

async function rejectCheckin(id, reason) {
  const checkin = await checkinModel.getCheckInById(id);
  if (!checkin) return buildResponse(null, "ไม่พบรายการเช็คอิน", 404);

  await checkinModel.updateCheckinStatus(id, "rejected");
  const updated = await checkinModel.getCheckInById(id);
  return buildResponse(updated, "checkin rejected");
}

module.exports = {
  createCheckIn,
  getCheckIns: async () => buildResponse(await checkinModel.getCheckIns()),
  getPendingCheckins,
  approveCheckin,
  rejectCheckin,
  getCheckInById: async (id) => {
    const data = await checkinModel.getCheckInById(id);
    if (!data) return buildResponse(null, "checkin not found", 404);
    return buildResponse(data);
  },
};
