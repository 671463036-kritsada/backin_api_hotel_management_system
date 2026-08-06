const db = require("../config/db");

async function createCheckIn(data) {
  const sql = `
    INSERT INTO checkins (
      booking_id, id_card_number, full_name, gender, address,
      id_card_image, signature_image, actual_checkin, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'checked_in', NOW())
  `;
  const values = [
    data.bookingId || data.booking_id || null,
    data.idCardNumber || data.id_card_number || null,
    data.fullName || data.full_name || null,
    data.gender || null,
    data.address || null,
    data.idCardImage || data.id_card_image || null,
    data.signatureImage || data.signature_image || null,
  ];
  const [result] = await db.execute(sql, values);
  return { insertId: result.insertId };
}

async function getCheckIns() {
  const sql = `SELECT * FROM checkins ORDER BY created_at DESC`;
  const [rows] = await db.query(sql);
  return rows;
}

async function getCheckInById(id) {
  const sql = `SELECT * FROM checkins WHERE id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [id]);
  return rows[0];
}

module.exports = {
  createCheckIn,
  getCheckIns,
  getCheckInById,
};