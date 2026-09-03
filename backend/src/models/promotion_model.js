const db = require("../config/db");
const fs = require("fs");
const path = require("path");

const { toMySQLDateTime } = require("../utils/date_helper");

const UPLOAD_BASE = path.join(__dirname, "..", "uploads", "imageData");

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

function savePromotionImage(file) {
  const dir = path.join(UPLOAD_BASE, "promotionsImage");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `promotion_${Date.now()}${ext}`;
  const fullPath = path.join(dir, filename);

  fs.writeFileSync(fullPath, file.buffer);
  return `imageData/promotionsImage/${filename}`;
}

function deletePromotionImage(relativePath) {
  if (!relativePath || !relativePath.startsWith("imageData/")) return;
  const fullPath = path.join(__dirname, "..", "uploads", relativePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("deletePromotionImage error:", err.message);
    }
  });
}

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

// ==========================================
// ADMIN: ดึงโปรโมชั่นทั้งหมด (รวมที่ปิด/หมดอายุ)
// ==========================================
async function getAllPromotionsAdmin() {
  const [rows] = await db.query(
    `SELECT id, code, title, description, image_url, discount_type, discount_value,
            min_booking_amount, max_discount_amount, usage_limit, used_count,
            start_date, end_date, is_active, created_at
     FROM promotions
     ORDER BY created_at DESC`,
  );
  return rows;
}

// ==========================================
// CREATE
// ==========================================
async function createPromotion(data, file) {
  const {
    code,
    title,
    description,
    discountType,
    discountValue,
    minBookingAmount,
    maxDiscountAmount,
    usageLimit,
    startDate,
    endDate,
  } = data;

  let imageUrl = null;
  if (file) {
    imageUrl = savePromotionImage(file);
  }

  const [result] = await db.execute(
    `INSERT INTO promotions
      (code, title, description, image_url, discount_type, discount_value,
       min_booking_amount, max_discount_amount, usage_limit, used_count,
       start_date, end_date, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW())`,
    [
      code,
      title,
      description ?? null,
      imageUrl,
      discountType,
      discountValue,
      minBookingAmount ?? null,
      maxDiscountAmount ?? null,
      usageLimit ?? null,
      toMySQLDateTime(startDate), // แก้: แปลง format ก่อน insert
      toMySQLDateTime(endDate), // แก้: แปลง format ก่อน insert
      data.isActive !== undefined ? Number(data.isActive) : 1,
    ],
  );

  return result.insertId;
}
// ==========================================
// UPDATE
// ==========================================
async function updatePromotion(id, data, file) {
  const fields = [];
  const params = [];

  const fieldMap = {
    code: "code",
    title: "title",
    description: "description",
    discountType: "discount_type",
    discountValue: "discount_value",
    minBookingAmount: "min_booking_amount",
    maxDiscountAmount: "max_discount_amount",
    usageLimit: "usage_limit",
    startDate: "start_date",
    endDate: "end_date",
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      fields.push(`${column} = ?`);
      // แก้: แปลง format เฉพาะ 2 field วันที่นี้ ก่อนใส่เข้า params
      if (key === "startDate" || key === "endDate") {
        params.push(toMySQLDateTime(data[key]));
      } else {
        params.push(data[key]);
      }
    }
  }

  if (data.isActive !== undefined) {
    fields.push("is_active = ?");
    params.push(Number(data.isActive));
  }

  if (file) {
    const current = await getPromotionById(id);
    if (current) deletePromotionImage(current.image_url);
    const newImageUrl = savePromotionImage(file);
    fields.push("image_url = ?");
    params.push(newImageUrl);
  }

  if (fields.length === 0) return { affectedRows: 0 };

  params.push(id);
  const [result] = await db.execute(
    `UPDATE promotions SET ${fields.join(", ")} WHERE id = ?`,
    params,
  );
  return result;
}

// ==========================================
// DELETE
// ==========================================
async function deletePromotion(id) {
  const current = await getPromotionById(id);
  if (!current) return { affectedRows: 0 };

  const [result] = await db.execute(`DELETE FROM promotions WHERE id = ?`, [
    id,
  ]);
  if (result.affectedRows > 0) {
    deletePromotionImage(current.image_url);
  }
  return result;
}

// ...ฟังก์ชันเดิมทั้งหมดที่มีอยู่แล้ว (getActivePromotions, getPromotionById, hasUserClaimed,
// claimPromotion, getUserCoupons, getUserPromotionById, markCouponUsed, grantPromotionToUser)
// ไม่ต้องแก้ ให้เก็บไว้เหมือนเดิม
module.exports = {
  buildResponse,
  getActivePromotions,
  getAllPromotionsAdmin, // เพิ่ม
  getPromotionById,
  hasUserClaimed,
  claimPromotion,
  getUserCoupons,
  getUserPromotionById,
  markCouponUsed,
  grantPromotionToUser,
  createPromotion, // เพิ่ม
  updatePromotion, // เพิ่ม
  deletePromotion, // เพิ่ม
};
