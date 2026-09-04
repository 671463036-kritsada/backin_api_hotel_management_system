const db = require("../config/db");

/**
 * Query ดิบ: รวมยอดห้องพักและรายได้ต่อวัน
 * นับเฉพาะ booking ที่จ่ายเงินแล้ว (PAID) และเข้าพักจริง (CHECKED_IN)
 *
 * ยอดรายได้ (price) = bookings.paid_amount (มัดจำตอนจอง)
 *                    + checkins.amount_paid (จ่ายจริงตอนเช็คอิน, รวมทุกครั้งถ้ามีมากกว่า 1 แถวต่อ booking)
 *
 * ใช้ subquery รวม amount_paid ต่อ booking_id ก่อน แล้วค่อย join กับ bookings
 * เพื่อไม่ให้ SUM(rooms_count) / SUM(paid_amount) ถูกนับซ้ำ ถ้า booking หนึ่งใบ
 * มีประวัติ checkin มากกว่า 1 แถว (เช่น เช็คอินซ้ำ/แก้ไขข้อมูล)
 *
 * หมายเหตุ: logic การเลือกเงื่อนไข/field วันที่ ควรปรับที่นี่เท่านั้น
 * ส่วน service layer มีหน้าที่แค่ map ผลลัพธ์ ไม่ควรมี business rule ซ้ำ
 */
async function getDailyReports({ startDate, endDate } = {}) {
  const conditions = [
    "b.check_in IS NOT NULL",
    "b.payment_status = 'PAID'",
    "b.check_in_status = 'CHECKED_IN'",
  ];
  const params = [];

  if (startDate) {
    conditions.push("b.check_in >= ?");
    params.push(startDate);
  }
  if (endDate) {
    conditions.push("b.check_in <= ?");
    params.push(endDate);
  }

  const sql = `
    SELECT
      DATE_FORMAT(b.check_in, '%Y-%m-%d') AS date,
      SUM(b.rooms_count) AS rooms,
      SUM(b.paid_amount + COALESCE(ci.checkin_paid, 0)) AS price
    FROM bookings b
    LEFT JOIN (
      SELECT booking_id, SUM(amount_paid) AS checkin_paid
      FROM checkins
      GROUP BY booking_id
    ) ci ON ci.booking_id = b.id
    WHERE ${conditions.join(" AND ")}
    GROUP BY DATE(b.check_in)
    ORDER BY DATE(b.check_in) ASC
  `;

  const [rows] = await db.query(sql, params);
  return rows;
}

module.exports = {
  getDailyReports,
};