const db = require("../config/db");

async function getHistoryByUserId(userId) {
  const [rows] = await db.query(
    `SELECT 
        b.id AS bookingId,
        b.room_id AS roomNumber,
        b.check_in AS checkInDate,
        b.check_out AS checkOutDate,
        b.amount AS totalAmount,
        f.rating,
        f.comment,
        f.created_at AS reviewedAt
     FROM bookings b
     LEFT JOIN feedbacks f ON f.booking_id = b.id
     WHERE b.user_id = ?
       AND b.check_out_status = 'CHECKED_OUT'
     ORDER BY b.check_out DESC`,
    [userId],
  );

  //  ประกอบ review ให้เป็น nested object ตาม shape ที่ frontend ต้องการ (review: null หรือ { rating, comment, reviewedAt })
  return rows.map((row) => ({
    bookingId: row.bookingId,
    roomNumber: row.roomNumber,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    totalAmount: row.totalAmount,
    review:
      row.rating != null
        ? {
            rating: row.rating,
            comment: row.comment,
            reviewedAt: row.reviewedAt,
          }
        : null,
  }));
}

async function getHistoryByBookingId(bookingId, userId) {
  const [rows] = await db.query(
    `SELECT 
        b.id AS bookingId,
        b.room_id AS roomNumber,
        b.check_in AS checkInDate,
        b.check_out AS checkOutDate,
        b.amount AS totalAmount,
        f.rating,
        f.comment,
        f.created_at AS reviewedAt
     FROM bookings b
     LEFT JOIN feedbacks f ON f.booking_id = b.id
     WHERE b.id = ?
       AND b.user_id = ?
       AND b.check_out_status = 'CHECKED_OUT'`,
    [bookingId, userId],
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    bookingId: row.bookingId,
    roomNumber: row.roomNumber,
    checkInDate: row.checkInDate,
    checkOutDate: row.checkOutDate,
    totalAmount: row.totalAmount,
    review:
      row.rating != null
        ? {
            rating: row.rating,
            comment: row.comment,
            reviewedAt: row.reviewedAt,
          }
        : null,
  };
}

async function createReview(
  bookingId,
  userId,
  customerName,
  { rating, comment },
) {
  await db.query(
    `
    INSERT INTO feedbacks
    (
      booking_id,
      user_id,
      customer_name,
      rating,
      comment,
      created_at
    )
    VALUES (?, ?, ?, ?, ?, NOW())
    `,
    [bookingId, userId, customerName, rating, comment],
  );

  return true;
}

module.exports = {
  getHistoryByUserId,
  getHistoryByBookingId,
  createReview,
};
