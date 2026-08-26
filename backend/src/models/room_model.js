const db = require("../config/db");
const { generateRoomId } = require("../utils/id_generator");
const fs = require("fs");
const path = require("path");

// โฟลเดอร์ปลายทางของรูป (ต้องตรงกับที่ server.js เปิด static ไว้: uploads/imageData/...)
const UPLOAD_BASE = path.join(__dirname, "..", "uploads", "imageData");

function getSubfolder(roomType) {
  return roomType === "house" ? "housesImage" : "roomsImage";
}

// เซฟรูปจาก buffer ลง disk แล้วคืนค่า relative path ที่จะเก็บใน DB
function saveRoomImage(file, roomType) {
  const subfolder = getSubfolder(roomType);
  const dir = path.join(UPLOAD_BASE, subfolder);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const ext = path.extname(file.originalname).toLowerCase();
  const filename = `${subfolder}_${Date.now()}${ext}`;
  const fullPath = path.join(dir, filename);

  fs.writeFileSync(fullPath, file.buffer);

  // relative path ที่เก็บใน DB (ตรงกับที่ server.js expose ผ่าน /api/uploads/imageData/...)
  return `imageData/${subfolder}/${filename}`;
}

// ลบรูปเก่าออกจาก disk (ลบเฉพาะรูปที่เป็นไฟล์ในระบบเราเอง ไม่ใช่ URL ภายนอก)
function deleteRoomImage(relativePath) {
  if (!relativePath || !relativePath.startsWith("imageData/")) return;

  const fullPath = path.join(__dirname, "..", "uploads", relativePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== "ENOENT") {
      console.error("deleteRoomImage error:", err.message);
    }
  });
}

