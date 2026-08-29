const express = require("express");
const roomController = require("../controllers/room_controller");
const { authMiddleware } = require("../middleware/auth_middleware");
const { isAdmin } = require("../middleware/role_middleware");
const uploadRoomImage = require("../middleware/upload_room_image"); // เพิ่ม

const router = express.Router();

router.get("/", roomController.getRooms);
router.get("/available", roomController.getAvailableRooms);
router.get("/:id", roomController.getRoomById);

router.post(
  "/",
  authMiddleware,
  isAdmin,
  uploadRoomImage.array("images", 10), // รับได้สูงสุด 10 รูป, field name เปลี่ยนเป็น "images"
  roomController.createRoom,
);
router.put(
  "/:id",
  authMiddleware,
  isAdmin,
  uploadRoomImage.array("images", 10), 
  roomController.updateRoom,
);
router.delete("/:id", authMiddleware, isAdmin, roomController.deleteRoom);

module.exports = router;