const overviewService = require("../services/overview_service");

/**
 * GET /api/overview
 */
async function getOverview(req, res) {
  try {
    const data = await overviewService.getOverview();
    return res.status(200).json(data);
  } catch (error) {
    console.error("getOverview error:", error);
    return res.status(500).json({ message: "Failed to fetch overview" });
  }
}

module.exports = {
  getOverview,
};