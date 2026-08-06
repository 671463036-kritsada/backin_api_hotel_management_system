const express = require("express");
const checkinController = require("../controllers/checkin_controller");

const router = express.Router();

router.post("/", checkinController.createCheckIn);
router.get("/", checkinController.getCheckIns);
router.get("/:id", checkinController.getCheckInById);

module.exports = router;
