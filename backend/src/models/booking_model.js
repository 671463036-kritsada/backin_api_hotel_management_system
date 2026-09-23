const db = require("../config/db");
const { generateBookingId } = require("../utils/id_generator");

function toSqlDate(value) {
  if (!value) return null;
  const datePart = String(value).match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (datePart) return datePart;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

async function getPendingBookings() {
  const sql = `SELECT * FROM bookings WHERE status = 'PENDING' ORDER BY created_at DESC`;
  const [rows] = await db.query(sql);
  return rows;
}

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
      rooms_count, person_count, amount, paid_amount, remaining_amount,
      phone, email, bank_account, address, status, payment_status,
      slip_url, check_in_status, check_out_status, inspection_status,
      room_key, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const totalPrice = data.total_price || data.totalPrice || 0;
  const paidAmount = data.paid_amount || data.depositAmount || 0;
  const remainingAmount =
    data.remaining_amount || data.remainingAmount || totalPrice - paidAmount;

  const values = [
    id,
    data.user_id || data.userId || null,
    data.customer_name || data.fullName || null,
    data.room_id || data.roomId || null,
    data.check_in || data.checkInDate || null,
    data.check_out || data.checkOutDate || null,
    data.rooms_count || data.roomsCount || 1,
    data.person_count || data.personCount || data.numberOfGuests || 1,
    totalPrice,
    paidAmount,
    remainingAmount,
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

async function createCartBookings(data) {
  const connection = await db.getConnection();
  const bookingIds = [];
  let totalPrice = 0;

  try {
    await connection.beginTransaction();

    for (const item of data.items) {
      const roomId = item.roomId || item.room_id;
      const checkIn = toSqlDate(item.checkInDate || item.check_in);
      const checkOut = toSqlDate(item.checkOutDate || item.check_out);
      const adults = Number(item.adultCount ?? item.adult_count ?? 1);
      const children = Number(item.childCount ?? item.child_count ?? 0);
      const extraBedTypeId =
        item.extraBedTypeId ?? item.extra_bed_type_id ?? null;
      const extraBedQuantity = Number(
        item.extraBedQuantity ?? item.extra_bed_quantity ?? 0,
      );
      const nights = Math.ceil(
        (new Date(checkOut) - new Date(checkIn)) / (24 * 60 * 60 * 1000),
      );

      const [availability] = await connection.execute(
        `SELECT COUNT(*) AS count FROM bookings
         WHERE room_id = ?
           AND status NOT IN ('ยกเลิก', 'REJECTED', 'CHECKED_OUT', 'CANCELLED_BY_USER', 'CANCELLED_BY_ADMIN')
           AND check_in < ? AND check_out > ?`,
        [roomId, checkOut, checkIn],
      );
      if (availability[0].count > 0) {
        throw new Error(`ห้อง ${roomId} ถูกจองไปแล้วในช่วงวันที่ที่เลือก`);
      }

      const [roomRows] = await connection.execute(
        `SELECT price FROM rooms WHERE id = ? LIMIT 1`,
        [roomId],
      );
      if (roomRows.length === 0) throw new Error(`ไม่พบห้องพัก ${roomId}`);

      const roomPrice = Number(roomRows[0].price) * nights;
      let extraBedPrice = 0;
      if (extraBedTypeId !== null && extraBedQuantity > 0) {
        const [bedRows] = await connection.execute(
          `SELECT price FROM extra_bed_types WHERE id = ? AND is_active = 1 LIMIT 1`,
          [extraBedTypeId],
        );
        if (bedRows.length === 0)
          throw new Error("ไม่พบประเภทเตียงเสริมที่ใช้งานอยู่");
        if (children < 1 || extraBedQuantity > children) {
          throw new Error("จำนวนเตียงเสริมต้องไม่เกินจำนวนเด็ก");
        }
        extraBedPrice = Number(bedRows[0].price) * extraBedQuantity * nights;
      }

      const [lastBooking] = await connection.execute(
        `SELECT id FROM bookings WHERE id LIKE ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        [`BK-${new Date().getFullYear()}%`],
      );
      const seq =
        lastBooking.length > 0
          ? parseInt(lastBooking[0].id.substring(7), 10) + 1
          : 1;
      const bookingId = generateBookingId(new Date().getFullYear(), seq);
      const itemTotalPrice = roomPrice + extraBedPrice;
      totalPrice += itemTotalPrice;

      await connection.execute(
        `INSERT INTO bookings (
          id, user_id, customer_name, room_id, check_in, check_out,
          rooms_count, person_count, adult_count, child_count,
          extra_bed_type_id, extra_bed_quantity, room_price, extra_bed_price,
          amount, paid_amount, remaining_amount,
          phone, email, bank_account, address, status, payment_status,
          slip_url, check_in_status, check_out_status, inspection_status,
          room_key, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          bookingId,
          data.user_id,
          data.customer_name || data.fullName || null,
          roomId,
          checkIn,
          checkOut,
          1,
          adults + children,
          adults,
          children,
          extraBedTypeId,
          extraBedQuantity,
          roomPrice,
          extraBedPrice,
          itemTotalPrice,
          itemTotalPrice * 0.3,
          itemTotalPrice * 0.7,
          data.phoneNumber || data.phone || null,
          data.email || null,
          data.bankAccount || data.bank_account || null,
          data.address || null,
          "PENDING",
          "PENDING",
          data.slip_url || null,
          "NOT_CHECKED_IN",
          "NOT_CHECKED_OUT",
          "PENDING",
          null,
        ],
      );
      bookingIds.push(bookingId);
    }

    await connection.execute(
      `DELETE FROM cart WHERE user_id = ? AND status = 'ACTIVE'`,
      [data.user_id],
    );

    await connection.commit();
    return {
      bookingIds,
      totalPrice,
      depositAmount: totalPrice * 0.3,
      remainingAmount: totalPrice * 0.7,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getBookings() {
  const sql = `SELECT * FROM bookings ORDER BY created_at DESC`;
  const [rows] = await db.query(sql);
  return rows;
}

async function getBookingsByUserId(userId) {
  const sql = `
    SELECT b.*, c.status AS checkin_status
    FROM bookings b
    LEFT JOIN checkins c ON c.booking_id = b.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `;
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
  if (data.total_price || data.totalPrice) {
    fields.push("amount = ?");
    params.push(data.total_price || data.totalPrice);
  }
  if (data.paid_amount || data.depositAmount) {
    fields.push("paid_amount = ?");
    params.push(data.paid_amount || data.depositAmount);
  }
  if (data.remaining_amount || data.remainingAmount) {
    fields.push("remaining_amount = ?");
    params.push(data.remaining_amount || data.remainingAmount);
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
  if (data.cancel_reason !== undefined) {
    fields.push("cancel_reason = ?");
    params.push(data.cancel_reason);
  }
  if (data.cancelled_by !== undefined) {
    fields.push("cancelled_by = ?");
    params.push(data.cancelled_by);
  }
  if (data.cancelled_at !== undefined) {
    fields.push("cancelled_at = ?");
    params.push(data.cancelled_at);
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

async function cancelBooking(id, { requesterId, requesterRole, reason }) {
  const [rows] = await db.execute(
    `SELECT id, user_id, status, check_in_status, paid_amount
     FROM bookings WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!rows.length) {
    return { success: false, statusCode: 404, message: "ไม่พบ booking" };
  }

  const booking = rows[0];
  const isAdmin = String(requesterRole || "").toLowerCase() === "admin";
  if (!isAdmin && booking.user_id !== requesterId) {
    return {
      success: false,
      statusCode: 403,
      message: "คุณไม่มีสิทธิ์ยกเลิก booking นี้",
    };
  }
  if (!String(reason || "").trim()) {
    return {
      success: false,
      statusCode: 400,
      message: "กรุณาระบุเหตุผลการยกเลิก",
    };
  }
  if (
    [
      "CANCELLED",
      "CANCELLED_BY_USER",
      "CANCELLED_BY_ADMIN",
      "REJECTED",
      "CHECKED_OUT",
    ].includes(booking.status)
  ) {
    return {
      success: false,
      statusCode: 409,
      message: `ไม่สามารถยกเลิก booking ที่มีสถานะ ${booking.status} ได้`,
    };
  }
  if (booking.check_in_status === "CHECKED_IN") {
    return {
      success: false,
      statusCode: 409,
      message: "ไม่สามารถยกเลิก booking หลังเช็คอินแล้วได้",
    };
  }

  const paymentStatus =
    Number(booking.paid_amount || 0) > 0 ? "REFUND_PENDING" : "NOT_REQUIRED";
  await db.execute(
    `UPDATE bookings
     SET status = ?, payment_status = ?, cancel_reason = ?,
         cancelled_by = ?, cancelled_at = NOW(), updated_at = NOW()
     WHERE id = ?`,
    [
      isAdmin ? "CANCELLED_BY_ADMIN" : "CANCELLED_BY_USER",
      paymentStatus,
      String(reason).trim(),
      requesterId,
      id,
    ],
  );
  return {
    success: true,
    data: {
      id,
      status: isAdmin ? "CANCELLED_BY_ADMIN" : "CANCELLED_BY_USER",
      paymentStatus,
      reason: String(reason).trim(),
    },
    message: "ยกเลิก booking สำเร็จ",
  };
}

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

async function getExpiredCheckedInBookings() {
  const sql = `
    SELECT *
    FROM bookings
    WHERE check_in_status = 'CHECKED_IN'
      AND check_out_status != 'CHECKED_OUT'
      AND TIMESTAMP(check_out, '12:00:00') <= NOW()
  `;
  const [rows] = await db.query(sql);
  return rows;
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
  createCartBookings,
  getBookings,
  getBookingById,
  getBookingsByUserId,
  getPendingBookings,
  updateBooking,
  deleteBooking,
  cancelBooking,
  updateCheckInStatus,
  updateCheckOutStatus,
  getExpiredCheckedInBookings,
  updateInspectionStatus,
};
