const db = require("../config/db");

function buildResponse(data, message = "success", statusCode = 200) {
  return { data, message, statusCode };
}

async function getAllFurniture(roomId) {
  const [rows] = await db.execute(
    `SELECT id, room_id AS roomId, title, image, is_extra AS isExtra
     FROM furnitures
     ${roomId ? "WHERE room_id = ?" : ""}
     ORDER BY room_id, id`,
    roomId ? [roomId] : [],
  );
  return buildResponse(rows);
}

async function createFurniture(data) {
  const roomId = data.roomId || data.room_id;
  const title = String(data.title || "").trim();
  if (!roomId || !title)
    return buildResponse(null, "ต้องระบุห้องและชื่อ furniture", 400);

  const [result] = await db.execute(
    `INSERT INTO furnitures (room_id, title, image, is_extra)
     VALUES (?, ?, ?, ?)`,
    [roomId, title, data.image || null, data.isExtra ? 1 : 0],
  );
  return buildResponse({ id: result.insertId }, "เพิ่ม furniture สำเร็จ", 201);
}

async function updateFurniture(id, data) {
  const fields = [];
  const values = [];
  if (data.roomId !== undefined || data.room_id !== undefined) {
    fields.push("room_id = ?");
    values.push(data.roomId ?? data.room_id);
  }
  if (data.title !== undefined) {
    const title = String(data.title).trim();
    if (!title) return buildResponse(null, "ชื่อ furniture ต้องไม่ว่าง", 400);
    fields.push("title = ?");
    values.push(title);
  }
  if (data.image !== undefined) {
    fields.push("image = ?");
    values.push(data.image || null);
  }
  if (data.isExtra !== undefined) {
    fields.push("is_extra = ?");
    values.push(data.isExtra ? 1 : 0);
  }
  if (!fields.length) return buildResponse(null, "ไม่มีข้อมูลสำหรับแก้ไข", 400);

  values.push(id);
  const [result] = await db.execute(
    `UPDATE furnitures SET ${fields.join(", ")} WHERE id = ?`,
    values,
  );
  if (!result.affectedRows) return buildResponse(null, "ไม่พบ furniture", 404);
  return buildResponse({ id: Number(id) }, "แก้ไข furniture สำเร็จ");
}

async function deleteFurniture(id) {
  const [references] = await db.execute(
    "SELECT COUNT(*) AS count FROM furniture_inspections WHERE furniture_id = ?",
    [id],
  );
  if (references[0].count > 0) {
    return buildResponse(
      null,
      "ลบไม่ได้ เนื่องจากมีประวัติการตรวจ furniture นี้แล้ว",
      409,
    );
  }

  const [result] = await db.execute("DELETE FROM furnitures WHERE id = ?", [
    id,
  ]);
  if (!result.affectedRows) return buildResponse(null, "ไม่พบ furniture", 404);
  return buildResponse({ id: Number(id) }, "ลบ furniture สำเร็จ");
}

