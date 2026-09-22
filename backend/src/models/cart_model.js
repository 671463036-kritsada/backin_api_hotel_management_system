const db = require("../config/db");

async function getCartByUserId(userId) {
  const [rows] = await db.execute(
    `SELECT c.*, r.room_type AS room_type, r.price AS price_per_night,
          ri.image_url AS image_url,
          e.name AS extra_bed_name,
          e.description AS extra_bed_description,
          e.price AS extra_bed_unit_price,
          e.max_child_age AS extra_bed_max_child_age
     FROM cart c
     LEFT JOIN rooms r ON r.id = c.room_id
     LEFT JOIN room_images ri ON ri.room_id = c.room_id AND ri.sort_order = 0
         LEFT JOIN extra_bed_types e ON e.id = c.extra_bed_type_id
     WHERE c.user_id = ? AND c.status = 'ACTIVE'
     ORDER BY c.created_at ASC`,
    [userId],
  );
  return rows;
}

async function addCartItem(userId, item) {
  const roomId = item.roomId || item.room_id;
  const checkIn = item.checkIn || item.check_in;
  const checkOut = item.checkOut || item.check_out;
  const adults = Number(item.adultCount ?? item.adult_count ?? 1);
  const children = Number(item.childCount ?? item.child_count ?? 0);
  const extraBedTypeId = item.extraBedTypeId ?? item.extra_bed_type_id ?? null;
  const extraBedQuantity = Number(
    item.extraBedQuantity ?? item.extra_bed_quantity ?? 0,
  );

  if (
    !roomId ||
    !checkIn ||
    !checkOut ||
    new Date(checkIn) >= new Date(checkOut)
  ) {
    return { success: false, message: "ข้อมูลห้องหรือวันที่ไม่ถูกต้อง" };
  }
  if (
    adults < 1 ||
    children < 0 ||
    extraBedQuantity < 0 ||
    extraBedQuantity > children
  ) {
    return {
      success: false,
      message: "จำนวนผู้เข้าพักหรือเตียงเสริมไม่ถูกต้อง",
    };
  }

  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / 86400000);
  const [rooms] = await db.execute(
    "SELECT price FROM rooms WHERE id = ? LIMIT 1",
    [roomId],
  );
  if (!rooms.length)
    return { success: false, message: `ไม่พบห้องพัก ${roomId}` };

  const roomPrice = Number(rooms[0].price) * nights;
  let extraBedPrice = 0;
  if (extraBedTypeId !== null && extraBedQuantity > 0) {
    const [beds] = await db.execute(
      "SELECT price FROM extra_bed_types WHERE id = ? AND is_active = 1 LIMIT 1",
      [extraBedTypeId],
    );
    if (!beds.length)
      return { success: false, message: "ไม่พบประเภทเตียงเสริม" };
    extraBedPrice = Number(beds[0].price) * extraBedQuantity * nights;
  }

  const [result] = await db.execute(
    `INSERT INTO cart
      (user_id, room_id, check_in, check_out, adult_count, child_count,
       extra_bed_type_id, extra_bed_quantity, room_price, extra_bed_price, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')`,
    [
      userId,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      extraBedTypeId,
      extraBedQuantity,
      roomPrice,
      extraBedPrice,
    ],
  );
  return { success: true, data: { id: result.insertId } };
}

async function removeCartItem(userId, id) {
  const [result] = await db.execute(
    "DELETE FROM cart WHERE id = ? AND user_id = ? AND status = 'ACTIVE'",
    [id, userId],
  );
  return result.affectedRows > 0;
}

async function clearCart(userId) {
  const [result] = await db.execute(
    "DELETE FROM cart WHERE user_id = ? AND status = 'ACTIVE'",
    [userId],
  );
  return result.affectedRows;
}

module.exports = { getCartByUserId, addCartItem, removeCartItem, clearCart };
