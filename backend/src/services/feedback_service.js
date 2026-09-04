const feedbackModel = require("../models/feedback_model");

/**
 * ดึง feedback แล้ว format ให้ตรงกับ shape ที่ frontend ต้องการ:
 * [ { id, user, rating, comment, date }, ... ]
 *
 * date เป็น string "YYYY-MM-DD" มาจาก SQL ตรงๆ แล้ว (ดู feedback.model.js)
 */
async function getFeedbacks() {
  const rows = await feedbackModel.getFeedbacks();

  return rows.map((row) => ({
    id: row.id,
    user: row.customer_name || "ไม่ระบุชื่อ",
    rating: Number(row.rating) || 0,
    comment: row.comment || "",
    date: row.date,
  }));
}

module.exports = {
  getFeedbacks,
};