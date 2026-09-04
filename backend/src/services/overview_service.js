const overviewModel = require("../models/overview_model");

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// แปลง "YYYY-MM-DD" -> { day, month, year } โดยไม่ผ่าน Date object (กันปัญหา timezone)
function parseDateParts(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { day, month, year };
}

// สร้าง label ช่วงวันที่แบบไทย เช่น "18-20 ก.พ. 2569" หรือ "28 ส.ค. - 1 ก.ย. 2569" ถ้าคนละเดือน
function formatDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return '-';
  const start = parseDateParts(checkIn);
  const end = parseDateParts(checkOut);

  if (start.year === end.year && start.month === end.month) {
    return `${start.day}-${end.day} ${THAI_MONTHS[start.month - 1]} ${start.year + 543}`;
  }
  return `${start.day} ${THAI_MONTHS[start.month - 1]} - ${end.day} ${THAI_MONTHS[end.month - 1]} ${end.year + 543}`;
}

async function getOverview() {
  const [totalRooms, occupiedRooms, revenueToday, recentBookingsRaw] = await Promise.all([
    overviewModel.getTotalRooms(),
    overviewModel.getOccupiedRoomsToday(),
    overviewModel.getRevenueToday(),
    overviewModel.getRecentBookings(5),
  ]);

  const availableRooms = Math.max(totalRooms - occupiedRooms, 0);
  const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const recentBookings = recentBookingsRaw.map((row) => ({
    customerName: row.customer_name || '-',
    roomType: row.room_type || '-',
    dateRange: formatDateRange(row.check_in, row.check_out),
    status: row.status || '-',
  }));

  return {
    occupiedRooms,
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