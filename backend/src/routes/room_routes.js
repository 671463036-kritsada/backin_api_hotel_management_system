const express = require("express");
const roomController = require("../controllers/room_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");
const router = express.Router();

// Public 
router.get("/", roomController.getRooms);
router.get("/:id", roomController.getRoomById);

// Admin only - ต้อง login และเป็น admin เท่านั้น
router.post("/", authMiddleware, isAdmin, roomController.createRoom);
router.put("/:id", authMiddleware, isAdmin, roomController.updateRoom);
router.delete("/:id", authMiddleware, isAdmin, roomController.deleteRoom);

module.exports = router;