function buildResponse(data, message = "success", statusCode = 200) {
  return {
    message,
    statusCode,
    data,
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
        r.image_url AS imageUrl,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        CASE
          WHEN b.room_id IS NOT NULL THEN 'มีผู้พัก'
          ELSE 'ว่าง'
        END AS status
      FROM rooms r
      LEFT JOIN bookings b
  ON b.room_id = r.id
  AND b.status NOT IN ('ยกเลิก', 'CHECKED_OUT', 'REJECTED')
  AND b.check_in <= CURDATE()
  AND b.check_out > CURDATE()
      GROUP BY r.id
      ORDER BY r.id ASC
    `);

    return buildResponse(rows);
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
        r.image_url AS imageUrl,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        CASE
          WHEN b.room_id IS NOT NULL THEN 'มีผู้พัก'
          ELSE 'ว่าง'
        END AS status
      FROM rooms r
      LEFT JOIN bookings b
  ON b.room_id = r.id
  AND b.status NOT IN ('ยกเลิก', 'CHECKED_OUT', 'REJECTED')
  AND b.check_in <= CURDATE()
  AND b.check_out > CURDATE()
      WHERE r.id = ?
      GROUP BY r.id
      `,
      [id],
    );

    if (!rows.length) {
      return buildResponse(null, "room not found", 404);
    }

    return buildResponse(rows[0]);
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
        r.image_url AS imageUrl,
        r.created_at AS createdAt,
        r.updated_at AS updatedAt,
        'ว่าง' AS status
      FROM rooms r
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

    sql += ` ORDER BY r.id ASC`;

    const [rows] = await db.query(sql, params);

    return buildResponse(rows);
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
exports.createRoom = async (data, file) => {
  try {
    const roomType = data.roomType || data.room_type || "rooms";
    const normalizedType = roomType === "house" ? "house" : "room";

    const name = data.name || data.roomName || null;
    const description = data.description ?? null;
    const price = Number(data.pricePerNight ?? data.price ?? 0);

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

    // เซฟรูปจริงลง uploads แทนการรับ imageUrl ตรงๆ
    let imageUrl = null;
    if (file) {
      imageUrl = saveRoomImage(file, roomType);
    } else if (data.imageUrl) {
      imageUrl = data.imageUrl; // fallback เผื่อไม่มีไฟล์ (เช่น placeholder)
    }

    await db.execute(
      `
      INSERT INTO rooms (id, room_type, name, description, price, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [id, roomType, name, description, price, imageUrl],
    );

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
exports.updateRoom = async (id, data, file) => {
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

    // ถ้ามีการอัปโหลดรูปใหม่ -> ลบรูปเก่า แล้วเซฟรูปใหม่แทน
    if (file) {
      const currentResp = await exports.getRoomById(id);
      if (!currentResp.data) {
        return buildResponse(null, "room not found", 404);
      }

      const roomType =
        data.roomType ?? data.room_type ?? currentResp.data.roomType;
      const newImageUrl = saveRoomImage(file, roomType);

      deleteRoomImage(currentResp.data.imageUrl); // ลบรูปเก่าทิ้ง

      fields.push("image_url = ?");
      params.push(newImageUrl);
    }

    if (fields.length === 0) {
      return buildResponse(null, "no fields to update", 400);
    }

    params.push(id);
    const sql = `UPDATE rooms SET ${fields.join(", ")} WHERE id = ?`;
    const [result] = await db.execute(sql, params);

    if (result.affectedRows === 0) {
      return buildResponse(null, "room not found", 404);
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

    const [result] = await db.execute(`DELETE FROM rooms WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return buildResponse(null, "room not found", 404);
    }

    deleteRoomImage(currentResp.data.imageUrl); // ลบรูปออกจาก disk ด้วย

    return buildResponse({ id }, "room deleted", 200);
  } catch (err) {
    console.error("deleteRoom error:", err);
    return buildResponse(null, `deleteRoom error: ${err.message}`, 500);
  }
};

exports.buildResponse = buildResponse;

//version เก่า

// const db = require("../config/db");
// const { generateRoomId } = require("../utils/id_generator");

// function buildResponse(data, message = "success", statusCode = 200) {
//   return { message, statusCode, data };
// }

// exports.getRooms = async () => {
//   try {
//     const [rows] = await db.query(
//       `SELECT id AS roomId, room_type AS roomType, name, description, price AS pricePerNight, image_url AS imageUrl, created_at AS createdAt FROM rooms`,
//     );
//     return buildResponse(rows);
//   } catch (err) {
//     return buildResponse(null, `getRooms error: ${err.message}`, 500);
//   }
// };

// exports.getRoomById = async (id) => {
//   try {
//     const [rows] = await db.query(
//       `SELECT id AS roomId, room_type AS roomType, name, description, price AS pricePerNight, image_url AS imageUrl, created_at AS createdAt FROM rooms WHERE id = ?`,
//       [id],
//     );
//     if (!rows.length) return buildResponse(null, "room not found", 404);
//     return buildResponse(rows[0]);
//   } catch (err) {
//     return buildResponse(null, `getRoomById error: ${err.message}`, 500);
//   }
// };

// exports.getAvailableRooms = async ({ checkIn, checkOut, roomType }) => {
//   try {
//     let sql = `
//       SELECT id AS roomId, room_type AS roomType, name, description, price AS pricePerNight, image_url AS imageUrl, created_at AS createdAt
//       FROM rooms r
//       WHERE r.id NOT IN (
//         SELECT b.room_id
//         FROM bookings b
//         WHERE b.room_id IS NOT NULL
//           AND b.status NOT IN ('ยกเลิก')
//           AND b.check_in < ?
//           AND b.check_out > ?
//       )
//     `;

//     const params = [checkOut, checkIn];

//     if (roomType) {
//       sql += ` AND r.room_type = ?`;
//       params.push(roomType);
//     }

//     sql += ` ORDER BY r.id ASC`;

//     const [rows] = await db.query(sql, params);
//     return buildResponse(rows);
//   } catch (err) {
//     return buildResponse(null, `getAvailableRooms error: ${err.message}`, 500);
//   }
// };

// // เช็คว่าห้องนี้ว่างในช่วงวันที่ที่ระบุไหม (ใช้ก่อนสร้าง booking เพื่อป้องกันการจองซ้ำ)
// exports.isRoomAvailable = async (roomId, checkIn, checkOut) => {
//   const [rows] = await db.query(
//     `
//     SELECT COUNT(*) AS count
//     FROM bookings
//     WHERE room_id = ?
//       AND status NOT IN ('ยกเลิก', 'REJECTED')
//       AND check_in < ?
//       AND check_out > ?
//     `,
//     [roomId, checkOut, checkIn],
//   );
//   return rows[0].count === 0;
// };

// // หาลำดับถัดไปของแต่ละประเภทห้อง โดยนับจากจำนวนห้องที่มี prefix เดียวกันอยู่แล้ว
// async function getNextSeq(roomType) {
//   const prefix = roomType === "house" ? "H" : "R";
//   const [rows] = await db.execute(
//     `SELECT id FROM rooms
//      WHERE id REGEXP BINARY ?
//      ORDER BY CAST(SUBSTRING(id, 2) AS UNSIGNED) DESC
//      LIMIT 1`,
//     [`^${prefix}[0-9]+$`],
//   );
//   if (rows.length === 0) return 1;
//   const lastId = rows[0].id;
//   const lastSeq = parseInt(lastId.slice(1), 10);
//   return lastSeq + 1;
// }

// exports.createRoom = async (data) => {
//   try {
//     const imageUrl =
//       (Array.isArray(data.imageUrls) && data.imageUrls[0]) ||
//       data.imageUrl ||
//       null;

//     const roomType = data.roomType || data.room_type || "rooms";
//     const normalizedType = roomType === "house" ? "house" : "room";

//     let id = data.id;
//     if (!id) {
//       const seq = await getNextSeq(normalizedType);
//       id = generateRoomId(normalizedType, seq);
//     }

//     const [result] = await db.execute(
//       `INSERT INTO rooms (id, room_type, name, description, price, image_url, created_at)
//        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
//       [
//         id,
//         roomType,
//         data.name || data.roomName || null,
//         data.description || null,
//         data.pricePerNight || data.price || 0,
//         imageUrl,
//       ],
//     );
//     const roomResp = await exports.getRoomById(id);
//     return buildResponse(roomResp.data, "room created", 201);
//   } catch (err) {
//     return buildResponse(null, `createRoom error: ${err.message}`, 500);
//   }
// };

// exports.updateRoomStatus = async (id,) => {
//   try {
//     const [result] = await db.execute(
//       `UPDATE rooms updated_at = NOW() WHERE id = ?`,
//       [id],
//     );
//     if (result.affectedRows === 0)
//       return buildResponse(null, "room not found", 404);

//     const roomResp = await exports.getRoomById(id);
//     return buildResponse(roomResp.data, "room updated", 200);
//   } catch (err) {
//     return buildResponse(null, `updateRoomStatus error: ${err.message}`, 500);
//   }
// };

// exports.updateRoom = async (id, data) => {
//   try {
//     const fields = [];
//     const params = [];

//     if (data.roomType || data.room_type) {
//       fields.push("room_type = ?");
//       params.push(data.roomType || data.room_type);
//     }
//     if (data.name || data.roomName) {
//       fields.push("name = ?");
//       params.push(data.name || data.roomName);
//     }
//     if (data.description) {
//       fields.push("description = ?");
//       params.push(data.description);
//     }
//     if (data.pricePerNight || data.price) {
//       fields.push("price = ?");
//       params.push(data.pricePerNight || data.price);
//     }

//     if (data.imageUrls || data.imageUrl) {
//       const imageUrl =
//         (Array.isArray(data.imageUrls) && data.imageUrls[0]) || data.imageUrl;
//       fields.push("image_url = ?");
//       params.push(imageUrl || null);
//     }

//     if (fields.length === 0) {
//       return buildResponse(null, "no fields to update", 400);
//     }

//     params.push(id);
//     const sql = `UPDATE rooms SET ${fields.join(", ")}, created_at = NOW() WHERE id = ?`;
//     await db.execute(sql, params);

//     const roomResp = await exports.getRoomById(id);
//     return buildResponse(roomResp.data, "room updated", 200);
//   } catch (err) {
//     return buildResponse(null, `updateRoom error: ${err.message}`, 500);
//   }
// };

// exports.deleteRoom = async (id) => {
//   try {
//     const [result] = await db.execute(`DELETE FROM rooms WHERE id = ?`, [id]);
//     if (result.affectedRows === 0)
//       return buildResponse(null, "room not found", 404);
//     return buildResponse({ id }, "room deleted", 200);
//   } catch (err) {
//     return buildResponse(null, `deleteRoom error: ${err.message}`, 500);
//   }
// };

// exports.buildResponse = buildResponse;
