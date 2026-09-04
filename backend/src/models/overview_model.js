const db = require("../config/db");

/**
 * นับจำนวนห้องทั้งหมดจากตาราง rooms
 */
async function getTotalRooms() {
  const [rows] = await db.query(`SELECT COUNT(*) AS total FROM rooms`);
  return rows[0]?.total || 0;
}

/**
 * นับห้องที่ถูกจองอยู่ ครอบคลุมวันนี้ (check_in <= วันนี้ <= check_out)
 * ไม่นับ booking ที่ถูกยกเลิก (status = 'CANCELLED')
 * ใช้ COUNT(DISTINCT room_id) กันกรณีห้องเดียวกันมีมากกว่า 1 booking ซ้อนกัน
 */
async function getOccupiedRoomsToday() {
  const [rows] = await db.query(
    `
    SELECT COUNT(DISTINCT room_id) AS occupied
    FROM bookings
    WHERE status != 'CANCELLED'
      AND check_in <= CURDATE()
      AND check_out >= CURDATE()
    `
  );
  return rows[0]?.occupied || 0;
}

/**
 * รายได้วันนี้: เหมือน logic ใน report แต่จำกัดแค่ check_in = วันนี้เป๊ะๆ
 * (ไม่ใช่ date range) นับเฉพาะ booking ที่จ่ายครบ (PAID) และเช็คอินจริง (CHECKED_IN)
 */
async function getRevenueToday() {
  const [rows] = await db.query(
    `
    SELECT
      SUM(b.paid_amount + COALESCE(ci.checkin_paid, 0)) AS revenue
    FROM bookings b
    LEFT JOIN (
      SELECT booking_id, SUM(amount_paid) AS checkin_paid
      FROM checkins
      GROUP BY booking_id
    ) ci ON ci.booking_id = b.id
    WHERE b.check_in = CURDATE()
      AND b.payment_status = 'PAID'
      AND b.check_in_status = 'CHECKED_IN'
    `
  );
  return Number(rows[0]?.revenue) || 0;
}

/**
 * การจองล่าสุด (join room_type จากตาราง rooms)
 */
async function getRecentBookings(limit = 5) {
  const [rows] = await db.query(
    `
    SELECT
      b.customer_name,
      r.room_type,
      DATE_FORMAT(b.check_in, '%Y-%m-%d') AS check_in,
      DATE_FORMAT(b.check_out, '%Y-%m-%d') AS check_out,
      b.status
    FROM bookings b
    LEFT JOIN rooms r ON r.id = b.room_id
    ORDER BY b.created_at DESC
    LIMIT ?
    `,
    [limit]
  );
  return rows;
}

module.exports = {
  getTotalRooms,
  getOccupiedRoomsToday,
  getRevenueToday,
  getRecentBookings,
};