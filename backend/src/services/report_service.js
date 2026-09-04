const reportModel = require("../models/report_model");

/**
 * ดึงรายงานรายวัน แล้ว format ให้ตรงกับ shape ที่ frontend (ReportModel) ต้องการ:
 * [ { date: "2026-01-07", rooms: 7, price: 9100 }, ... ]
 *
 * ที่นี่ไม่ควรมี SQL หรือเงื่อนไขการกรองข้อมูล (นั่นเป็นหน้าที่ของ model)
 * หน้าที่ของ service คือ orchestrate + shape ข้อมูลให้ controller ใช้ต่อได้เลย
 */
async function getDailyReports({ startDate, endDate } = {}) {
  const rows = await reportModel.getDailyReports({ startDate, endDate });

  return rows.map((row) => ({
    date:
      row.date instanceof Date
        ? row.date.toISOString().slice(0, 10)
        : String(row.date),
    rooms: Number(row.rooms) || 0,
    price: Number(row.price) || 0,
  }));
}

module.exports = {
  getDailyReports,
};