const db = require("../config/db");

async function getFurnitureByRoomAndBooking(roomId, bookingId) {
  const [rows] = await db.query(
    `SELECT 
        f.id,
        f.room_id AS roomId,
        f.title,
        f.image,
        f.is_extra AS isCustom,
        fi.inspector_id AS inspectorId,
        u.name AS inspectorName,
        u.role AS inspectorRole,
        fi.status,
        fi.note,
        fi.damage_image AS damageImage,
        fi.inspected_at AS inspectedAt
     FROM furnitures f
     LEFT JOIN furniture_inspections fi 
       ON fi.id = (
         SELECT fi2.id
         FROM furniture_inspections fi2
         WHERE fi2.furniture_id = f.id AND fi2.booking_id = ?
         ORDER BY fi2.inspected_at DESC, fi2.id DESC
         LIMIT 1
       )
     LEFT JOIN users u ON u.id = fi.inspector_id
     WHERE f.room_id = ?
     ORDER BY f.id`,
    [bookingId, roomId],
  );

  return rows.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    title: row.title,
    image: row.image,
    isCustom: !!row.isCustom,
    inspections: row.inspectorId
      ? [
          {
            inspectorId: row.inspectorId,
            inspectorName: row.inspectorName,
            inspectorRole: row.inspectorRole,
            status: row.status,
            note: row.note,
            damageImage: row.damageImage,
            inspectedAt: row.inspectedAt,
          },
        ]
      : [],
  }));
}

async function createFurnitureInspection(data) {
  // ไม่แก้อะไร — ยัง insert ทุกครั้งเหมือนเดิม เพื่อเก็บประวัติไว้ครบ
  let furnitureId = data.furnitureId;
  if (!furnitureId) {
    const [result] = await db.execute(
      `INSERT INTO furnitures (room_id, title, image, is_extra) VALUES (?, ?, ?, 1)`,
      [data.roomId, data.title, data.image || null],
    );
    furnitureId = result.insertId;
  }
  const [result] = await db.execute(
    `INSERT INTO furniture_inspections 
       (furniture_id, booking_id, inspector_id, status, note, damage_image, inspected_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [
      furnitureId,
      data.bookingId,
      data.inspectorId,
      data.status,
      data.note || null,
      data.damageImage || null,
    ],
  );
  return { insertId: result.insertId, furnitureId };
}

module.exports = {
  getFurnitureByRoomAndBooking,
  createFurnitureInspection,
};