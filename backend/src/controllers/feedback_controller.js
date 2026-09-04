const feedbackService = require("../services/feedback_service");

/**
 * GET /api/feedbacks
 */
async function getFeedbacks(req, res) {
  try {
    const data = await feedbackService.getFeedbacks();
    return res.status(200).json(data);
  } catch (error) {
    console.error("getFeedbacks error:", error);
    return res.status(500).json({ message: "Failed to fetch feedbacks" });
  }
}

module.exports = {
  getFeedbacks,
};