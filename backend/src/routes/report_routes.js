const express = require("express");
const router = express.Router();
const reportController = require("../controllers/report_controller");

// GET /api/reports?startDate=2026-01-01&endDate=2026-12-31
router.get("/", reportController.getReports);

module.exports = router;