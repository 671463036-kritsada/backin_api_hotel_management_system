const furnitureModel = require("../models/furniture_model");
const bookingModel = require("../models/booking_model");

function buildResponse(
  data,
  message = "success",
  statusCode = 200,
) {
  return {
    message,
    statusCode,
    data,
  };
}

async function getFurniture(roomId, bookingId = "") {
  const data =
    await furnitureModel.getFurnitureByRoomAndBooking(
      roomId,
      bookingId,
    );

  return buildResponse(data);
}

async function submitReport(
  reportItems,
  inspectorId,
  inspectorRole,
  files = {},
) {
  const results = [];

  for (let i = 0; i < reportItems.length; i++) {
    const item = reportItems[i];

    const inspection = item.inspections?.[0];

    // รูปของ furniture รายการนี้
    const inspectionImage =
      files[`photo_${i}`] || null;

    const result =
      await furnitureModel.createFurnitureInspection({
        furnitureId: item.isCustom
          ? null
          : item.id,

        roomId: item.roomId,
        bookingId: item.bookingId,

        title: item.title,
        image: item.image,

        inspectorId,
        inspectorRole,

        status: inspection?.status,
        note: inspection?.note,

        inspectionImage,
      });

    results.push(result);
  }

  const bookingId =
    reportItems[0]?.bookingId;

  if (bookingId) {
    await bookingModel.updateInspectionStatus(
      bookingId,
      "COMPLETED",
    );
  }

  return buildResponse(
    results,
    "furniture inspection submitted",
    201,
  );
}

module.exports = {
  getFurniture,
  submitReport,
};


// const fs = require("fs");
// const path = require("path");
// const furnitureModel = require("../models/furniture_model");
// const bookingModel = require("../models/booking_model");

// const UPLOAD_BASE = path.join(__dirname, "..", "uploads", "imageData", "furnitureImage");

// // ✅ ใช้ตั้งค่า host ผ่าน env (ตั้งค่าใน .env เช่น APP_BASE_URL=http://localhost:2000)
// // ถ้าไม่ตั้งไว้ fallback เป็น localhost:2000 กันพลาดตอน dev
// const BASE_URL = process.env.APP_BASE_URL || "http://localhost:2000";

// function saveFurniturePhoto(file, roomId) {
//   const safeRoomId = String(roomId || "unknown").replace(/[^a-zA-Z0-9_-]/g, "_");
//   const dir = path.join(UPLOAD_BASE, safeRoomId);
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

//   const ext = path.extname(file.originalname).toLowerCase();
//   const filename = `furniture_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
//   const fullPath = path.join(dir, filename);
//   fs.writeFileSync(fullPath, file.buffer);
//   return `imageData/furnitureImage/${safeRoomId}/${filename}`;
// }

// // ✅ เพิ่มใหม่: แปลง path สัมพัทธ์ที่เก็บใน DB ให้เป็น URL เต็มก่อนส่งกลับ
// // client เช็ค http(s):// นำหน้าไว้ด้วย เผื่อมีข้อมูลเก่าที่ยังเป็น URL เต็ม
// // จาก Firebase Storage ปนอยู่ (จะได้ไม่ไปต่อ prefix ซ้ำจนพัง)
// function toFullImageUrl(relativePath) {
//   if (!relativePath) return relativePath;
//   if (/^https?:\/\//i.test(relativePath)) return relativePath;
//   return `${BASE_URL}/uploads/${relativePath}`;
// }

// function buildResponse(data, message = "success", statusCode = 200) {
//   return { message, statusCode, data };
// }

// async function getFurniture(roomId, bookingId = "") {
//   const data = await furnitureModel.getFurnitureByRoomAndBooking(roomId, bookingId);

//   // ✅ แปลง damageImage ของทุก inspection ให้เป็น URL เต็มก่อนส่งออก
//   const withFullUrls = data.map((item) => ({
//     ...item,
//     inspections: (item.inspections || []).map((insp) => ({
//       ...insp,
//       damageImage: toFullImageUrl(insp.damageImage),
//     })),
//   }));

//   return buildResponse(withFullUrls);
// }

// async function submitReport(reportItems, inspectorId, inspectorRole , files = []) {
//   const fileMap = {};
//   for (const file of files) {
//     fileMap[file.fieldname] = file;
//   }

//   const results = [];
//   for (let i = 0; i < reportItems.length; i++) {
//     const item = reportItems[i];
//     const inspection = item.inspections?.[0];

//     let damageImagePath = null;
//     const file = fileMap[`photo_${i}`];
//     if (file) {
//       // มีรูปใหม่รอบนี้ -> เซฟรูปใหม่ตามปกติ
//       damageImagePath = saveFurniturePhoto(file, item.roomId);
//     } else if (inspection?.lastDamageImage) {
//       // ✅ แก้บั๊ก: ไม่มีรูปใหม่รอบนี้ -> ใช้ path/URL เดิมจากรอบก่อนต่อไป
//       // กันไม่ให้ query "ผลตรวจล่าสุด" (เลือกแถวล่าสุดเสมอ) เจอ damage_image
//       // เป็น NULL ทั้งที่จริง ๆ มีรูปอยู่จากการตรวจรอบก่อนหน้า
//       damageImagePath = inspection.lastDamageImage;
//     }

//     const result = await furnitureModel.createFurnitureInspection({
//       furnitureId: item.isCustom ? null : item.id,
//       roomId: item.roomId,
//       bookingId: item.bookingId,
//       title: item.title,
//       image: item.image,
//       inspectorId,
//       inspectorRole,
//       status: inspection?.status,
//       note: inspection?.note,
//       damageImage: damageImagePath,
//     });
//     results.push(result);
//   }

//   const bookingId = reportItems[0]?.bookingId;
//   if (bookingId) {
//     await bookingModel.updateInspectionStatus(bookingId, "COMPLETED");
//   }

//   return buildResponse(results, "furniture inspection submitted", 201);
// }

// module.exports = { getFurniture, submitReport };