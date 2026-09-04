const express = require("express");
const router = express.Router();
const overviewController = require("../controllers/overview_controller");

// GET /api/overview
router.get("/", overviewController.getOverview);

module.exports = router;