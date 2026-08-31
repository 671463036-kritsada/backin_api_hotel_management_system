
const db = require("../config/db");

async function createCheckIn(data) {
  const sql = `
    INSERT INTO checkins (
      booking_id, user_promotion_id, discount_amount, amount_paid,
      id_card_number, full_name, gender, address,
      id_card_image, signature_image, payment_slip_image,
      actual_checkin, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'pending', NOW())
  `;
  const values = [
    data.bookingId || data.booking_id || null,
    data.userPromotionId || data.user_promotion_id || null,
    data.discountAmount || data.discount_amount || 0,
    data.amountPaid || data.amount_paid || 0,
    data.idCardNumber || data.id_card_number || null,
    data.fullName || data.full_name || null,
    data.gender || null,
    data.address || null,
    data.idCardImage || data.id_card_image || null,
    data.signatureImage || data.signature_image || null,
    data.paymentSlipImage || data.payment_slip_image || null,
  ];
  const [result] = await db.execute(sql, values);
  return { insertId: result.insertId };
}

async function getCheckIns() {
  const [rows] = await db.query(`SELECT * FROM checkins ORDER BY created_at DESC`);
  return rows;
}

async function getPendingCheckins() {
  const [rows] = await db.query(
    `SELECT * FROM checkins WHERE status = 'pending' ORDER BY created_at DESC`
  );
  return rows;
}

async function getCheckInById(id) {
  const [rows] = await db.query(`SELECT * FROM checkins WHERE id = ? LIMIT 1`, [id]);
  return rows[0];
}
// เพิ่มใหม่: หา checkin record จาก booking_id (เพราะ Flutter ส่งมาแค่ bookingId)
async function getCheckInByBookingId(bookingId) {
  const [rows] = await db.query(
    `SELECT * FROM checkins WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1`,
    [bookingId],
  );
  return rows[0];
}

async function updateCheckinStatus(id, status) {
  const [result] = await db.execute(
    `UPDATE checkins SET status = ? WHERE id = ?`,
    [status, id],
  );
  return result;
}

// เพิ่มใหม่: checkout พร้อมบันทึกเวลาจริง
async function checkOutCheckin(id) {
  const [result] = await db.execute(
    `UPDATE checkins SET status = 'checked_out', actual_checkout = NOW() WHERE id = ?`,
    [id],
  );
  return result;
}

module.exports = {
  createCheckIn,
  getCheckIns,
  getPendingCheckins,
   getCheckInByBookingId,   
  getCheckInById,
  updateCheckinStatus,
  checkOutCheckin,  
};