const db = require("../config/db");
const { generateRoomId } = require("../utils/id_generator");
function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

exports.getRooms = async () => {
  try {
    const [rows] = await db.query(
      `SELECT id AS roomId, room_type AS roomType, name, description, price AS pricePerNight, status, image_url AS imageUrl, created_at AS createdAt FROM rooms`,
    );
    return buildResponse(rows);
  } catch (err) {
    return buildResponse(null, `getRooms error: ${err.message}`, 500);
  }
};

exports.getRoomById = async (id) => {
  try {
    const [rows] = await db.query(
      `SELECT id AS roomId, room_type AS roomType, name, description, price AS pricePerNight, status, image_url AS imageUrl, created_at AS createdAt FROM rooms WHERE id = ?`,
      [id],
    );
    if (!rows.length) return buildResponse(null, "room not found", 404);
    return buildResponse(rows[0]);
  } catch (err) {
    return buildResponse(null, `getRoomById error: ${err.message}`, 500);
  }
};

// หาลำดับถัดไปของแต่ละประเภทห้อง โดยนับจากจำนวนห้องที่มี prefix เดียวกันอยู่แล้ว
async function getNextSeq(roomType) {
  const prefix = roomType === "house" ? "H" : "R";
  // ใช้ REGEXP กรองเฉพาะ id ที่ตรงรูปแบบ Prefix + ตัวเลขล้วนๆ เท่านั้น
  // BINARY เพื่อบังคับให้เทียบแบบ case-sensitive กัน r/R ปนกัน
  const [rows] = await db.execute(
    `SELECT id FROM rooms 
     WHERE id REGEXP BINARY ?
     ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) DESC 
     LIMIT 1`,
    [`^${prefix}[0-9]+$`]
  );
  if (rows.length === 0) return 1;
  const lastId = rows[0].id;
  const lastSeq = parseInt(lastId.slice(1), 10); // ตัดตัวแรก (prefix) ออก แทน replace
  return lastSeq + 1;
}

exports.createRoom = async (data) => {
  try {
    const imageUrl =
      (Array.isArray(data.imageUrls) && data.imageUrls[0]) ||
      data.imageUrl ||
      null;

    const roomType = data.roomType || data.room_type || "rooms";
    // แปลง "rooms" -> "room" ให้ตรงกับเงื่อนไขใน generateRoomId (ดูหมายเหตุด้านล่าง)
    const normalizedType = roomType === "house" ? "house" : "room";

    let id = data.id;
    if (!id) {
      const seq = await getNextSeq(normalizedType);
      id = generateRoomId(normalizedType, seq);
    }

    const [result] = await db.execute(
      `INSERT INTO rooms (id, room_type, name, description, price, status, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        id,
        roomType,
        data.name || data.roomName || null,
        data.description || null,
        data.pricePerNight || data.price || 0,
        data.status || "ว่าง",
        imageUrl,
      ],
    );
    const roomResp = await exports.getRoomById(id);
    return buildResponse(roomResp.data, "room created", 201);
  } catch (err) {
    return buildResponse(null, `createRoom error: ${err.message}`, 500);
  }
};

exports.updateRoom = async (id, data) => {
  try {
    const fields = [];
    const params = [];

    if (data.roomType || data.room_type) {
      fields.push("room_type = ?");
      params.push(data.roomType || data.room_type);
    }
    if (data.name || data.roomName) {
      fields.push("name = ?");
      params.push(data.name || data.roomName);
    }
    if (data.description) {
      fields.push("description = ?");
      params.push(data.description);
    }
    if (data.pricePerNight || data.price) {
      fields.push("price = ?");
      params.push(data.pricePerNight || data.price);
    }
    if (data.status) {
      fields.push("status = ?");
      params.push(data.status);
    }
    if (data.imageUrls || data.imageUrl) {
      const imageUrl =
        (Array.isArray(data.imageUrls) && data.imageUrls[0]) || data.imageUrl;
      fields.push("image_url = ?");
      params.push(imageUrl || null);
    }

    if (fields.length === 0) {
      return buildResponse(null, "no fields to update", 400);
    }

    params.push(id);
    const sql = `UPDATE rooms SET ${fields.join(", ")}, created_at = NOW() WHERE id = ?`;
    await db.execute(sql, params);

    const roomResp = await exports.getRoomById(id);
    return buildResponse(roomResp.data, "room updated", 200);
  } catch (err) {
    return buildResponse(null, `updateRoom error: ${err.message}`, 500);
  }
};

exports.deleteRoom = async (id) => {
  try {
    const [result] = await db.execute(`DELETE FROM rooms WHERE id = ?`, [id]);
    if (result.affectedRows === 0)
      return buildResponse(null, "room not found", 404);
    return buildResponse({ id }, "room deleted", 200);
  } catch (err) {
    return buildResponse(null, `deleteRoom error: ${err.message}`, 500);
  }
};
