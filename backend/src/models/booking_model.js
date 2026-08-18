const db = require("../config/db");
const { generateBookingId } = require("../utils/id_generator");

async function createBooking(data) {
  const year = new Date().getFullYear();
  const prefix = `BK-${year}%`;

  const [rows] = await db.query(
    `
    SELECT id
    FROM bookings
    WHERE id LIKE ?
    ORDER BY id DESC
    LIMIT 1
    `,
    [prefix],
  );

  let seq = 1;

  if (rows.length > 0) {
    seq = parseInt(rows[0].id.substring(7), 10) + 1;
  }

  const id = generateBookingId(year, seq);

  const sql = `
    INSERT INTO bookings (
      id, user_id, customer_name, room_id, check_in, check_out,
      rooms_count, person_count, amount, phone, email, bank_account,
      address, status, payment_status, slip_url, check_in_status,
      check_out_status, inspection_status, room_key, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const values = [
    id,
    data.user_id || data.userId || null,
    data.customer_name || data.fullName || null,
    data.room_id || data.roomId || null,
    data.check_in || data.checkInDate || null,
    data.check_out || data.checkOutDate || null,
    data.rooms_count || data.roomsCount || 1,
    data.person_count || data.personCount || data.numberOfGuests || 1,
    data.deposit_amount ||
      data.depositAmount ||
      data.amount ||
      data.totalPrice ||
      0,
    data.phone || data.phoneNumber || null,
    data.email || null,
    data.bank_account || data.bankAccount || null,
    data.address || null,
    data.status || "PENDING",
    data.payment_status || data.paymentStatus || "PENDING",
    data.slip_url || data.paymentSlip || null,
    data.check_in_status || data.checkInStatus || "NOT_CHECKED_IN",
    data.check_out_status || data.checkOutStatus || "NOT_CHECKED_OUT",
    data.inspection_status || data.inspectionStatus || "PENDING",
    data.room_key || data.roomKey || null,
  ];

  await db.execute(sql, values);

  return { insertId: id };
}

async function getBookings() {
  const sql = `SELECT * FROM bookings ORDER BY created_at DESC`;
  const [rows] = await db.query(sql);
  return rows;
}

async function getBookingsByUserId(userId) {
  const sql = `SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC`;
  const [rows] = await db.query(sql, [userId]);
  return rows;
}

async function getBookingById(id) {
  const sql = `SELECT * FROM bookings WHERE id = ? LIMIT 1`;
  const [rows] = await db.query(sql, [id]);
  return rows[0];
}

async function updateBooking(id, data) {
  const fields = [];
  const params = [];

  if (data.customer_name || data.customerName) {
    fields.push("customer_name = ?");
    params.push(data.customer_name || data.customerName);
  }
  if (data.room_id || data.roomId) {
    fields.push("room_id = ?");
    params.push(data.room_id || data.roomId);
  }
  if (data.check_in || data.checkInDate) {
    fields.push("check_in = ?");
    params.push(data.check_in || data.checkInDate);
  }
  if (data.check_out || data.checkOutDate) {
    fields.push("check_out = ?");
    params.push(data.check_out || data.checkOutDate);
  }
  if (
    data.deposit_amount ||
    data.depositAmount ||
    data.amount ||
    data.totalPrice
  ) {
    fields.push("amount = ?");
    params.push(
      data.deposit_amount ||
        data.depositAmount ||
        data.amount ||
        data.totalPrice,
    );
  }
  if (data.status) {
    fields.push("status = ?");
    params.push(data.status);
  }
  if (data.payment_status || data.paymentStatus) {
    fields.push("payment_status = ?");
    params.push(data.payment_status || data.paymentStatus);
  }
  if (data.slip_url || data.slipUrl) {
    fields.push("slip_url = ?");
    params.push(data.slip_url || data.slipUrl);
  }
  if (data.check_in_status || data.checkInStatus) {
    fields.push("check_in_status = ?");
    params.push(data.check_in_status || data.checkInStatus);
  }
  if (data.check_out_status || data.checkOutStatus) {
    fields.push("check_out_status = ?");
    params.push(data.check_out_status || data.checkOutStatus);
  }
  if (data.inspection_status || data.inspectionStatus) {
    fields.push("inspection_status = ?");
    params.push(data.inspection_status || data.inspectionStatus);
  }

  if (fields.length === 0) return { affectedRows: 0 };

  params.push(id);
  const sql = `UPDATE bookings SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`;
  const [result] = await db.execute(sql, params);
  return result;
}

async function deleteBooking(id) {
  const [result] = await db.execute(`DELETE FROM bookings WHERE id = ?`, [id]);
  return result;
}

// update status check in , check out , inspection

async function updateCheckInStatus(id, data = {}) {
  const roomKey = data.room_key || data.roomKey || null;

  const sql = `
    UPDATE bookings
    SET
      check_in_status = 'CHECKED_IN',
      status = 'CHECKED_IN',
      room_key = COALESCE(?, room_key),
      updated_at = NOW()
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [roomKey, id]);

  return result;
}

async function updateCheckOutStatus(id, status = "CHECKED_OUT") {
  const sql = `
    UPDATE bookings
    SET
      check_out_status = ?,
      status = 'CHECKED_OUT',
      updated_at = NOW()
    WHERE id = ?
  `;

  const [result] = await db.execute(sql, [status, id]);

  return result;
}

async function updateInspectionStatus(id, status) {
  const [result] = await db.execute(
    `
    UPDATE bookings
    SET inspection_status = ?, updated_at = NOW()
    WHERE id = ?
    `,
    [status, id],
  );

  return result;
}

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  getBookingsByUserId,
  updateBooking,
  deleteBooking,
  updateCheckInStatus,
  updateCheckOutStatus,
  updateInspectionStatus,
};
