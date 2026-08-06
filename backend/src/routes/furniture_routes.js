const express = require("express");
const furnitureController = require("../controllers/furniture_controller");

const router = express.Router();

router.get("/", furnitureController.getFurniture);
router.get("/:id", furnitureController.getFurnitureById);
router.post("/", furnitureController.createFurniture);
router.put("/:id", furnitureController.updateFurniture);
router.delete("/:id", furnitureController.deleteFurniture);

module.exports = router;
