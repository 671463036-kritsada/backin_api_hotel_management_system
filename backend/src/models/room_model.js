const db = require("../config/db");
const { generateRoomId } = require("../utils/id_generator");
const fs = require("fs");
const path = require("path");

const UPLOAD_BASE = path.join(__dirname, "..", "uploads", "imageData");

function getSubfolder(roomType) {
  return roomType === "house" ? "housesImage" : "roomsImage";
}

function saveRoomImage(file, roomType) {
  const subfolder = getSubfolder(roomType);
  const dir = path.join(UPLOAD_BASE, subfolder);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${subfolder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
  const fullPath = path.join(dir, filename);

  fs.writeFileSync(fullPath, file.buffer);

  return `imageData/${subfolder}/${filename}`;
}

// เซฟหลายไฟล์พร้อมกัน คืนค่าเป็น array ของ relative path
function saveRoomImages(files, roomType) {
  if (!files || files.length === 0) return [];
  return files.map((file) => saveRoomImage(file, roomType));
}

function deleteRoomImage(relativePath) {
  if (!relativePath || !relativePath.startsWith("imageData/")) return;

  const fullPath = path.join(__dirname, "..", "uploads", relativePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("deleteRoomImage error:", err.message);
    }
  });
}

// ลบรูปทั้งหมดของห้อง (ทั้งไฟล์บน disk และ record ใน room_images)
async function deleteAllRoomImages(roomId) {
  const [images] = await db.query(
    `SELECT image_url FROM room_images WHERE room_id = ?`,
    [roomId]
  );
  images.forEach((img) => deleteRoomImage(img.image_url));
  await db.execute(`DELETE FROM room_images WHERE room_id = ?`, [roomId]);
}

// insert รูปหลายรูปเข้า room_images ตามลำดับ
async function insertRoomImages(roomId, imagePaths) {
  for (let i = 0; i < imagePaths.length; i++) {
    await db.execute(
      `INSERT INTO room_images (room_id, image_url, sort_order) VALUES (?, ?, ?)`,
      [roomId, imagePaths[i], i],
    );
  }
}

function buildResponse(data, message = "success", statusCode = 200) {
  return { message, statusCode, data };
}

// แปลง imageUrls string ('||' คั่น) จาก GROUP_CONCAT ให้เป็น array จริง
function mapImageUrls(row) {
  return {
    ...row,
    imageUrls: row.imageUrls ? row.imageUrls.split("||") : [],
  };
}

// ==========================================
// GET ALL ROOMS
// ==========================================
exports.getRooms = async () => {
  try {
    const [rows] = await db.query(`
      SELECT
        r.id AS roomId,
        r.room_type AS roomType,
        r.name,
        r.description,
        r.price AS pricePerNight,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        CASE
          WHEN b.room_id IS NOT NULL THEN 'มีผู้พัก'
          ELSE 'ว่าง'
        END AS status,
        GROUP_CONCAT(DISTINCT ri.image_url ORDER BY ri.sort_order SEPARATOR '||') AS imageUrls
      FROM rooms r
      LEFT JOIN bookings b
        ON b.room_id = r.id
        AND b.status NOT IN ('ยกเลิก', 'CHECKED_OUT', 'REJECTED')
        AND b.check_in <= CURDATE()
        AND b.check_out > CURDATE()
      LEFT JOIN room_images ri ON ri.room_id = r.id
      GROUP BY r.id
      ORDER BY r.id ASC
    `);

    return buildResponse(rows.map(mapImageUrls));
  } catch (err) {
    console.error("getRooms error:", err);
    return buildResponse(null, `getRooms error: ${err.message}`, 500);
  }
};

