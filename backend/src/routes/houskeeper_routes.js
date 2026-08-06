const express = require("express");
const houskeeperController = require("../controllers/houskeeper_controller");

const router = express.Router();

router.get("/", houskeeperController.getHousekeeper);

module.exports = router;
