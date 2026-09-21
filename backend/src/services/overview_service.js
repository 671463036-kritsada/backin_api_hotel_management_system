const overviewModel = require("../models/overview_model");

const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/**
 * แปลง YYYY-MM-DD
 * โดยไม่ใช้ Date เพื่อป้องกัน timezone
 */
function parseDateParts(dateStr) {
  const [year, month, day] = dateStr
    .split("-")
    .map(Number);

  return {
    day,
    month,
    year,
  };
}

/**
 * สร้างข้อความวันที่ภาษาไทย
 */
function formatDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) {
    return "-";
  }

  const start = parseDateParts(checkIn);
  const end = parseDateParts(checkOut);

  if (
    start.year === end.year &&
    start.month === end.month
  ) {
    return `${start.day}-${end.day} ${
      THAI_MONTHS[start.month - 1]
    } ${start.year + 543}`;
  }

  return `${start.day} ${
    THAI_MONTHS[start.month - 1]
  } - ${end.day} ${
    THAI_MONTHS[end.month - 1]
  } ${end.year + 543}`;
}

async function getOverview() {
  const [
    totalRooms,
    todayBookings,
    occupiedRooms,
    reservedRooms,
    revenueToday,
    recentBookingsRaw,
  ] = await Promise.all([
    overviewModel.getTotalRooms(),

    overviewModel.getTodayBookings(),

    overviewModel.getOccupiedRoomsToday(),

    overviewModel.getReservedRooms(),

    overviewModel.getRevenueToday(),

    overviewModel.getRecentBookings(5),
  ]);

  /**
   * ห้องว่าง
   *
   * ห้องทั้งหมด - ห้องที่ถูกจองแล้ว
   */
  const availableRooms = Math.max(
    totalRooms - reservedRooms,
    0
  );

  /**
   * อัตราการเข้าพักจริง
   *
   * ใช้ occupiedRooms
   * ไม่ใช่ reservedRooms
   */
  const occupancyRate =
    totalRooms > 0
      ? (occupiedRooms / totalRooms) * 100
      : 0;

  const recentBookings =
    recentBookingsRaw.map((row) => ({
      customerName:
        row.customer_name || "-",

      roomType:
        row.room_type || "-",

      dateRange:
        formatDateRange(
          row.check_in,
          row.check_out
        ),

      status:
        row.status || "-",
    }));

  return {
    todayBookings,

    occupiedRooms,

    reservedRooms,

    revenueToday,

    availableRooms,

    totalRooms,

    occupancyRate,

    recentBookings,
  };
}

module.exports = {
  getOverview,
};