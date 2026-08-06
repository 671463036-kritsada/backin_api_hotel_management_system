const express = require("express");
const controller = require("../controllers/houskeeper_issues_controller");

const router = express.Router();

router.post("/", controller.createIssue);
router.get("/", controller.getIssues);
router.get("/:id", controller.getIssueById);

module.exports = router;