// ==========================================
// GET ROOM BY ID
// ==========================================
exports.getRoomById = async (id) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        r.id AS roomId,
        r.room_type AS roomType,
        r.name,
        r.description,
        r.price AS pricePerNight,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        CASE
          WHEN b.room_id IS NOT NULL THEN 'มีผู้พัก'
          ELSE 'ว่าง'
        END AS status,
        GROUP_CONCAT(DISTINCT ri.image_url ORDER BY ri.sort_order SEPARATOR '||') AS imageUrls
      FROM rooms r
      LEFT JOIN bookings b
        ON b.room_id = r.id
        AND b.status NOT IN ('ยกเลิก', 'CHECKED_OUT', 'REJECTED')
        AND b.check_in <= CURDATE()
        AND b.check_out > CURDATE()
      LEFT JOIN room_images ri ON ri.room_id = r.id
      WHERE r.id = ?
      GROUP BY r.id
      `,
      [id],
    );

    if (!rows.length) {
      return buildResponse(null, "room not found", 404);
    }

    return buildResponse(mapImageUrls(rows[0]));
  } catch (err) {
    console.error("getRoomById error:", err);
    return buildResponse(null, `getRoomById error: ${err.message}`, 500);
  }
};

// ==========================================
// GET AVAILABLE ROOMS
// ==========================================
exports.getAvailableRooms = async ({ checkIn, checkOut, roomType }) => {
  try {
    let sql = `
      SELECT
        r.id AS roomId,
        r.room_type AS roomType,
        r.name,
        r.description,
        r.price AS pricePerNight,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        'ว่าง' AS status,
        GROUP_CONCAT(DISTINCT ri.image_url ORDER BY ri.sort_order SEPARATOR '||') AS imageUrls
      FROM rooms r
      LEFT JOIN room_images ri ON ri.room_id = r.id
      WHERE r.id NOT IN (
        SELECT b.room_id
        FROM bookings b
        WHERE b.room_id IS NOT NULL
          AND b.status NOT IN ('ยกเลิก', 'CHECKED_OUT', 'REJECTED')
          AND b.check_in < ?
          AND b.check_out > ?
      )
    `;

    const params = [checkOut, checkIn];

    if (roomType) {
      sql += ` AND r.room_type = ?`;
      params.push(roomType);
    }

    sql += ` GROUP BY r.id ORDER BY r.id ASC`;

    const [rows] = await db.query(sql, params);

    return buildResponse(rows.map(mapImageUrls));
  } catch (err) {
    console.error("getAvailableRooms error:", err);
    return buildResponse(null, `getAvailableRooms error: ${err.message}`, 500);
  }
};

// ==========================================
// CHECK ROOM AVAILABLE
// ==========================================
exports.isRoomAvailable = async (roomId, checkIn, checkOut) => {
  const [rows] = await db.query(
    `
     SELECT COUNT(*) AS count
    FROM bookings
    WHERE room_id = ?
      AND status NOT IN ('ยกเลิก', 'REJECTED', 'CHECKED_OUT')
      AND check_in < ?
      AND check_out > ?
    `,
    [roomId, checkOut, checkIn],
  );

  return rows[0].count === 0;
};

// ==========================================
// GET NEXT ROOM SEQUENCE
// ==========================================
async function getNextSeq(roomType) {
  const prefix = roomType === "house" ? "H" : "R";

  const [rows] = await db.execute(
    `
    SELECT id
    FROM rooms
    WHERE id REGEXP BINARY ?
    ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) DESC
    LIMIT 1
    `,
    [`^${prefix}[0-9]+$`],
  );

  if (rows.length === 0) {
    return 1;
  }

  return parseInt(rows[0].id.slice(1), 10) + 1;
}

// ==========================================
// CREATE ROOM
// ==========================================
exports.createRoom = async (data, files) => {
  try {
    const roomType = data.roomType || data.room_type || "rooms";
    const normalizedType = roomType === "house" ? "house" : "room";

    const name = data.name || data.roomName || null;
    const description = data.description ?? null;
    const price = Number(data.pricePerNight ?? data.price ?? 0);
    const bank = data.bank ?? null ;

    if (!name || !String(name).trim()) {
      return buildResponse(null, "room name is required", 400);
    }
    if (!price || price <= 0) {
      return buildResponse(null, "price must be greater than 0", 400);
    }

    let id = data.id;
    if (!id) {
      const seq = await getNextSeq(normalizedType);
      id = generateRoomId(normalizedType, seq);
    }

    await db.execute(
      `
      INSERT INTO rooms (id, room_type, name, description, price)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id, roomType, name, description, price],
    );

    // เซฟรูปหลายไฟล์ แล้ว insert เข้า room_images
    const imagePaths = saveRoomImages(files, roomType);
    if (imagePaths.length > 0) {
      await insertRoomImages(id, imagePaths);
    }

    const roomResp = await exports.getRoomById(id);
    return buildResponse(roomResp.data, "room created", 201);
  } catch (err) {
    console.error("createRoom error:", err);
    return buildResponse(null, `createRoom error: ${err.message}`, 500);
  }
};

// ==========================================
// UPDATE ROOM
// ==========================================
exports.updateRoom = async (id, data, files) => {
  try {
    const fields = [];
    const params = [];

    if (data.roomType !== undefined || data.room_type !== undefined) {
      fields.push("room_type = ?");
      params.push(data.roomType ?? data.room_type);
    }
    if (data.name !== undefined || data.roomName !== undefined) {
      fields.push("name = ?");
      params.push(data.name ?? data.roomName);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      params.push(data.description);
    }
    if (data.pricePerNight !== undefined || data.price !== undefined) {
      const price = Number(data.pricePerNight ?? data.price);
      if (!price || price <= 0) {
        return buildResponse(null, "price must be greater than 0", 400);
      }
      fields.push("price = ?");
      params.push(price);
    }

    // ถ้ามีการอัปโหลดรูปใหม่ -> ลบรูปเก่าทั้งชุด แล้วเซฟรูปใหม่แทน
    if (files && files.length > 0) {
      const currentResp = await exports.getRoomById(id);
      if (!currentResp.data) {
        return buildResponse(null, "room not found", 404);
      }

      const roomType =
        data.roomType ?? data.room_type ?? currentResp.data.roomType;

      await deleteAllRoomImages(id);

      const newImagePaths = saveRoomImages(files, roomType);
      await insertRoomImages(id, newImagePaths);
    }

    if (fields.length === 0 && !(files && files.length > 0)) {
      return buildResponse(null, "no fields to update", 400);
    }

    if (fields.length > 0) {
      params.push(id);
      const sql = `UPDATE rooms SET ${fields.join(", ")} WHERE id = ?`;
      const [result] = await db.execute(sql, params);

      if (result.affectedRows === 0) {
        return buildResponse(null, "room not found", 404);
      }
    }

    const roomResp = await exports.getRoomById(id);
    return buildResponse(roomResp.data, "room updated", 200);
  } catch (err) {
    console.error("updateRoom error:", err);
    return buildResponse(null, `updateRoom error: ${err.message}`, 500);
  }
};

// ==========================================
// DELETE ROOM
// ==========================================
exports.deleteRoom = async (id) => {
  try {
    const currentResp = await exports.getRoomById(id);
    if (!currentResp.data) {
      return buildResponse(null, "room not found", 404);
    }

    await deleteAllRoomImages(id); // ลบรูปทั้งหมดออกจาก disk + room_images ก่อน

    const [result] = await db.execute(`DELETE FROM rooms WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return buildResponse(null, "room not found", 404);
    }

    return buildResponse({ id }, "room deleted", 200);
  } catch (err) {
    console.error("deleteRoom error:", err);
    return buildResponse(null, `deleteRoom error: ${err.message}`, 500);
  }
};

exports.buildResponse = buildResponse;