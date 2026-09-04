const reportService = require("../services/report_service");

/**
 * GET /api/reports
 * Query params (optional): startDate, endDate  (format: YYYY-MM-DD)
 *
 * Controller มีหน้าที่แค่รับ req, ส่งต่อ service, แล้ว return response
 * ไม่ควรมี business logic หรือ query อยู่ในนี้
 */
async function getReports(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const data = await reportService.getDailyReports({ startDate, endDate });

    return res.status(200).json(data);
  } catch (error) {
    console.error("getReports error:", error);
    return res.status(500).json({ message: "Failed to fetch reports" });
  }
}

module.exports = {
  getReports,
};