async function confirmUserCondition(bookingId, userId) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [bookings] = await connection.execute(
      `SELECT id FROM bookings
       WHERE id = ? AND user_id = ?
         AND status NOT IN ('REJECTED', 'ยกเลิก', 'CHECKED_OUT')
       LIMIT 1`,
      [bookingId, userId],
    );
    if (!bookings.length) {
      await connection.rollback();
      return buildResponse(null, "ไม่พบ booking หรือไม่มีสิทธิ์ยืนยัน", 404);
    }

    await connection.execute(
      `UPDATE bookings
       SET inspection_status = 'USER_CONFIRMED', updated_at = NOW()
       WHERE id = ?`,
      [bookingId],
    );
    await connection.commit();
    return buildResponse(
      {
        bookingId,
        inspectionStatus: "USER_CONFIRMED",
        confirmedAt: new Date(),
      },
      "ยืนยันสภาพห้องสำเร็จ",
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getFurnitureByRoomAndBooking(roomId, bookingId) {
  const [rows] = await db.query(
    `
    SELECT
      f.id,
      f.room_id AS roomId,
      f.title,
      f.image,
      f.is_extra AS isCustom,

      /* Housekeeper */
      hk.inspector_id AS housekeeperInspectorId,
      hkUser.name AS housekeeperInspectorName,
      hkUser.role AS housekeeperInspectorRole,
      hk.status AS housekeeperStatus,
      hk.note AS housekeeperNote,
      hk.inspection_image AS housekeeperInspectionImage,
      hk.inspected_at AS housekeeperInspectedAt,

      /* User */
      ui.inspector_id AS inspectorId,
      userData.name AS inspectorName,
      userData.role AS inspectorRole,
      ui.status AS userStatus,
      ui.note AS userNote,
      ui.inspection_image AS userInspectionImage,
      ui.inspected_at AS userInspectedAt

    FROM furnitures f

    LEFT JOIN furniture_inspections hk
      ON hk.id = (
        SELECT hk2.id
        FROM furniture_inspections hk2
        LEFT JOIN users hkUser2
          ON hkUser2.id = hk2.inspector_id
        WHERE hk2.furniture_id = f.id
          AND hk2.booking_id IS NULL
          AND LOWER(TRIM(hkUser2.role))
              IN ('housekeeper', 'แม่บ้าน')
        ORDER BY
          hk2.inspected_at DESC,
          hk2.id DESC
        LIMIT 1
      )

    LEFT JOIN users hkUser
      ON hkUser.id = hk.inspector_id

    LEFT JOIN furniture_inspections ui
      ON ui.id = (
        SELECT ui2.id
        FROM furniture_inspections ui2
        WHERE ui2.furniture_id = f.id
          AND ui2.booking_id = NULLIF(?, '')
        ORDER BY
          ui2.inspected_at DESC,
          ui2.id DESC
        LIMIT 1
      )

    LEFT JOIN users userData
      ON userData.id = ui.inspector_id

    WHERE f.room_id = ?

    ORDER BY f.id
    `,
    [bookingId, roomId],
  );

  return rows.map((row) => ({
    id: row.id,
    roomId: row.roomId,
    title: row.title,
    image: row.image,
    isCustom: Boolean(row.isCustom),

    // Housekeeper
    housekeeperStatus: row.housekeeperStatus,

    housekeeperNote: row.housekeeperNote,

    housekeeperInspectionImage: row.housekeeperInspectionImage,

    // สำหรับ Flutter เดิม
    lastStatus: row.housekeeperStatus,

    lastNote: row.housekeeperNote,

    lastDamageImage: row.housekeeperInspectionImage,

    // User
    inspections: row.inspectorId
      ? [
          {
            inspectorId: row.inspectorId,

            inspectorName: row.inspectorName,

            inspectorRole: row.inspectorRole,

            status: row.userStatus,

            note: row.userNote,

            inspectionImage: row.userInspectionImage,

            damageImage: row.userInspectionImage,

            inspectedAt: row.userInspectedAt,
          },
        ]
      : [],
  }));
}

async function createFurnitureInspection(data) {
  let furnitureId = data.furnitureId;

  const inspectionImage = data.inspectionImage || null;
  console.log("========== FURNITURE INSPECTION ==========");
  console.log("furnitureId:", furnitureId);
  console.log("status:", data.status);
  console.log("inspectorRole:", data.inspectorRole);
  console.log("inspectionImage:", inspectionImage);
  console.log("===========================================");

  /*
   * เพิ่มของนอกรายการ
   */
  if (!furnitureId) {
    const [result] = await db.execute(
      `
      INSERT INTO furnitures
        (
          room_id,
          title,
          image,
          is_extra
        )
      VALUES (?, ?, ?, 1)
      `,
      [data.roomId, data.title, inspectionImage || data.image || null],
    );

    furnitureId = result.insertId;
  } else if (
    ["housekeeper", "แม่บ้าน"].includes(
      String(data.inspectorRole || "")
        .trim()
        .toLowerCase(),
    ) &&
    data.status === "ปกติ"
  ) {
    console.log("🔥 UPDATE FURNITURE IMAGE");

    if (inspectionImage) {
      console.log("🔥 image:", inspectionImage);
      console.log("🔥 furnitureId:", furnitureId);

      await db.execute(
        `
      UPDATE furnitures
      SET image = ?
      WHERE id = ?
      `,
        [inspectionImage, furnitureId],
      );
    } else {
      console.log("❌ ไม่มี inspectionImage");
    }
  }
  /*
   * ถ้า "ชำรุด"
   * ไม่เอารูปชำรุดไปทับ furnitures.image
   */

  /*
   * เก็บประวัติ inspection ทุกครั้ง
   */
  const [result] = await db.execute(
    `
    INSERT INTO furniture_inspections
    (
      furniture_id,
      booking_id,
      inspector_id,
      inspector_role,
      status,
      note,
      inspection_image,
      inspected_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      furnitureId,
      data.bookingId || null,
      data.inspectorId,
      data.inspectorRole,
      data.status,
      data.note || null,
      inspectionImage,
    ],
  );

  return {
    insertId: result.insertId,
    furnitureId,
  };
}

module.exports = {
  getAllFurniture,
  createFurniture,
  updateFurniture,
  deleteFurniture,
  confirmUserCondition,
  getFurnitureByRoomAndBooking,
  createFurnitureInspection,
};

// const db = require("../config/db");

// async function getFurnitureByRoomAndBooking(roomId, bookingId) {
//   const [rows] = await db.query(
//     `
//     SELECT
//       f.id,
//       f.room_id AS roomId,
//       f.title,
//       f.image,
//       f.is_extra AS isCustom,

//       fi.inspector_id AS inspectorId,
//       u.name AS inspectorName,
//       u.role AS inspectorRole,
//       fi.status,
//       fi.note,
//       fi.inspection_image AS damageImage,
//       fi.inspected_at AS inspectedAt

//     FROM furnitures f

//     LEFT JOIN furniture_inspections fi
//       ON fi.id = (
//         SELECT fi2.id
//         FROM furniture_inspections fi2
//         LEFT JOIN users u2
//           ON u2.id = fi2.inspector_id
//         WHERE fi2.furniture_id = f.id
//           AND (
//             fi2.booking_id = ?
//             OR (
//               fi2.booking_id IS NULL
//               -- ✅ แก้บั๊ก: เดิมเช็คแค่ 'housekeeper' ตัวเดียว ทำให้ user ที่มี
//               -- role เก็บเป็น 'แม่บ้าน' (ค่าที่ auth_middleware.js ก็ยอมรับอยู่แล้ว)
//               -- ไม่ถูกดึงผลตรวจมาแสดงเลย ทั้งที่ login และบันทึกข้อมูลได้ปกติ
//               AND LOWER(u2.role) IN ('housekeeper', 'แม่บ้าน')
//             )
//           )
//         ORDER BY
//           CASE
//             WHEN fi2.booking_id = ? THEN 0
//             ELSE 1
//           END,
//           fi2.inspected_at DESC,
//           fi2.id DESC
//         LIMIT 1
//       )

//     LEFT JOIN users u
//       ON u.id = fi.inspector_id

//     WHERE f.room_id = ?
//     ORDER BY f.id
//     `,
//     [bookingId, bookingId, roomId],
//   );

//   return rows.map((row) => ({
//     id: row.id,
//     roomId: row.roomId,
//     title: row.title,
//     image: row.image,
//     isCustom: Boolean(row.isCustom),
//     inspections: row.inspectorId
//       ? [
//           {
//             inspectorId: row.inspectorId,
//             inspectorName: row.inspectorName,
//             inspectorRole: row.inspectorRole,
//             status: row.status,
//             note: row.note,
//             damageImage: row.damageImage,
//             inspectedAt: row.inspectedAt,
//           },
//         ]
//       : [],
//   }));
// }

// async function createFurnitureInspection(data) {
//   let furnitureId = data.furnitureId;

//   // ถ้าเป็นของนอกรายการ → สร้าง Furniture ใหม่
//   if (!furnitureId) {
//     const [result] = await db.execute(
//       `
//       INSERT INTO furnitures
//         (room_id, title, image, is_extra)
//       VALUES (?, ?, ?, 1)
//       `,
//       [data.roomId, data.title, data.damageImage || data.image || null],
//     );

//     furnitureId = result.insertId;
//   } else {
//     // Furniture ที่มีอยู่แล้ว
//     // อัปเดตรูปหลักให้เป็นรูปที่แม่บ้านถ่ายล่าสุด
//     if (data.damageImage) {
//       await db.execute(
//         `
//         UPDATE furnitures
//         SET image = ?
//         WHERE id = ?
//         `,
//         [data.damageImage, furnitureId],
//       );
//     }
//   }

//   // เก็บประวัติการตรวจไว้เหมือนเดิม
//   const [result] = await db.execute(
//     `
//     INSERT INTO furniture_inspections
//       (
//         furniture_id,
//         booking_id,
//         inspector_id,
//         inspector_role,
//         status,
//         note,
//         inspection_image,
//         inspected_at
//       )
//     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
//     `,
//     [
//       furnitureId,
//       data.bookingId,
//       data.inspectorId,
//       data.inspectorRole,
//       data.status,
//       data.note || null,
//       data.damageImage || null,
//     ],
//   );

//   return {
//     insertId: result.insertId,
//     furnitureId,
//   };
// }

// // async function createFurnitureInspection(data) {
// //   // ไม่แก้อะไร — ยัง insert ทุกครั้งเหมือนเดิม เพื่อเก็บประวัติไว้ครบ
// //   let furnitureId = data.furnitureId;
// //   if (!furnitureId) {
// //     const [result] = await db.execute(
// //       `INSERT INTO furnitures (room_id, title, image, is_extra) VALUES (?, ?, ?, 1)`,
// //       [data.roomId, data.title, data.image || null],
// //     );
// //     furnitureId = result.insertId;
// //   }
// //   const [result] = await db.execute(
// //     `INSERT INTO furniture_inspections
// //        (furniture_id, booking_id, inspector_id, inspector_role , status, note, inspection_image, inspected_at)
// //      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
// //     [
// //       furnitureId,
// //       data.bookingId,
// //       data.inspectorId,
// //       data.inspectorRole,
// //       data.status,
// //       data.note || null,
// //       data.damageImage || null,
// //     ],
// //   );
// //   return { insertId: result.insertId, furnitureId };
// // }

// module.exports = {
//   getFurnitureByRoomAndBooking,
//   createFurnitureInspection,
// };

// const db = require("../config/db");

// async function getFurnitureByRoomAndBooking(roomId, bookingId) {
//   const [rows] = await db.query(
//     `
//     SELECT
//       f.id,
//       f.room_id AS roomId,
//       f.title,
//       f.image,
//       f.is_extra AS isCustom,

//       fi.inspector_id AS inspectorId,
//       u.name AS inspectorName,
//       u.role AS inspectorRole,
//       fi.status,
//       fi.note,
//       fi.inspection_image AS damageImage,
//       fi.inspected_at AS inspectedAt

//     FROM furnitures f

//     LEFT JOIN furniture_inspections fi
//       ON fi.id = (
//         SELECT fi2.id
//         FROM furniture_inspections fi2
//         LEFT JOIN users u2
//           ON u2.id = fi2.inspector_id
//         WHERE fi2.furniture_id = f.id
//           AND (
//             fi2.booking_id = ?
//             OR (
//               fi2.booking_id IS NULL
//               AND LOWER(u2.role) = 'housekeeper'
//             )
//           )
//         ORDER BY
//           CASE
//             WHEN fi2.booking_id = ? THEN 0
//             ELSE 1
//           END,
//           fi2.inspected_at DESC,
//           fi2.id DESC
//         LIMIT 1
//       )

//     LEFT JOIN users u
//       ON u.id = fi.inspector_id

//     WHERE f.room_id = ?
//     ORDER BY f.id
//     `,
//     [bookingId, bookingId, roomId]
//   );

//   return rows.map((row) => ({
//     id: row.id,
//     roomId: row.roomId,
//     title: row.title,
//     image: row.image,
//     isCustom: Boolean(row.isCustom),
//     inspections: row.inspectorId
//       ? [
//           {
//             inspectorId: row.inspectorId,
//             inspectorName: row.inspectorName,
//             inspectorRole: row.inspectorRole,
//             status: row.status,
//             note: row.note,
//             damageImage: row.damageImage,
//             inspectedAt: row.inspectedAt,
//           },
//         ]
//       : [],
//   }));
// }

// async function createFurnitureInspection(data) {
//   // ไม่แก้อะไร — ยัง insert ทุกครั้งเหมือนเดิม เพื่อเก็บประวัติไว้ครบ
//   let furnitureId = data.furnitureId;
//   if (!furnitureId) {
//     const [result] = await db.execute(
//       `INSERT INTO furnitures (room_id, title, image, is_extra) VALUES (?, ?, ?, 1)`,
//       [data.roomId, data.title, data.image || null],
//     );
//     furnitureId = result.insertId;
//   }
//   const [result] = await db.execute(
//     `INSERT INTO furniture_inspections
//        (furniture_id, booking_id, inspector_id, status, note, inspection_image, inspected_at)
//      VALUES (?, ?, ?, ?, ?, ?, NOW())`,
//     [
//       furnitureId,
//       data.bookingId,
//       data.inspectorId,
//       data.status,
//       data.note || null,
//       data.damageImage || null,
//     ],
//   );
//   return { insertId: result.insertId, furnitureId };
// }

// module.exports = {
//   getFurnitureByRoomAndBooking,
//   createFurnitureInspection,
// };
