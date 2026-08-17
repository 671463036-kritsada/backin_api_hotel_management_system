const express = require("express");
const furnitureController = require("../controllers/furniture_controller");
const {authMiddleware} = require("../middleware/auth_middleware");

const router = express.Router();

router.get("/", furnitureController.getFurniture);
router.post("/report", authMiddleware, furnitureController.submitReport);

module.exports = router;