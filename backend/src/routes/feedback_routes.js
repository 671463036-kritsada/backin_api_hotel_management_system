const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedback_controller");

// GET /api/feedbacks
router.get("/", feedbackController.getFeedbacks);

module.exports = router;