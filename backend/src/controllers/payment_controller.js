const { createPromptPayPayload } = require("../utils/promptpay_qr");
const bookingModel = require("../models/booking_model");
const promotionService = require("../services/promotion_service");

function buildQrResponse(res, amount) {
  const promptPayId = process.env.PROMPTPAY_ID;
  if (!promptPayId) {
    return res.status(500).json({
      success: false,
      message: "ยังไม่ได้ตั้งค่า PROMPTPAY_ID ใน backend .env",
    });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "จำนวนเงินไม่ถูกต้อง",
    });
  }
  const qrPayload = createPromptPayPayload(promptPayId, amount);
  return res.status(200).json({ success: true, qrPayload, amount });
}

// สร้าง QR สำหรับมัดจำตะกร้าจองห้องพัก (ก่อนสร้าง booking จริง)
// คำนวณราคาจากห้อง/เตียงเสริมใน DB เอง ไม่เชื่อยอดที่ client ส่งมา
exports.getBookingCartPromptPayQr = async (req, res) => {
  try {
    const items = req.body?.items;
    const { depositAmount } = await bookingModel.calculateCartTotal(items);
    return buildQrResponse(res, depositAmount);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "สร้าง QR code ไม่สำเร็จ",
    });
  }
};

// สร้าง QR สำหรับยอดที่ต้องชำระตอนเช็คอิน (คำนวณจาก booking + คูปองใน DB เอง)
exports.getCheckinPromptPayQr = async (req, res) => {
  try {
    const bookingId = req.body?.bookingId || req.query.bookingId;
    const userPromotionId =
      req.body?.userPromotionId || req.query.userPromotionId || null;

    if (!bookingId) {
      return res
        .status(400)
        .json({ success: false, message: "กรุณาระบุ bookingId" });
    }

    const booking = await bookingModel.getBookingById(bookingId);
    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "ไม่พบข้อมูลการจอง" });
    }
    // กันไม่ให้ user คนอื่นดูยอด/ขอ QR ของ booking ที่ไม่ใช่ของตัวเอง
    if (String(booking.user_id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const baseAmount = Number(booking.remaining_amount) || 0;
    const couponResult = await promotionService.resolveAmountDue(
      userPromotionId,
      req.user.id,
      baseAmount,
    );
    if (!couponResult.valid) {
      return res
        .status(400)
        .json({ success: false, message: couponResult.message });
    }

    return buildQrResponse(res, couponResult.amountDue);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "สร้าง QR code ไม่สำเร็จ",
    });
  }
};
