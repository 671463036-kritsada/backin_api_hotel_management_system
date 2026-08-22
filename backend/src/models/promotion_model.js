const db = require("../config/db");

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

// ดึงโปรโมชั่นทั้งหมดที่ยัง active และอยู่ในช่วงเวลาที่ใช้ได้
async function getActivePromotions() {
  const [rows] = await db.query(
    `SELECT id, code, title, description, image_url, discount_type, discount_value,
            min_booking_amount, max_discount_amount, usage_limit, used_count,
            start_date, end_date, is_active, created_at
     FROM promotions
     WHERE is_active = 1
       AND start_date <= NOW()
       AND end_date >= NOW()
     ORDER BY created_at DESC`,
  );
  return rows;
}

async function getPromotionById(id) {
  const [rows] = await db.query(
    `SELECT id, code, title, description, image_url, discount_type, discount_value,
            min_booking_amount, max_discount_amount, usage_limit, used_count,
            start_date, end_date, is_active, created_at
     FROM promotions
     WHERE id = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

// เช็คว่า user เคยรับโปรโมชั่นนี้ไปแล้วหรือยัง (กันรับซ้ำ)
async function hasUserClaimed(userId, promotionId) {
  const [rows] = await db.query(
    `SELECT id FROM user_promotions WHERE user_id = ? AND promotion_id = ? LIMIT 1`,
    [userId, promotionId],
  );
  return rows.length > 0;
}

// user กดรับคูปอง -> insert เข้า user_promotions
async function claimPromotion(userId, promotionId) {
  const [result] = await db.execute(
    `INSERT INTO user_promotions (user_id, promotion_id, status, received_at)
     VALUES (?, ?, 'available', NOW())`,
    [userId, promotionId],
  );
  return { insertId: result.insertId };
}

// ดึงคูปองที่ user ถืออยู่ (join กับรายละเอียดโปรโมชั่น)
async function getUserCoupons(userId, status = "available") {
  const [rows] = await db.query(
    `SELECT
        up.id AS userPromotionId,
        up.status,
        up.received_at AS receivedAt,
        up.used_at AS usedAt,
        up.booking_id AS bookingId,
        p.id AS promotionId,
        p.code,
        p.title,
        p.description,
        p.discount_type AS discountType,
        p.discount_value AS discountValue,
        p.min_booking_amount AS minBookingAmount,
        p.max_discount_amount AS maxDiscountAmount,
        p.end_date AS endDate
     FROM user_promotions up
     JOIN promotions p ON p.id = up.promotion_id
     WHERE up.user_id = ?
       AND up.status = ?
     ORDER BY up.received_at DESC`,
    [userId, status],
  );
  return rows;
}

async function getUserPromotionById(userPromotionId, userId) {
  const [rows] = await db.query(
    `SELECT
        up.id AS userPromotionId,
        up.status,
        up.user_id AS userId,
        up.promotion_id AS promotionId,
        up.booking_id AS bookingId,
        p.discount_type AS discountType,
        p.discount_value AS discountValue,
        p.min_booking_amount AS minBookingAmount,
        p.max_discount_amount AS maxDiscountAmount,
        p.usage_limit AS usageLimit,
        p.used_count AS usedCount,
        p.is_active AS isActive,
        p.start_date AS startDate,
        p.end_date AS endDate
     FROM user_promotions up
     JOIN promotions p ON p.id = up.promotion_id
     WHERE up.id = ? AND up.user_id = ?
     LIMIT 1`,
    [userPromotionId, userId],
  );
  return rows[0] || null;
}

// ใช้คูปอง: mark user_promotions เป็น used + ผูก booking_id + เพิ่ม used_count ของ promotion
async function markCouponUsed(userPromotionId, promotionId, bookingId) {
  await db.execute(
    `UPDATE user_promotions
     SET status = 'used', used_at = NOW(), booking_id = ?
     WHERE id = ?`,
    [bookingId, userPromotionId],
  );
  await db.execute(
    `UPDATE promotions SET used_count = used_count + 1 WHERE id = ?`,
    [promotionId],
  );
  return true;
}

// admin แจกคูปองให้ user เฉพาะราย
async function grantPromotionToUser(userId, promotionId) {
  const [result] = await db.execute(
    `INSERT INTO user_promotions (user_id, promotion_id, status, received_at)
     VALUES (?, ?, 'available', NOW())`,
    [userId, promotionId],
  );
  return { insertId: result.insertId };
}

module.exports = {
  buildResponse,
  getActivePromotions,
  getPromotionById,
  hasUserClaimed,
  claimPromotion,
  getUserCoupons,
  getUserPromotionById,
  markCouponUsed,
  grantPromotionToUser,
};