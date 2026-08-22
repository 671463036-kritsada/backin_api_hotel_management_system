const promotionModel = require("../models/promotion_model");

async function getActivePromotions() {
  const data = await promotionModel.getActivePromotions();
  return promotionModel.buildResponse(data);
}

async function getPromotionById(id) {
  const data = await promotionModel.getPromotionById(id);
  if (!data) {
    return promotionModel.buildResponse(null, "promotion not found", 404);
  }
  return promotionModel.buildResponse(data);
}

// user กดรับคูปอง
async function claimPromotion(userId, promotionId) {
  const promotion = await promotionModel.getPromotionById(promotionId);
  if (!promotion) {
    return promotionModel.buildResponse(null, "promotion not found", 404);
  }

  if (!promotion.is_active) {
    return promotionModel.buildResponse(null, "โปรโมชั่นนี้ปิดใช้งานแล้ว", 400);
  }

  const now = new Date();
  if (new Date(promotion.start_date) > now) {
    return promotionModel.buildResponse(null, "โปรโมชั่นนี้ยังไม่เริ่ม", 400);
  }
  if (new Date(promotion.end_date) < now) {
    return promotionModel.buildResponse(null, "โปรโมชั่นนี้หมดอายุแล้ว", 400);
  }

  if (
    promotion.usage_limit != null &&
    promotion.used_count >= promotion.usage_limit
  ) {
    return promotionModel.buildResponse(
      null,
      "โปรโมชั่นนี้ถูกใช้ครบจำนวนแล้ว",
      400,
    );
  }

  const alreadyClaimed = await promotionModel.hasUserClaimed(
    userId,
    promotionId,
  );
  if (alreadyClaimed) {
    return promotionModel.buildResponse(
      null,
      "คุณได้รับคูปองนี้ไปแล้ว",
      409,
    );
  }

  const result = await promotionModel.claimPromotion(userId, promotionId);
  return promotionModel.buildResponse(
    { userPromotionId: result.insertId },
    "รับคูปองสำเร็จ",
    201,
  );
}

// ดึงคูปองที่ user ถืออยู่ (default: เฉพาะที่ยังไม่ใช้)
async function getUserCoupons(userId, status = "available") {
  const data = await promotionModel.getUserCoupons(userId, status);
  return promotionModel.buildResponse(data);
}

// คำนวณส่วนลดจากคูปอง + validate ว่าใช้ได้จริงไหม กับยอด booking ที่ระบุ
// คืน { valid, message, discountAmount, promotion } ให้ checkin_service เรียกใช้ต่อ
async function validateAndCalculateDiscount(
  userPromotionId,
  userId,
  baseAmount,
) {
  const userPromotion = await promotionModel.getUserPromotionById(
    userPromotionId,
    userId,
  );

  if (!userPromotion) {
    return { valid: false, message: "ไม่พบคูปองนี้" };
  }

  if (userPromotion.status !== "available") {
    return { valid: false, message: "คูปองนี้ถูกใช้ไปแล้วหรือหมดอายุ" };
  }

  if (!userPromotion.isActive) {
    return { valid: false, message: "โปรโมชั่นนี้ปิดใช้งานแล้ว" };
  }

  const now = new Date();
  if (new Date(userPromotion.endDate) < now) {
    return { valid: false, message: "คูปองนี้หมดอายุแล้ว" };
  }

  if (
    userPromotion.usageLimit != null &&
    userPromotion.usedCount >= userPromotion.usageLimit
  ) {
    return { valid: false, message: "โปรโมชั่นนี้ถูกใช้ครบจำนวนแล้ว" };
  }

  if (
    userPromotion.minBookingAmount &&
    baseAmount < userPromotion.minBookingAmount
  ) {
    return {
      valid: false,
      message: `ยอดขั้นต่ำสำหรับคูปองนี้คือ ${userPromotion.minBookingAmount} บาท`,
    };
  }

  let discountAmount = 0;
  if (userPromotion.discountType === "percentage") {
    discountAmount = baseAmount * (userPromotion.discountValue / 100);
    if (
      userPromotion.maxDiscountAmount &&
      discountAmount > userPromotion.maxDiscountAmount
    ) {
      discountAmount = userPromotion.maxDiscountAmount;
    }
  } else {
    // fixed
    discountAmount = userPromotion.discountValue;
  }

  if (discountAmount > baseAmount) {
    discountAmount = baseAmount;
  }

  return {
    valid: true,
    discountAmount,
    promotionId: userPromotion.promotionId,
  };
}

// เรียกหลัง checkin/booking สำเร็จแล้ว เพื่อ mark คูปองว่าถูกใช้ไปแล้ว
async function markCouponUsed(userPromotionId, promotionId, bookingId) {
  return promotionModel.markCouponUsed(userPromotionId, promotionId, bookingId);
}

// admin แจกคูปองให้ user เฉพาะราย
async function grantPromotionToUser(userId, promotionId) {
  const promotion = await promotionModel.getPromotionById(promotionId);
  if (!promotion) {
    return promotionModel.buildResponse(null, "promotion not found", 404);
  }

  const alreadyClaimed = await promotionModel.hasUserClaimed(
    userId,
    promotionId,
  );
  if (alreadyClaimed) {
    return promotionModel.buildResponse(
      null,
      "user นี้มีคูปองนี้อยู่แล้ว",
      409,
    );
  }

  const result = await promotionModel.grantPromotionToUser(
    userId,
    promotionId,
  );
  return promotionModel.buildResponse(
    { userPromotionId: result.insertId },
    "แจกคูปองสำเร็จ",
    201,
  );
}

module.exports = {
  getActivePromotions,
  getPromotionById,
  claimPromotion,
  getUserCoupons,
  validateAndCalculateDiscount,
  markCouponUsed,
  grantPromotionToUser,
};