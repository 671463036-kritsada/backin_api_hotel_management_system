const db = require("../config/db");

/**
 * Query ดิบ: ดึง feedback ทั้งหมด เรียงจากล่าสุดไปเก่าสุด
 * format created_at เป็น string ตั้งแต่ระดับ SQL เพื่อไม่ให้เกิดปัญหา
 * timezone shift ตอนแปลงผ่าน JS Date object (เจอปัญหานี้มาแล้วใน report)
 */
async function getFeedbacks() {
  const sql = `
    SELECT
      id,
      booking_id,
      user_id,
      customer_name,
      rating,
      comment,
      DATE_FORMAT(created_at, '%Y-%m-%d') AS date
    FROM feedbacks
    ORDER BY created_at DESC
  `;
  const [rows] = await db.query(sql);
  return rows;
}

module.exports = {
  getFeedbacks,
};