const db = require("../config/db");

function buildResponse(data, message = "success", statusCode = 200) {
  return {
    message,
    statusCode,
    data,
  };
}

function normalizeCleaningStatus(status) {
  const value = String(status || "")
    .trim()
    .toLowerCase();

  if (
    value.includes("รอทำความสะอาด") ||
    value.includes("ยังไม่ได้ทำความสะอาด")
  ) {
    return "รอทำความสะอาด";
  }

  if (value.includes("เสร็จ") || value.includes("complete")) {
    return "ทำความสะอาดเสร็จสิ้น";
  }

  if (value.includes("กำลังทำ") || value.includes("cleaning")) {
    return "กำลังทำความสะอาด";
  }

  if (value.includes("ตรวจสอบ") || value.includes("ตรวจ")) {
    return "รอตรวจสอบ";
  }

  if (
    value.includes("ปิดปรับปรุง") ||
    value.includes("maintenance") ||
    value.includes("repair")
  ) {
    return "ปิดปรับปรุง";
  }

  if (value.includes("ลูกค้า") || value.includes("occupied")) {
    return "มีลูกค้าพักอยู่";
  }

  return "ยังไม่ได้ทำความสะอาด";
}

async function getHousekeeperData() {
  const [rows] = await db.query(`
    SELECT
      r.id AS roomNo,
      COALESCE(NULLIF(r.building, 0), 1) AS building,
      r.cleaning_status AS cleaningStatus,
      r.is_under_maintenance AS isUnderMaintenance,
      r.room_type AS roomType,
      r.name AS roomName,
      r.description,
      r.price,
      r.created_at AS createdAt,
      r.updated_at AS updatedAt
    FROM rooms r
    LEFT JOIN (
      SELECT
        room_id,
        COUNT(*) AS activeStayCount,
        MAX(do_not_disturb) AS doNotDisturb
      FROM bookings
      WHERE status = 'CHECKED_IN'
        AND check_in_status = 'CHECKED_IN'
        AND COALESCE(check_out_status, '') <> 'CHECKED_OUT'
      GROUP BY room_id
    ) active_stays ON active_stays.room_id = r.id
    ORDER BY
      COALESCE(NULLIF(r.building, 0), 1),
      r.id
  `);

  const data = rows.map((row) => {
    const status =
      Number(row.isUnderMaintenance) === 1
        ? "ปิดปรับปรุง"
        : Number(row.activeStayCount) > 0
          ? Number(row.doNotDisturb) === 1
            ? "ห้ามรบกวน"
            : "มีลูกค้าพักอยู่"
          : normalizeCleaningStatus(row.cleaningStatus);

    return {
      roomNo: String(row.roomNo),
      building: String(row.building || 1),
      cleaningStatus: status,
      status,
      roomType: row.roomType,
      roomName: row.roomName,
      description: row.description,
      price: row.price,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });

  return buildResponse(data);
}

async function updateCleaningStatus(roomNo, cleaningStatus) {
  const allowedStatuses = [
    "ยังไม่ได้ทำความสะอาด",
    "รอทำความสะอาด",
    "กำลังทำความสะอาด",
    "ทำความสะอาดเสร็จสิ้น",
    "รอตรวจสอบ",
    "ปิดปรับปรุง",
    "มีลูกค้าพักอยู่",
  ];

  if (!allowedStatuses.includes(cleaningStatus)) {
    return buildResponse(null, "สถานะการทำความสะอาดไม่ถูกต้อง", 400);
  }

  const [result] = await db.query(
    `
      UPDATE rooms
      SET cleaning_status = ?, updated_at = NOW()
      WHERE id = ?
    `,
    [cleaningStatus, roomNo],
  );

  if (result.affectedRows === 0) {
    return buildResponse(null, "ไม่พบห้องที่ระบุ", 404);
  }

  return buildResponse(
    {
      roomNo,
      cleaningStatus,
    },
    "อัปเดตสถานะห้องสำเร็จ",
  );
}

module.exports = {
  getHousekeeperData,
  updateCleaningStatus,
};
